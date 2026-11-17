import { isRepositoryError } from '../errors';
import { createFakeRepository, DECLINED_MESSAGE, TAKEN_ON_SEND_DJ_ID } from '../fakeRepository';
import { bookingsOf } from '@/test-utils/bookings';

/** Late Service: Sat, Nov 28 in Atlanta, a draft with KOYO and NIGHTFORM added and no offers sent. */
const EVENT = 'e_late_service';
const KOYO = { djId: 'dj_koyo', offerCents: 45000, note: 'Headline set', clientOfferId: 'offer_test_1' };

const make = (options: Parameters<typeof createFakeRepository>[0] = {}) => createFakeRepository({ delayMs: 0, ...options });
const code = async (work: Promise<unknown>) => work.then(() => null, (e) => (isRepositoryError(e) ? e.code : String(e)));

describe('fake server: offers and the card hold', () => {
  it('quotes the fee, the service fee and the total to hold', async () => {
    expect(await make().quoteOffer(EVENT, 'dj_koyo', 45000)).toEqual({ offerCents: 45000, serviceFeeCents: 700, totalCents: 45700 });
  });

  it('creates a request that needs payment, with the server’s total, and takes the DJ off the unsent offers', async () => {
    const repo = make();
    const booking = await repo.createOffer(EVENT, KOYO);
    expect(booking).toMatchObject({ status: 'authorization_required', offerCents: 45000, totalCents: 45700, note: 'Headline set' });
    expect((await bookingsOf(repo, EVENT)).map((b) => b.requestId)).toEqual([booking.requestId]);
    expect((await repo.getDraftOffers(EVENT)).map((o) => o.dj.id)).toEqual(['dj_nightform']);
  });

  it('returns the original request for a repeated clientOfferId: one DJ, one request', async () => {
    const repo = make();
    const first = await repo.createOffer(EVENT, KOYO);
    const again = await repo.createOffer(EVENT, { ...KOYO, offerCents: 99900 });
    expect(again.requestId).toBe(first.requestId);
    expect(again.totalCents).toBe(first.totalCents);
    expect(repo.fake.requestCount(EVENT)).toBe(1);
  });

  it('keeps one request when the first answer is lost and the app retries with the same id', async () => {
    const repo = make({ simulation: { timeoutNextOffer: true } });
    expect(await code(repo.createOffer(EVENT, KOYO))).toBe('timeout');
    const retried = await repo.createOffer(EVENT, KOYO);
    expect(retried.status).toBe('authorization_required');
    expect(repo.fake.requestCount(EVENT)).toBe(1);
  });

  it('answers offer_open for a different offer to a DJ who already has one open', async () => {
    const repo = make();
    const first = await repo.createOffer(EVENT, KOYO);
    const error = await repo.createOffer(EVENT, { ...KOYO, clientOfferId: 'offer_test_2' }).catch((e) => e);
    expect(error).toMatchObject({ code: 'offer_open', requestId: first.requestId });
    expect(repo.fake.requestCount(EVENT)).toBe(1);
  });

  it('refuses a fee that is not a positive whole number of cents', async () => {
    const repo = make();
    expect(await code(repo.createOffer(EVENT, { ...KOYO, offerCents: 0 }))).toBe('invalid_offer');
    expect(await code(repo.createOffer(EVENT, { ...KOYO, offerCents: 450.5 }))).toBe('invalid_offer');
  });

  it('answers dj_unavailable with no reason and stores nothing', async () => {
    const repo = make({ simulation: { djTakenNext: true } });
    const error = await repo.createOffer(EVENT, KOYO).catch((e) => e);
    expect(error.code).toBe('dj_unavailable');
    // The code and nothing else: no reason, no other booking, no message beyond the code.
    expect(Object.keys(error).sort()).toEqual(['code', 'name', 'requestId', 'totalCents'].sort());
    expect(error.requestId).toBeUndefined();
    expect(error.message).toBe('dj_unavailable');
    expect(repo.fake.requestCount(EVENT)).toBe(0);
    // That DJ no longer shows as open that night.
    expect((await repo.getTalent(EVENT)).djs.map((d) => d.id)).not.toContain('dj_koyo');
  });

  it('has one sample DJ who is open in Browse talent and taken when the offer is sent', async () => {
    const repo = make();
    const open = await repo.getTalent(EVENT, { budget: '300_to_600' });
    expect(open.djs.map((d) => d.id)).toContain(TAKEN_ON_SEND_DJ_ID);
    expect(await code(repo.createOffer(EVENT, { ...KOYO, djId: TAKEN_ON_SEND_DJ_ID }))).toBe('dj_unavailable');
  });

  it('gives a payment session with the server’s total, and moves the request to requested once the hold succeeds', async () => {
    const repo = make();
    const booking = await repo.createOffer(EVENT, KOYO);
    const session = await repo.createPaymentSession(booking.requestId);
    expect(session).toMatchObject({ totalCents: 45700, merchantDisplayName: 'Memberly' });
    expect(session.clientSecret).toBeTruthy();
    expect(session.publishableKey).toBeTruthy();
    expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.now());
    // No saved cards: nothing about a customer comes back.
    expect(Object.keys(session).join(' ')).not.toMatch(/customer|ephemeral/i);

    expect(await repo.fake.confirmPayment(session.clientSecret)).toEqual({ status: 'succeeded' });
    expect((await bookingsOf(repo, EVENT))[0].status).toBe('requested');
    // Paid for: there is nothing left to pay.
    expect(await code(repo.createPaymentSession(booking.requestId))).toBe('not_payable');
  });

  it('leaves the request needing payment after a declined card', async () => {
    const repo = make();
    const booking = await repo.createOffer(EVENT, KOYO);
    const session = await repo.createPaymentSession(booking.requestId);
    expect(await repo.fake.declinePayment(session.clientSecret)).toEqual({ status: 'failed', message: DECLINED_MESSAGE });
    expect((await bookingsOf(repo, EVENT))[0].status).toBe('authorization_required');
  });

  it('makes a fresh session each time, and can hand back one that has already expired', async () => {
    const repo = make({ simulation: { expiredSessions: 1 } });
    const booking = await repo.createOffer(EVENT, KOYO);
    const expired = await repo.createPaymentSession(booking.requestId);
    expect(Date.parse(expired.expiresAt)).toBeLessThan(Date.now());
    expect((await repo.fake.confirmPayment(expired.clientSecret)).status).toBe('failed');
    const fresh = await repo.createPaymentSession(booking.requestId);
    expect(fresh.clientSecret).not.toBe(expired.clientSecret);
    expect(Date.parse(fresh.expiresAt)).toBeGreaterThan(Date.now());
    expect((await bookingsOf(repo, EVENT))[0].status).toBe('authorization_required');
  });

  it('fails every call as offline when told to', async () => {
    const repo = make({ simulation: { offline: true } });
    expect(await code(repo.quoteOffer(EVENT, 'dj_koyo', 45000))).toBe('offline');
    expect(await code(repo.createOffer(EVENT, KOYO))).toBe('offline');
    repo.fake.simulate({ offline: false });
    expect((await repo.createOffer(EVENT, KOYO)).status).toBe('authorization_required');
  });

  it('shows whatever total the server works out, not a sum the app could redo', async () => {
    // The test environment's figure for a $450 offer (GEL-1016).
    const repo = make({ quote: () => ({ serviceFeeCents: 2096, totalCents: 47096 }) });
    expect((await repo.quoteOffer(EVENT, 'dj_koyo', 45000)).totalCents).toBe(47096);
    const booking = await repo.createOffer(EVENT, KOYO);
    expect(booking.totalCents).toBe(47096);
    expect((await repo.createPaymentSession(booking.requestId)).totalCents).toBe(47096);
  });
});

describe('fake server: pass orders', () => {
  const ROOFTOP = 'e_rooftop_hours';
  const general = { passTypeId: 'pt_rooftop_general', quantity: 1, idempotencyKey: 'pass_test_1', expectedPriceCents: 3000 };

  it('lists pass types with price, what is included, sold out and free for members', async () => {
    const types = await make().getPassTypes(ROOFTOP);
    expect(types.map((t) => [t.name, t.priceCents, t.soldOut, t.freeForMembers])).toEqual([
      ['General pass', 3000, false, false],
      ['Member pass', 0, false, true],
      ['Table for four', 24000, true, false],
    ]);
    expect(types.every((t) => t.included.length > 0)).toBe(true);
  });

  it('creates a pending order with a payment for the server’s total, and the same one for the same key', async () => {
    const repo = make();
    const order = await repo.createPassOrder(ROOFTOP, general);
    expect(order).toMatchObject({ status: 'pending', totalCents: 3000 });
    expect(order.payment?.totalCents).toBe(3000);
    const again = await repo.createPassOrder(ROOFTOP, general);
    expect(again.orderId).toBe(order.orderId);
    expect(again.payment?.clientSecret).toBe(order.payment?.clientSecret);
    expect(repo.fake.passOrderCount()).toBe(1);
  });

  it('marks the order paid after the payment, and puts the pass on Home, Events and the Card', async () => {
    const repo = make();
    const order = await repo.createPassOrder(ROOFTOP, general);
    expect((await repo.getPassOrder(order.orderId)).status).toBe('pending');
    await repo.fake.confirmPayment(order.payment!.clientSecret);
    expect((await repo.getPassOrder(order.orderId)).status).toBe('paid');
    expect((await repo.getEvent(ROOFTOP))?.viewerHasPass).toBe(true);
    expect((await repo.getTonight('Atlanta')).filter((e) => e.viewerHasPass).map((e) => e.id)).toContain(ROOFTOP);
    expect((await repo.getMyEvents('upcoming')).find((e) => e.id === ROOFTOP)?.relation).toBe('pass');
    expect((await repo.getCard()).passes?.map((p) => [p.eventName, p.passName])).toContainEqual(['Rooftop Hours', 'General pass']);
    // Asking again with the same key never opens a second payment.
    expect((await repo.createPassOrder(ROOFTOP, general)).payment).toBeUndefined();
  });

  it('claims a members-free pass at once, with no payment', async () => {
    const repo = make();
    const order = await repo.createPassOrder(ROOFTOP, { ...general, passTypeId: 'pt_rooftop_member', expectedPriceCents: 0 });
    expect(order).toMatchObject({ status: 'paid', totalCents: 0 });
    expect(order.payment).toBeUndefined();
    expect((await repo.getEvent(ROOFTOP))?.viewerHasPass).toBe(true);
  });

  it('answers pass_unavailable when the pass is sold out, and creates no order', async () => {
    const repo = make();
    expect(await code(repo.createPassOrder(ROOFTOP, { ...general, passTypeId: 'pt_rooftop_table', expectedPriceCents: 24000 }))).toBe(
      'pass_unavailable',
    );
    repo.fake.simulate({ soldOutNext: true });
    expect(await code(repo.createPassOrder(ROOFTOP, general))).toBe('pass_unavailable');
    expect((await repo.getPassTypes(ROOFTOP))[0].soldOut).toBe(true);
    expect(repo.fake.passOrderCount()).toBe(0);
  });

  it('answers price_changed with the new total when the price moved', async () => {
    const repo = make({ simulation: { priceChangeNext: true } });
    const error = await repo.createPassOrder(ROOFTOP, general).catch((e) => e);
    expect(error).toMatchObject({ code: 'price_changed', totalCents: 3500 });
    expect(repo.fake.passOrderCount()).toBe(0);
    const order = await repo.createPassOrder(ROOFTOP, { ...general, expectedPriceCents: 3500 });
    expect(order.totalCents).toBe(3500);
  });

  it('keeps a slow order pending until the backend settles it', async () => {
    const repo = make({ simulation: { slowPassOrder: true }, slowPassConfirmMs: Infinity });
    const order = await repo.createPassOrder(ROOFTOP, general);
    await repo.fake.confirmPayment(order.payment!.clientSecret);
    expect((await repo.getPassOrder(order.orderId)).status).toBe('pending');
    expect((await repo.getEvent(ROOFTOP))?.viewerHasPass).toBe(false);
    repo.fake.settlePassOrders();
    expect((await repo.getPassOrder(order.orderId)).status).toBe('paid');
  });
});
