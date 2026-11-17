import { useEffect } from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { createFakeRepository, sampleDjs, type FakeRepository } from '@/data/fakeRepository';
import type { Booking, EventFields } from '@/data/types';
import { BACK_FROM_GELATIN, CONTINUE_TITLE } from '@/features/handoff/copy';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { dateChangeBlock, dateChangeCopy, recheckNotice } from '../dateChange';
import { EventFormScreen } from '../EventFormScreen';
import { useEventDraft, type EventDraft } from '../EventDraftProvider';
import { WhenWhereScreen } from '../WhenWhereScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Warehouse Friday, Fri, Nov 20: NIGHTFORM unpaid, BLKMTN requested, KOYO confirmed. */
const EVENT = 'e_warehouse_friday';

async function draftOf(repository: FakeRepository, id: string): Promise<EventDraft> {
  const { name, tagline, description, cover, date, startTime, endTime, venue, city, communityId } = (await repository.getOrganizerEvent(id))!;
  const fields: EventFields = { name, tagline, description, cover, date, startTime, endTime, venue, city };
  return { key: id, communityId, session: 't', fields };
}

/** Date & time for a saved event, as the form opens it. */
async function dateAndTime(repository: FakeRepository, id = EVENT) {
  await renderWithProviders(<WhenWhereScreen />, { repository, draft: await draftOf(repository, id) });
  // The guard reads the saved event and its bookings.
  await act(async () => {
    await repository.getOrganizerEvent(id);
    await repository.getEventBookings(id);
  });
}

const day = (iso: string) => screen.getByTestId(`day-${iso}`);
const selected = (iso: string) => day(iso).props.accessibilityState.selected;

const booking = (dj: keyof typeof sampleDjs, status: Booking['status']): Booking => ({
  requestId: `br_${dj}`,
  dj: sampleDjs[dj],
  status,
  offerCents: 45000,
  totalCents: 45700,
  note: '',
  setTime: '',
});

beforeEach(() => jest.clearAllMocks());

describe('changing the date with a confirmed DJ (the DateChangeAfter board)', () => {
  it('shows the dialog, leaves the date alone and offers Gelatin', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const saveEvent = jest.spyOn(repository, 'saveEvent');
    await dateAndTime(repository);
    await press(day('2026-11-21'));

    const dialog = within(await screen.findByTestId('date-change-dialog'));
    expect(dialog.getByRole('header', { name: 'KOYO is confirmed for Fri, Nov 20' })).toBeTruthy();
    expect(dialog.getByText('Confirmed')).toBeTruthy();
    expect(
      dialog.getByText(
        'You’ve been charged and KOYO has agreed to this night. To move or cancel the booking, open it in Gelatin. You’ll see what happens to your payment before you confirm anything.',
      ),
    ).toBeTruthy();
    // The offers still open for the same night are named too.
    expect(dialog.getByText('Your open offers to NIGHTFORM and BLKMTN are for this date too.')).toBeTruthy();
    expect(dialog.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Keep this date', 'Manage in Gelatin']);
    // The date is not changed from the app.
    expect(selected('2026-11-20')).toBe(true);
    expect(selected('2026-11-21')).toBe(false);
    expect(saveEvent).not.toHaveBeenCalled();
  });

  it('Keep this date closes the dialog with nothing changed', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await dateAndTime(repository);
    await press(day('2026-11-21'));
    await press(await screen.findByTestId('date-change-keep'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();
    expect(selected('2026-11-20')).toBe(true);
    expect(screen.queryByTestId('continue-in-gelatin')).toBeNull();
  });

  it('Manage in Gelatin opens the hand-off for the confirmed booking, and a return lands on the Lineup', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await dateAndTime(repository);
    await press(day('2026-11-21'));
    await press(await screen.findByTestId('date-change-manage'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();

    const sheet = within(await screen.findByTestId('continue-in-gelatin'));
    expect(sheet.getByRole('header', { name: CONTINUE_TITLE })).toBeTruthy();
    expect(sheet.getByText('KOYO · Warehouse Friday')).toBeTruthy();
    // The launch is minted on this tap, as from the Lineup.
    expect(repository.fake.portalLaunchCount()).toBe(0);
    await press(screen.getByTestId('open-in-gelatin'));
    const portal = within(await screen.findByTestId('test-portal'));
    expect(repository.fake.portalLaunchCount()).toBe(1);

    await press(portal.getByTestId('test-portal-back'));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/lineup', params: { id: EVENT, from: 'form' } }),
    );
    // The notice belongs to the Lineup, not to Date & time.
    expect(screen.queryByText(BACK_FROM_GELATIN)).toBeNull();
    expect(selected('2026-11-20')).toBe(true);
  });
});

describe('changing the date with open offers (the DateChangeBefore layout, with the hand-off)', () => {
  /** No confirmed DJ: BLKMTN has a hold, NIGHTFORM is unpaid. */
  const openOnly = () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.playDj('br_koyo', 'cancel');
    return repository;
  };

  it('says the offers are for the current date and must be handled in Gelatin first', async () => {
    const repository = openOnly();
    await dateAndTime(repository);
    await press(day('2026-11-21'));

    const dialog = within(await screen.findByTestId('date-change-dialog'));
    expect(dialog.getByRole('header', { name: 'Change the date to Sat, Nov 21?' })).toBeTruthy();
    expect(
      dialog.getByText(
        'The date is part of the offer. Your offers to NIGHTFORM and BLKMTN are for Fri, Nov 20, and an open offer can’t be withdrawn from Memberly.',
      ),
    ).toBeTruthy();
    expect(dialog.getByText('Manage them in Gelatin first, then change the date here.')).toBeTruthy();
    expect(dialog.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Keep Fri, Nov 20', 'Manage in Gelatin']);
    expect(selected('2026-11-20')).toBe(true);
  });

  it('never promises to withdraw an offer or release a hold, and has no Change date button', async () => {
    const repository = openOnly();
    const saveEvent = jest.spyOn(repository, 'saveEvent');
    await dateAndTime(repository);
    await press(day('2026-11-21'));
    const dialog = within(await screen.findByTestId('date-change-dialog'));
    expect(dialog.queryByRole('button', { name: /change date/i })).toBeNull();
    expect(dialog.queryByText(/cancels the request|releases the hold|withdraws|will be released|pass holders/i)).toBeNull();

    await press(dialog.getByTestId('date-change-keep'));
    expect(saveEvent).not.toHaveBeenCalled();
    // Every booking is as it was: nothing was withdrawn.
    expect(repository.fake.portalBooking('br_blkmtn')?.booking.status).toBe('requested');
    expect(repository.fake.portalBooking('br_nightform')?.booking.status).toBe('authorization_required');
  });

  it('Manage in Gelatin opens the hand-off for the offer that has a hold', async () => {
    const repository = openOnly();
    await dateAndTime(repository);
    await press(day('2026-11-21'));
    await press(await screen.findByTestId('date-change-manage'));
    const sheet = within(await screen.findByTestId('continue-in-gelatin'));
    // NIGHTFORM comes first on the lineup but is unpaid: there is no Gelatin link before a hold.
    expect(sheet.getByText('BLKMTN · Warehouse Friday')).toBeTruthy();
  });

  it('offers only Keep when every open offer is still unpaid: no hold, no Gelatin link', async () => {
    const repository = openOnly();
    repository.fake.playDj('br_blkmtn', 'pass');
    await dateAndTime(repository);
    await press(day('2026-11-21'));
    const dialog = within(await screen.findByTestId('date-change-dialog'));
    expect(
      dialog.getByText('The date is part of the offer. Your offer to NIGHTFORM is for Fri, Nov 20, and an open offer can’t be withdrawn from Memberly.'),
    ).toBeTruthy();
    expect(dialog.getByText('The date stays Fri, Nov 20 while it is open.')).toBeTruthy();
    expect(dialog.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Keep Fri, Nov 20']);
    expect(dialog.queryByText(/Gelatin/)).toBeNull();
  });
});

describe('changing the date with nothing in the way', () => {
  it('changes it with no dialog when the event has no bookings', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await dateAndTime(repository, 'e_long_table');
    await press(day('2026-11-29'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();
    expect(selected('2026-11-29')).toBe(true);
    expect(screen.queryByText(/re-checked/)).toBeNull();
  });

  it('changes it once every booking has ended', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.playDj('br_koyo', 'cancel');
    repository.fake.playDj('br_blkmtn', 'pass');
    repository.fake.playDj('br_nightform', 'expire');
    await dateAndTime(repository);
    await press(day('2026-11-21'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();
    expect(selected('2026-11-21')).toBe(true);
  });

  it('changes it with DJs added but not sent, and says they will be re-checked for the new night', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    // Late Service, Sat, Nov 28: KOYO and NIGHTFORM added, no offers sent.
    await dateAndTime(repository, 'e_late_service');
    await act(async () => void (await repository.getDraftOffers('e_late_service')));
    expect(screen.queryByText(/re-checked/)).toBeNull();
    await press(day('2026-11-29'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();
    expect(selected('2026-11-29')).toBe(true);
    expect(
      await screen.findByText('The 2 DJs you added haven’t been sent an offer yet. They’ll be re-checked for Sun, Nov 29 when you send.'),
    ).toBeTruthy();
    // Back on the saved date there is nothing to say.
    await press(day('2026-11-28'));
    expect(screen.queryByText(/re-checked/)).toBeNull();
  });

  it('does not guard an event that has never been saved', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const draft = { ...(await draftOf(repository, EVENT)), key: 'new' };
    await renderWithProviders(<WhenWhereScreen />, { repository, draft });
    await press(day('2026-11-21'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();
    expect(selected('2026-11-21')).toBe(true);
  });
});

describe('a save the server turns down', () => {
  /** Moves the open draft's date without going through Date & time, as a stale screen might. */
  let moveDraft: (date: string) => void = () => undefined;
  function Mover() {
    const { update } = useEventDraft();
    useEffect(() => {
      moveDraft = (date) => update({ date });
    }, [update]);
    return null;
  }

  it('shows the same dialog from the form, and Keep puts the saved date back', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(
      <>
        <EventFormScreen eventId={EVENT} />
        <Mover />
      </>,
      { repository },
    );
    expect(await screen.findByText('Fri, Nov 20 · 10:00 PM – 2:00 AM')).toBeTruthy();
    await act(async () => moveDraft('2026-11-21'));
    expect(screen.getByText('Sat, Nov 21 · 10:00 PM – 2:00 AM')).toBeTruthy();

    await press(screen.getByTestId('publish'));
    const dialog = within(await screen.findByTestId('date-change-dialog'));
    expect(dialog.getByRole('header', { name: 'KOYO is confirmed for Fri, Nov 20' })).toBeTruthy();
    expect((await repository.getOrganizerEvent(EVENT))?.date).toBe('2026-11-20');
    expect(router.push).not.toHaveBeenCalled();

    await press(dialog.getByTestId('date-change-keep'));
    expect(screen.queryByTestId('date-change-dialog')).toBeNull();
    expect(screen.getByText('Fri, Nov 20 · 10:00 PM – 2:00 AM')).toBeTruthy();
  });
});

describe('what stands in the way of a new date', () => {
  it('is nothing with no bookings, or with only bookings that are over', () => {
    expect(dateChangeBlock([])).toBeNull();
    expect(dateChangeBlock([booking('koyo', 'declined'), booking('blkmtn', 'expired'), booking('sable', 'cancelled')])).toBeNull();
  });

  it('is the confirmed DJ first, whatever else is open', () => {
    const block = dateChangeBlock([booking('blkmtn', 'requested'), booking('koyo', 'confirmed')]);
    expect(block).toMatchObject({ kind: 'confirmed', manage: { requestId: 'br_koyo' } });
  });

  it('is the open offers otherwise, with Gelatin only for one that has a hold', () => {
    expect(dateChangeBlock([booking('nightform', 'authorization_required'), booking('blkmtn', 'negotiating')])).toMatchObject({
      kind: 'open',
      manage: { requestId: 'br_blkmtn' },
    });
    expect(dateChangeBlock([booking('sable', 'reauthorization_required')])).toMatchObject({ kind: 'open', manage: { requestId: 'br_sable' } });
    expect(dateChangeBlock([booking('nightform', 'authorization_required')])).toMatchObject({ kind: 'open', manage: null });
    // A status the app does not know holds the date, with no link to offer.
    expect(dateChangeBlock([booking('koyo', 'awaiting_review')])).toMatchObject({ kind: 'open', manage: null });
  });

  it('words one confirmed DJ and several', () => {
    const one = dateChangeCopy(dateChangeBlock([booking('koyo', 'confirmed')])!, 'Fri, Nov 20', 'Sat, Nov 21');
    expect(one).toMatchObject({ title: 'KOYO is confirmed for Fri, Nov 20', keep: 'Keep this date', label: 'KOYO is confirmed for this date' });
    expect(one.body).toHaveLength(1);
    const two = dateChangeCopy(dateChangeBlock([booking('koyo', 'confirmed'), booking('sable', 'confirmed')])!, 'Fri, Nov 20', 'Sat, Nov 21');
    expect(two.title).toBe('KOYO and Sable Hart are confirmed for Fri, Nov 20');
    expect(two.body[0]).toMatch(/^You’ve been charged and they have agreed to this night\./);
  });

  it('words one open offer and the re-check line for one DJ', () => {
    const copy = dateChangeCopy(dateChangeBlock([booking('blkmtn', 'requested')])!, 'Fri, Nov 20', 'Sat, Nov 21');
    expect(copy.body).toEqual([
      'The date is part of the offer. Your offer to BLKMTN is for Fri, Nov 20, and an open offer can’t be withdrawn from Memberly.',
      'Manage it in Gelatin first, then change the date here.',
    ]);
    expect(recheckNotice(1, 'Sat, Nov 21')).toBe('The DJ you added hasn’t been sent an offer yet. They’ll be re-checked for Sat, Nov 21 when you send.');
  });
});
