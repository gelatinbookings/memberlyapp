import { AccessibilityInfo } from 'react-native';
import { act, render, screen, within } from '@testing-library/react-native';

import { ALL_STATUSES_EVENT_ID, createFakeRepository, UNKNOWN_STATUS_SAMPLE, type FakeRepository } from '@/data/fakeRepository';
import { lastUpdatedLabel } from '@/features/booking/freshness';
import { POLL_INTERVAL_MS } from '@/features/booking/status';
import { setAnalyticsSink } from '@/lib/analytics';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { ThemeProvider } from '@/theme/theme';

import { LineupView, POLL_LINE } from '../LineupView';
import { LiveStatusPill } from '../LiveStatusPill';
import { unbrokenParts } from '@/features/booking/lineupSummary';

let mockReduceMotion = false;
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: () => mockReduceMotion };
});
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const EVENT = 'e_warehouse_friday';
const BLKMTN = 'br_blkmtn';

const pass = (ms: number) => act(async () => void (await jest.advanceTimersByTimeAsync(ms)));

async function lineup(repository: FakeRepository, eventId = EVENT) {
  const view = await renderWithProviders(<LineupView eventId={eventId} />, { repository });
  await pass(50);
  return view;
}

let announce: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  mockReduceMotion = false;
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
});
afterEach(() => {
  jest.useRealTimers();
  announce.mockRestore();
  setAnalyticsSink(null);
});

describe('every status on the Lineup card (the status table)', () => {
  /** DJ, pill, the one money line, the one action and how it is offered. */
  const table: [string, string, string, string, 'button' | 'link'][] = [
    ['dj_koyo', 'Payment needed', 'KOYO won’t see this request until your card is held for $457.00.', 'Pay now', 'button'],
    [
      'dj_blkmtn',
      'Card held · waiting for the DJ',
      '$397.00 held on your card, not charged. You’re charged only if BLKMTN accepts.',
      'Manage in Gelatin',
      'link',
    ],
    ['dj_nightform', 'Negotiating', 'You and NIGHTFORM are working out the fee in Gelatin.', 'Manage in Gelatin', 'link'],
    [
      'dj_sable',
      'New offer from the DJ',
      'Sable Hart came back at $340. Your $282.00 hold was released. A new price means a new hold.',
      'Review the new offer in Gelatin',
      'button',
    ],
    ['dj_juno_vale', 'Confirmed', '$707.00 charged. Juno Vale is on your public lineup.', 'Manage in Gelatin', 'link'],
    ['dj_mara_sol', 'Passed', 'Mara Sol passed on this one. Your hold was released and you were not charged.', 'Other DJs open that night', 'button'],
    ['dj_lowtide', 'Expired', 'LOWTIDE didn’t answer in time. Your hold was released and you were not charged.', 'Other DJs open that night', 'button'],
    ['dj_caro_lumen', 'Cancelled', 'This booking was cancelled.', 'Other DJs open that night', 'button'],
  ];

  it.each(table)('%s: "%s", its money line and one action', async (dj, label, line, action, role) => {
    await lineup(createFakeRepository({ delayMs: 0 }), ALL_STATUSES_EVENT_ID);
    const card = within(screen.getByTestId(`booking-${dj}`));
    expect(card.getByText(label)).toBeTruthy();
    expect(card.getByTestId(`status-line-${dj}`)).toHaveTextContent(line);
    expect(card.getByRole(role, { name: action })).toBeTruthy();
    // One action, and only one.
    expect([...card.queryAllByRole('button'), ...card.queryAllByRole('link')]).toHaveLength(1);
  });

  it('shows all eight at once, with the summary in the header', async () => {
    await lineup(createFakeRepository({ delayMs: 0 }), ALL_STATUSES_EVENT_ID);
    expect(screen.getAllByTestId(/^booking-/)).toHaveLength(8);
    expect(screen.getByText(unbrokenParts('1 confirmed · 1 new offer · 2 waiting · 1 to pay'))).toBeTruthy();
  });

  it('marks the new offer in the warning colour and names the DJ’s price; without a price it uses the helper line', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.setStatus('br_sessions_sable', 'reauthorization_required', { newOfferCents: null });
    await lineup(repository, ALL_STATUSES_EVENT_ID);
    expect(screen.getByTestId('status-line-dj_sable')).toHaveTextContent(
      'Sable Hart proposed new terms. Review them in Gelatin; your card is re-held only if you accept.',
    );
  });

  it('shows an unknown status as "Checking status" with no action, and reports it once', async () => {
    const events = jest.fn();
    setAnalyticsSink(events);
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.setStatus(BLKMTN, UNKNOWN_STATUS_SAMPLE);
    await lineup(repository);
    const card = within(screen.getByTestId('booking-dj_blkmtn'));
    expect(card.getByText('Checking status')).toBeTruthy();
    expect(card.queryAllByRole('button')).toHaveLength(0);
    expect(card.queryAllByRole('link')).toHaveLength(0);
    expect(card.queryByTestId('status-line-dj_blkmtn')).toBeNull();
    expect(events).toHaveBeenCalledTimes(1);
    expect(events).toHaveBeenCalledWith({ name: 'booking_status_unknown', props: { status: UNKNOWN_STATUS_SAMPLE } });
    // Nobody is known to be deciding, so nothing polls.
    expect(screen.queryByText(POLL_LINE)).toBeNull();
  });

  it('offers no way into Gelatin before a hold exists', async () => {
    await lineup(createFakeRepository({ delayMs: 0 }));
    // NIGHTFORM is unpaid: Pay now, and nothing that mentions Gelatin.
    const card = within(screen.getByTestId('booking-dj_nightform'));
    expect(card.getByRole('button', { name: 'Pay now' })).toBeTruthy();
    expect(card.queryByText(/Gelatin/)).toBeNull();
    expect(card.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('a status changing while the Lineup is open', () => {
  it('announces "BLKMTN: Confirmed" when a poll brings the change, and nothing on first sight', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    expect(announce).not.toHaveBeenCalled();

    repository.fake.setStatus(BLKMTN, 'confirmed');
    await pass(POLL_INTERVAL_MS + 100);
    expect(within(screen.getByTestId('booking-dj_blkmtn')).getByText('Confirmed')).toBeTruthy();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('BLKMTN: Confirmed');
  });

  it('announces a booking ending, though its card moves below the others', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    repository.fake.playDj(BLKMTN, 'pass');
    await pass(POLL_INTERVAL_MS + 100);
    expect(within(screen.getByTestId('booking-dj_blkmtn')).getByText('Passed')).toBeTruthy();
    expect(announce.mock.calls.map(([said]) => said)).toEqual(['BLKMTN: Passed']);
    // Ended bookings sit after the ones still in play.
    const order = screen.getAllByTestId(/^booking-dj_/).map((node) => node.props.testID);
    expect(order).toEqual(['booking-dj_nightform', 'booking-dj_koyo', 'booking-dj_blkmtn']);
  });

  it('announces each change, in the status table’s words', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    repository.fake.playDj(BLKMTN, 'counter');
    await pass(POLL_INTERVAL_MS + 100);
    repository.fake.settleCounters();
    await pass(POLL_INTERVAL_MS + 100);
    expect(announce.mock.calls.map(([said]) => said)).toEqual(['BLKMTN: Negotiating', 'BLKMTN: New offer from the DJ']);
  });

  const pill = () => screen.getByTestId('status-pill');
  const wrap = (status: string) => (
    <ThemeProvider>
      <LiveStatusPill djName="KOYO" status={status} />
    </ThemeProvider>
  );

  it('cross-fades the pill for about 200 ms: the old one fades out as the new one fades in', async () => {
    const view = await render(wrap('requested'));
    // A card that has just appeared does not fade in.
    expect(pill().props.entering).toBeUndefined();
    expect(pill().props.exiting).toBeDefined();
    await view.rerender(wrap('confirmed'));
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(pill().props.entering).toBeDefined();
    expect(pill().props.exiting).toBeDefined();
    expect(announce).toHaveBeenCalledWith('KOYO: Confirmed');
  });

  it('changes at once under Reduce Motion, and still announces', async () => {
    mockReduceMotion = true;
    const view = await render(wrap('requested'));
    await view.rerender(wrap('declined'));
    expect(screen.getByText('Passed')).toBeTruthy();
    expect(pill().props.entering).toBeUndefined();
    expect(pill().props.exiting).toBeUndefined();
    expect(announce).toHaveBeenCalledWith('KOYO: Passed');
  });
});

describe('a lineup that may be behind', () => {
  it('keeps the last known lineup with a quiet "Last updated" line when the answer is stale', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    expect(screen.queryByTestId('last-updated')).toBeNull();

    repository.fake.simulate({ staleBookings: true });
    await pass(POLL_INTERVAL_MS + 100);
    expect(screen.getByTestId('last-updated')).toHaveTextContent('Last updated just now');
    // The lineup is still there; the "updates every few seconds" promise is not.
    expect(screen.getAllByTestId(/^booking-/)).toHaveLength(3);
    expect(screen.queryByText(POLL_LINE)).toBeNull();
    expect(screen.queryByText('Couldn’t load your lineup')).toBeNull();

    // Two minutes on, still stale: the line counts up from the last current answer.
    await pass(2 * 60_000);
    expect(screen.getByTestId('last-updated')).toHaveTextContent('Last updated 2 min ago');

    // Gelatin catches up: the line goes and polling is back.
    repository.fake.simulate({ staleBookings: false });
    await pass(POLL_INTERVAL_MS + 100);
    expect(screen.queryByTestId('last-updated')).toBeNull();
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
  });

  it('keeps the last known lineup when a refresh fails: never an error screen', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    repository.fake.simulate({ failBookings: true });
    await pass(POLL_INTERVAL_MS + 100);
    expect(screen.getByTestId('last-updated')).toHaveTextContent('Last updated just now');
    expect(screen.getAllByTestId(/^booking-/)).toHaveLength(3);
    expect(screen.getByText('Card held · waiting for the DJ')).toBeTruthy();
    expect(screen.queryByText('Couldn’t load your lineup')).toBeNull();
    expect(screen.queryByText(POLL_LINE)).toBeNull();

    await pass(60_000);
    expect(screen.getByTestId('last-updated')).toHaveTextContent('Last updated 1 min ago');

    // It keeps trying, and recovers by itself.
    repository.fake.setStatus(BLKMTN, 'confirmed');
    repository.fake.simulate({ failBookings: false });
    await pass(POLL_INTERVAL_MS + 100);
    expect(screen.queryByTestId('last-updated')).toBeNull();
    expect(screen.getByText(unbrokenParts('2 confirmed · 1 to pay'))).toBeTruthy();
  });

  it('still shows an error with Try again when the very first load fails', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { failBookings: true } });
    await lineup(repository);
    expect(screen.getByText('Couldn’t load your lineup')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('words the line by how long ago a current answer arrived', () => {
    const at = 1_000_000_000_000;
    expect(lastUpdatedLabel(at, at + 20_000)).toBe('Last updated just now');
    expect(lastUpdatedLabel(at, at + 60_000)).toBe('Last updated 1 min ago');
    expect(lastUpdatedLabel(at, at + 2 * 60_000 + 59_000)).toBe('Last updated 2 min ago');
    expect(lastUpdatedLabel(at, at + 61 * 60_000)).toBe('Last updated 1 hr ago');
    expect(lastUpdatedLabel(null, at)).toBe('Showing the last status we have');
  });
});
