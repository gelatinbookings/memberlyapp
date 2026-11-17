import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { ALL_STATUSES_EVENT_ID, createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import { bookingsOf } from '@/test-utils/bookings';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { ALTERNATES_EMPTY_TITLE, ALTERNATES_TITLE, ALTERNATES_UNAVAILABLE, ATTRIBUTION, SEARCH_ANOTHER_DATE } from '../AlternatesSheet';
import { LineupView } from '../LineupView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Sunday Sessions (Sun, Dec 13): Mara Sol passed, LOWTIDE expired, Caro Lumen cancelled. */
const EVENT = ALL_STATUSES_EVENT_ID;

async function openAlternates(repository: FakeRepository, dj = 'dj_mara_sol', eventId = EVENT) {
  await renderWithProviders(<LineupView eventId={eventId} />, { repository });
  await press(await screen.findByTestId(`alternates-${dj}`));
  return within(await screen.findByTestId('alternates'));
}

/** Every word on the sheet, in one string. */
const textOf = (sheet: ReturnType<typeof within>) =>
  sheet
    .getAllByText(/./)
    .map((node) => (Array.isArray(node.props.children) ? node.props.children.filter((c: unknown) => typeof c === 'string').join('') : String(node.props.children)))
    .join(' | ');

beforeEach(() => jest.clearAllMocks());

describe('Other DJs open that night (GEL-1023)', () => {
  it('shows the DJ who passed greyed at the top, then up to three open DJs with Offer, then the way to everyone', async () => {
    const sheet = await openAlternates(createFakeRepository({ delayMs: 0 }));
    const passed = within(sheet.getByTestId('alternates-passed'));
    expect(passed.getByText('Mara Sol')).toBeTruthy();
    expect(passed.getByText('Passed')).toBeTruthy();
    expect(passed.getByText('Mara Sol passed on this one. Your hold was released and you were not charged.')).toBeTruthy();

    expect(sheet.getByRole('header', { name: ALTERNATES_TITLE })).toBeTruthy();
    const rows = await sheet.findAllByTestId(/^alternate-dj_/);
    expect(rows).toHaveLength(3);
    expect(sheet.getAllByRole('button', { name: /^Offer to / })).toHaveLength(3);
    // Nobody who holds a booking on this event, and not the DJ who passed.
    const ids = rows.map((row) => row.props.testID);
    for (const held of ['dj_koyo', 'dj_blkmtn', 'dj_nightform', 'dj_sable', 'dj_juno_vale', 'dj_mara_sol']) {
      expect(ids).not.toContain(`alternate-${held}`);
    }
    expect(sheet.getByText('See everyone open on Dec 13')).toBeTruthy();
    expect(sheet.getByText(ATTRIBUTION)).toBeTruthy();
  });

  it('opens from Expired and Cancelled cards too', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const expired = await openAlternates(repository, 'dj_lowtide');
    expect(within(expired.getByTestId('alternates-passed')).getByText('Expired')).toBeTruthy();
    expect(expired.getByText('LOWTIDE didn’t answer in time. Your hold was released and you were not charged.')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Close' }));

    await press(screen.getByTestId('alternates-dj_caro_lumen'));
    const cancelled = within(await screen.findByTestId('alternates'));
    expect(within(cancelled.getByTestId('alternates-passed')).getByText('Cancelled')).toBeTruthy();
  });

  it('Offer adds that DJ to the lineup as an unsent offer and leaves the passed card below it', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const sheet = await openAlternates(repository);
    const [first] = await sheet.findAllByTestId(/^alternate-dj_/);
    const djId = String(first.props.testID).replace('alternate-', '');
    await press(within(first).getByRole('button', { name: /^Offer to / }));

    // The sheet closes onto the lineup, with the DJ added and their offer fields.
    await waitFor(() => expect(screen.queryByTestId('alternates')).toBeNull());
    expect(await screen.findByTestId(`added-${djId}`)).toBeTruthy();
    expect(screen.getByTestId(`fee-${djId}`)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send 1 offer' })).toBeTruthy();
    // Nothing was sent: it is a draft, not a request.
    await waitFor(async () => expect((await repository.getDraftOffers(EVENT)).map((o) => o.dj.id)).toEqual([djId]));
    expect(await bookingsOf(repository, EVENT)).toHaveLength(8);

    // The passed card is still there, after the new DJ.
    const order = screen.getAllByTestId(/^(booking|added)-dj_/).map((node) => node.props.testID);
    expect(order).toContain('booking-dj_mara_sol');
    expect(order.indexOf(`added-${djId}`)).toBeLessThan(order.indexOf('booking-dj_mara_sol'));
    expect(within(screen.getByTestId('booking-dj_mara_sol')).getByText('Passed')).toBeTruthy();
  });

  it('does not offer a DJ already added to the lineup again', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const sheet = await openAlternates(repository);
    const [first] = await sheet.findAllByTestId(/^alternate-dj_/);
    const djId = String(first.props.testID).replace('alternate-', '');
    await press(within(first).getByRole('button', { name: /^Offer to / }));
    await screen.findByTestId(`added-${djId}`);

    await press(screen.getByTestId('alternates-dj_mara_sol'));
    const again = within(await screen.findByTestId('alternates'));
    await again.findAllByTestId(/^alternate-dj_/);
    expect(again.queryByTestId(`alternate-${djId}`)).toBeNull();
  });

  it('says so when nobody else is open, with the way to another date and no Offer', async () => {
    const sheet = await openAlternates(createFakeRepository({ delayMs: 0, simulation: { noAlternates: true } }));
    expect(await sheet.findByText(ALTERNATES_EMPTY_TITLE)).toBeTruthy();
    await waitFor(() => expect(sheet.queryByLabelText('Finding DJs open that night')).toBeNull());
    expect(sheet.queryAllByTestId(/^alternate-dj_/)).toHaveLength(0);
    expect(sheet.queryAllByRole('button', { name: /^Offer/ })).toHaveLength(0);

    await press(sheet.getByText(SEARCH_ANOTHER_DATE));
    expect(screen.queryByTestId('alternates')).toBeNull();
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/edit', params: { id: EVENT, open: 'when' } });
  });

  it('opens Browse talent from "See everyone open on …"', async () => {
    const sheet = await openAlternates(createFakeRepository({ delayMs: 0 }));
    await press(sheet.getByTestId('alternates-see-everyone'));
    expect(screen.queryByTestId('alternates')).toBeNull();
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/browse', params: { id: EVENT } });
  });

  it('never gives a reason for the pass, a message from the DJ or any history', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const sheet = await openAlternates(repository);
    await sheet.findAllByTestId(/^alternate-dj_/);
    const words = textOf(sheet);
    // What it does say: the hold line, the heading and who is open.
    expect(words).toContain('Mara Sol passed on this one. Your hold was released and you were not charged.');
    expect(words).toContain(ALTERNATES_TITLE);
    expect(words).not.toMatch(/because|reason|unavailable|busy|booked elsewhere|said|message|wrote|previous|history|countered/i);
    // The organizer's own note and the fee they offered are not repeated here either.
    expect(words).not.toMatch(/\$250/);
  });

  it('says Gelatin could not be reached, with Try again, when alternates fail to load', async () => {
    let mode: 'ok' | 'unavailable' = 'unavailable';
    const sheet = await openAlternates(createFakeRepository({ delayMs: 0, talentMode: () => mode }));
    expect(await sheet.findByText(ALTERNATES_UNAVAILABLE)).toBeTruthy();
    mode = 'ok';
    await press(sheet.getByRole('button', { name: 'Try again' }));
    expect(await sheet.findAllByTestId(/^alternate-dj_/)).toHaveLength(3);
    expect(sheet.queryByText(ALTERNATES_UNAVAILABLE)).toBeNull();
  });

  it('works end to end when the lineup is one booking and nothing else', async () => {
    // Late Service with a single offer, sent, held and then passed on: one card, no drafts.
    const repository = createFakeRepository({ delayMs: 0 });
    const event = 'e_late_service';
    await repository.removeDraftOffer(event, 'dj_nightform');
    const booking = await repository.createOffer(event, { djId: 'dj_koyo', offerCents: 45000, note: '', clientOfferId: 'only' });
    await repository.fake.confirmPayment((await repository.createPaymentSession(booking.requestId)).clientSecret);
    repository.fake.playDj(booking.requestId, 'pass');

    const sheet = await openAlternates(repository, 'dj_koyo', event);
    expect(within(sheet.getByTestId('alternates-passed')).getByText('KOYO')).toBeTruthy();
    const [first] = await sheet.findAllByTestId(/^alternate-dj_/);
    const djId = String(first.props.testID).replace('alternate-', '');
    await press(within(first).getByRole('button', { name: /^Offer to / }));

    await waitFor(() => expect(screen.queryByTestId('alternates')).toBeNull());
    expect(await screen.findByTestId(`added-${djId}`)).toBeTruthy();
    expect(screen.getByTestId('booking-dj_koyo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send 1 offer' })).toBeTruthy();
    // And the sheet opens again from the same card.
    await press(screen.getByTestId('alternates-dj_koyo'));
    expect(await screen.findByTestId('alternates')).toBeTruthy();
  });
});
