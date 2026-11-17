import { bookingsOf } from '@/test-utils/bookings';

import { isRepositoryError } from '../errors';
import { ALL_STATUSES_EVENT_ID, createFakeRepository, LAUNCH_TTL_MS, TEST_PORTAL_ORIGIN, type PortalAction } from '../fakeRepository';
import type { EventBookings, EventFields } from '../types';
import { BOOKING_STATUSES } from '@/features/booking/status';

/** Warehouse Friday: NIGHTFORM unpaid, BLKMTN requested, KOYO confirmed. */
const EVENT = 'e_warehouse_friday';
const BLKMTN = 'br_blkmtn';

const make = (options: Parameters<typeof createFakeRepository>[0] = {}) => createFakeRepository({ delayMs: 0, ...options });
const code = async (work: Promise<unknown>) => work.then(() => null, (e) => (isRepositoryError(e) ? e.code : String(e)));
const full = async (repo: ReturnType<typeof make>, eventId = EVENT) => (await repo.getEventBookings(eventId)) as EventBookings;
const statusOf = async (repo: ReturnType<typeof make>, requestId: string, eventId = EVENT) =>
  (await bookingsOf(repo, eventId)).find((b) => b.requestId === requestId)?.status;

describe('fake server: bookings with an ETag', () => {
  it('answers "not modified" for the ETag it last gave, and in full without one', async () => {
    const repo = make();
    const first = await full(repo);
    expect(first.etag).toBeTruthy();
    expect(first.bookings).toHaveLength(3);
    expect(await repo.getEventBookings(EVENT, { ifNoneMatch: first.etag })).toEqual({ notModified: true });
    expect(await repo.getEventBookings(EVENT, { ifNoneMatch: 'W/"something-else"' })).toMatchObject({ etag: first.etag });
    expect(repo.fake.bookingFetches(EVENT)).toEqual({ full: 2, notModified: 1 });
  });

  it('changes the ETag only when the bookings change', async () => {
    const repo = make();
    const before = (await full(repo)).etag;
    // Reads, drafts and another event's bookings leave it alone.
    await repo.getDraftOffers(EVENT);
    await repo.addDraftOffer(EVENT, (await repo.getTalent(EVENT)).djs[0]);
    repo.fake.setStatus('br_sessions_koyo', 'requested');
    expect((await full(repo)).etag).toBe(before);

    repo.fake.setStatus(BLKMTN, 'confirmed');
    const after = (await full(repo)).etag;
    expect(after).not.toBe(before);
    expect(await repo.getEventBookings(EVENT, { ifNoneMatch: before })).toMatchObject({ etag: after });
    expect(await repo.getEventBookings(EVENT, { ifNoneMatch: after })).toEqual({ notModified: true });
  });

  it('gives a new ETag when an offer is sent and when its hold succeeds', async () => {
    const repo = make();
    const event = 'e_late_service';
    const empty = (await full(repo, event)).etag;
    const booking = await repo.createOffer(event, { djId: 'dj_koyo', offerCents: 45000, note: '', clientOfferId: 'c1' });
    const sent = (await full(repo, event)).etag;
    expect(sent).not.toBe(empty);
    const session = await repo.createPaymentSession(booking.requestId);
    await repo.fake.confirmPayment(session.clientSecret);
    expect((await full(repo, event)).etag).not.toBe(sent);
  });

  it('answers with the last known body and stale: true while Gelatin is slow', async () => {
    const repo = make();
    const fresh = await full(repo);
    repo.fake.simulate({ staleBookings: true });
    const held = await full(repo);
    expect(held.stale).toBe(true);
    repo.fake.setStatus(BLKMTN, 'confirmed');
    // Still the body from before the change, even with the matching ETag.
    const stale = (await repo.getEventBookings(EVENT, { ifNoneMatch: fresh.etag })) as EventBookings;
    expect(stale.stale).toBe(true);
    expect(stale.bookings.find((b) => b.requestId === BLKMTN)?.status).toBe('requested');

    repo.fake.simulate({ staleBookings: false });
    const caughtUp = await full(repo);
    expect(caughtUp.stale).toBeUndefined();
    expect(caughtUp.bookings.find((b) => b.requestId === BLKMTN)?.status).toBe('confirmed');
  });

  it('fails booking reads on demand', async () => {
    const repo = make({ simulation: { failBookings: true } });
    expect(await code(repo.getEventBookings(EVENT))).toBe('timeout');
  });

  it('seeds one event with a booking in each of the eight statuses', async () => {
    const repo = make();
    const all = await bookingsOf(repo, ALL_STATUSES_EVENT_ID);
    expect(all.map((b) => b.status)).toEqual([...BOOKING_STATUSES]);
    expect(new Set(all.map((b) => b.dj.id)).size).toBe(8);
  });

  it('passes an unknown status through untouched', async () => {
    const repo = make();
    repo.fake.setStatus(BLKMTN, 'awaiting_review');
    expect(await statusOf(repo, BLKMTN)).toBe('awaiting_review');
  });

  it('carries no reason, message or history on a booking that ended', async () => {
    const repo = make();
    repo.fake.playDj(BLKMTN, 'pass');
    const passed = (await bookingsOf(repo, EVENT)).find((b) => b.requestId === BLKMTN)!;
    expect(Object.keys(passed).sort()).toEqual(['dj', 'newOfferCents', 'note', 'offerCents', 'requestId', 'setTime', 'status', 'totalCents']);
    expect(passed.newOfferCents).toBeNull();
    // The note is the organizer's own, sent with the offer.
    expect(passed.note).toBe('Opening set');
  });
});

describe('fake server: the test portal plays the DJ', () => {
  const cases: [PortalAction, string][] = [
    ['accept', 'confirmed'],
    ['pass', 'declined'],
    ['expire', 'expired'],
    ['cancel', 'cancelled'],
  ];
  it.each(cases)('%s moves a requested booking to %s', async (action, status) => {
    const repo = make();
    repo.fake.playDj(BLKMTN, action);
    expect(await statusOf(repo, BLKMTN)).toBe(status);
  });

  it('counter reads negotiating, then the DJ’s new price lands as reauthorization_required', async () => {
    const repo = make();
    repo.fake.playDj(BLKMTN, 'counter');
    expect(await statusOf(repo, BLKMTN)).toBe('negotiating');
    repo.fake.settleCounters();
    const countered = (await bookingsOf(repo, EVENT)).find((b) => b.requestId === BLKMTN)!;
    expect(countered.status).toBe('reauthorization_required');
    expect(countered.newOfferCents).toBeGreaterThan(countered.offerCents);
    // The original total stands until a new hold is made.
    expect(countered.totalCents).toBe(39700);
  });

  it('lands a counter by itself after a while', async () => {
    jest.useFakeTimers();
    try {
      const repo = make({ counterMs: 4000 });
      repo.fake.playDj(BLKMTN, 'counter');
      jest.advanceTimersByTime(3999);
      expect(repo.fake.portalBooking(BLKMTN)?.booking.status).toBe('negotiating');
      jest.advanceTimersByTime(1);
      expect(repo.fake.portalBooking(BLKMTN)?.booking.status).toBe('reauthorization_required');
    } finally {
      jest.useRealTimers();
    }
  });

  it('charges an accepted counter at the new price, with the server’s total', async () => {
    const repo = make({ quote: (offerCents) => ({ serviceFeeCents: 900, totalCents: offerCents + 900 }) });
    repo.fake.playDj(BLKMTN, 'counter');
    repo.fake.settleCounters();
    const { newOfferCents } = repo.fake.portalBooking(BLKMTN)!.booking;
    repo.fake.playDj(BLKMTN, 'accept');
    const { booking } = repo.fake.portalBooking(BLKMTN)!;
    expect(booking).toMatchObject({ status: 'confirmed', offerCents: newOfferCents, totalCents: newOfferCents! + 900, newOfferCents: null });
  });

  it('a pass after a counter stops the counter from landing', async () => {
    const repo = make();
    repo.fake.playDj(BLKMTN, 'counter');
    repo.fake.playDj(BLKMTN, 'pass');
    repo.fake.settleCounters();
    expect(await statusOf(repo, BLKMTN)).toBe('declined');
  });
});

describe('fake server: alternates', () => {
  it('lists DJs open that night, without the DJ who passed or anyone holding a booking on the event', async () => {
    const repo = make();
    repo.fake.playDj(BLKMTN, 'pass');
    const ids = (await repo.getAlternates(BLKMTN)).map((dj) => dj.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).not.toContain('dj_blkmtn');
    // KOYO is confirmed and NIGHTFORM has an open request on this event.
    expect(ids).not.toContain('dj_koyo');
    expect(ids).not.toContain('dj_nightform');
    expect(ids).toContain('dj_sable');
  });

  it('gives DJs in the catalog’s shape: no city, band or reason', async () => {
    const repo = make();
    repo.fake.playDj(BLKMTN, 'pass');
    for (const dj of await repo.getAlternates(BLKMTN)) {
      expect(dj).not.toHaveProperty('city');
      expect(dj).not.toHaveProperty('band');
      expect(dj).not.toHaveProperty('takenOn');
      expect(dj).not.toHaveProperty('reason');
    }
  });

  it('is empty when nobody else is open, and not_found for a request it does not know', async () => {
    const repo = make({ simulation: { noAlternates: true } });
    expect(await repo.getAlternates(BLKMTN)).toEqual([]);
    expect(await code(repo.getAlternates('br_nobody'))).toBe('not_found');
  });

  it('fails as the catalog does when Gelatin cannot be reached', async () => {
    const repo = make({ talentMode: () => 'unavailable' });
    expect(await code(repo.getAlternates(BLKMTN))).toBe('catalog_unavailable');
  });
});

describe('fake server: portal launches', () => {
  it('mints a fresh launch each time, good for 60 seconds, pointing nowhere real', async () => {
    const repo = make();
    const before = Date.now();
    const a = await repo.createPortalLaunch(BLKMTN);
    const b = await repo.createPortalLaunch(BLKMTN);
    expect(a.launchUrl).not.toBe(b.launchUrl);
    expect(a.launchUrl.startsWith(`${TEST_PORTAL_ORIGIN}/launch/`)).toBe(true);
    expect(TEST_PORTAL_ORIGIN.endsWith('.invalid')).toBe(true);
    const ttl = Date.parse(a.expiresAt) - before;
    expect(ttl).toBeGreaterThan(LAUNCH_TTL_MS - 1000);
    expect(ttl).toBeLessThanOrEqual(LAUNCH_TTL_MS + 1000);
    expect(repo.fake.portalLaunchCount()).toBe(2);
  });

  it('opens once: a second use, an expired launch and a made-up one all fail', async () => {
    const repo = make({ simulation: { expiredLaunches: 1 } });
    const expired = await repo.createPortalLaunch(BLKMTN);
    expect(Date.parse(expired.expiresAt)).toBeLessThan(Date.now());
    expect(repo.fake.redeemLaunch(expired.launchUrl)).toBeNull();

    const good = await repo.createPortalLaunch(BLKMTN);
    expect(repo.fake.redeemLaunch(good.launchUrl)).toMatchObject({ eventId: EVENT, eventName: 'Warehouse Friday', booking: { requestId: BLKMTN } });
    expect(repo.fake.redeemLaunch(good.launchUrl)).toBeNull();
    expect(repo.fake.redeemLaunch(`${TEST_PORTAL_ORIGIN}/launch/guess`)).toBeNull();
  });

  it('has no way into Gelatin before a hold exists', async () => {
    const repo = make();
    // NIGHTFORM's request is unpaid.
    expect(await code(repo.createPortalLaunch('br_nightform'))).toBe('portal_unavailable');
    expect(await code(repo.createPortalLaunch('br_nobody'))).toBe('not_found');
    expect(repo.fake.portalLaunchCount()).toBe(0);
  });
});

describe('fake server: a date change with bookings', () => {
  const fieldsOf = async (repo: ReturnType<typeof make>, id: string): Promise<EventFields> => {
    const { name, tagline, description, cover, date, startTime, endTime, venue, city } = (await repo.getOrganizerEvent(id))!;
    return { name, tagline, description, cover, date, startTime, endTime, venue, city };
  };
  const move = async (repo: ReturnType<typeof make>, id: string, date: string) =>
    repo.saveEvent({ id, communityId: 'c_second_sundays', publish: true, fields: { ...(await fieldsOf(repo, id)), date } });

  it('refuses with confirmed_booking while a DJ is confirmed, naming the booking', async () => {
    const repo = make();
    const error = await move(repo, EVENT, '2026-11-21').catch((e) => e);
    expect(isRepositoryError(error, 'confirmed_booking')).toBe(true);
    expect(error.requestId).toBe('br_koyo');
    expect((await repo.getOrganizerEvent(EVENT))?.date).toBe('2026-11-20');
  });

  it('refuses with open_bookings while offers are open and none is confirmed', async () => {
    const repo = make();
    repo.fake.playDj('br_koyo', 'cancel');
    expect(await code(move(repo, EVENT, '2026-11-21'))).toBe('open_bookings');
    expect((await repo.getOrganizerEvent(EVENT))?.date).toBe('2026-11-20');
  });

  it('saves a new date once every booking has ended, and withdraws nothing itself', async () => {
    const repo = make();
    repo.fake.playDj('br_koyo', 'cancel');
    repo.fake.playDj(BLKMTN, 'pass');
    repo.fake.playDj('br_nightform', 'expire');
    expect((await move(repo, EVENT, '2026-11-21')).date).toBe('2026-11-21');
    expect((await bookingsOf(repo, EVENT)).map((b) => b.status)).toEqual(['expired', 'declined', 'cancelled']);
  });

  it('saves a new date with no bookings, and with DJs added but not sent', async () => {
    const repo = make();
    expect((await move(repo, 'e_long_table', '2026-11-29')).date).toBe('2026-11-29');
    // Late Service has two drafts and no bookings.
    expect((await move(repo, 'e_late_service', '2026-12-05')).date).toBe('2026-12-05');
    expect(await repo.getDraftOffers('e_late_service')).toHaveLength(2);
  });

  it('saves other changes on an event with bookings', async () => {
    const repo = make();
    const fields = await fieldsOf(repo, EVENT);
    const saved = await repo.saveEvent({ id: EVENT, communityId: 'c_second_sundays', publish: true, fields: { ...fields, venue: 'A different room' } });
    expect(saved.venue).toBe('A different room');
  });
});
