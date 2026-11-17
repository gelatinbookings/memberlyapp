import { useEffect, useState } from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import PortalReturnRoute from '@/app/return/portal';
import { RepositoryError } from '@/data/errors';
import { createFakeRepository, TEST_PORTAL_ORIGIN, type FakeRepository, type PortalAction } from '@/data/fakeRepository';
import { POLL_INTERVAL_MS } from '@/features/booking/status';
import { LineupView, POLL_LINE } from '@/features/lineup/LineupView';
import { TEST_PORTAL_EXPIRED, TEST_PORTAL_NOTE } from '@/lib/portal/TestPortalScreen';
import { bookingsOf } from '@/test-utils/bookings';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { BACK_FROM_GELATIN, CONTINUE_TITLE, continueBody, LINK_EXPIRED, OPEN_FAILED, OPEN_IN_GELATIN, OPEN_NOTE } from '../copy';
import { unbrokenParts } from '@/features/booking/lineupSummary';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => mockParams,
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock; back: jest.Mock; replace: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Warehouse Friday: NIGHTFORM unpaid, BLKMTN requested ($397.00 held), KOYO confirmed. */
const EVENT = 'e_warehouse_friday';
const BLKMTN = 'br_blkmtn';

const reads = (repo: FakeRepository, eventId = EVENT) => {
  const { full, notModified } = repo.fake.bookingFetches(eventId);
  return full + notModified;
};

async function lineup(repository: FakeRepository, eventId = EVENT) {
  await renderWithProviders(<LineupView eventId={eventId} />, { repository });
  await screen.findAllByTestId(/^booking-/);
}

/** Manage in Gelatin on a card, then the sheet. */
async function openSheet(dj = 'dj_blkmtn') {
  await press(screen.getByTestId(`manage-${dj}`));
  return within(await screen.findByTestId('continue-in-gelatin'));
}

/** Manage in Gelatin, Open in Gelatin, and the test portal is up. */
async function openPortal(dj = 'dj_blkmtn') {
  await openSheet(dj);
  await press(screen.getByTestId('open-in-gelatin'));
  return within(await screen.findByTestId('test-portal'));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

describe('Continue in Gelatin (GEL-1024)', () => {
  it('says where the organizer is going and how they get back, for this booking', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const sheet = await openSheet();
    expect(sheet.getByRole('header', { name: CONTINUE_TITLE })).toBeTruthy();
    expect(sheet.getByText(continueBody('BLKMTN'))).toBeTruthy();
    const row = within(sheet.getByTestId('handoff-booking'));
    expect(row.getByText('BLKMTN · Warehouse Friday')).toBeTruthy();
    expect(row.getByText('$397.00 held · waiting for the DJ')).toBeTruthy();
    expect(sheet.getByRole('button', { name: OPEN_IN_GELATIN })).toBeTruthy();
    expect(sheet.getByText(OPEN_NOTE)).toBeTruthy();
  });

  it('mints the launch when Open in Gelatin is tapped, not when the sheet opens', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const createPortalLaunch = jest.spyOn(repository, 'createPortalLaunch');
    await lineup(repository);
    await openSheet();
    // Opening the Lineup and the sheet asks for nothing.
    expect(createPortalLaunch).not.toHaveBeenCalled();
    expect(repository.fake.portalLaunchCount()).toBe(0);

    await press(screen.getByTestId('open-in-gelatin'));
    await screen.findByTestId('test-portal');
    expect(createPortalLaunch).toHaveBeenCalledTimes(1);
    expect(createPortalLaunch).toHaveBeenCalledWith(BLKMTN);
    // The sheet stepped aside for the portal.
    expect(screen.queryByTestId('continue-in-gelatin')).toBeNull();
  });

  it('mints a new launch for every opening and never logs one', async () => {
    const logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => jest.spyOn(console, level).mockImplementation(() => undefined));
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    await openPortal();
    await press(screen.getByTestId('test-portal-close'));
    await waitFor(() => expect(screen.queryByTestId('test-portal')).toBeNull());
    await openPortal();
    expect(repository.fake.portalLaunchCount()).toBe(2);
    const printed = logs.flatMap((spy) => spy.mock.calls.flat()).map(String).join(' ');
    logs.forEach((spy) => spy.mockRestore());
    expect(printed).not.toContain(TEST_PORTAL_ORIGIN);
    expect(printed).not.toContain('/launch/');
  });

  it('replaces an expired launch once, without a word', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { expiredLaunches: 1 } });
    await lineup(repository);
    await openPortal();
    expect(repository.fake.portalLaunchCount()).toBe(2);
    expect(screen.queryByText(LINK_EXPIRED)).toBeNull();
    // The portal opened on the second launch, with the booking.
    expect(within(screen.getByTestId('test-portal')).getByText('Your booking with BLKMTN')).toBeTruthy();
  });

  it('says the link expired when the replacement has expired too, and opens on the next tap', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { expiredLaunches: 2 } });
    await lineup(repository);
    const sheet = await openSheet();
    await press(screen.getByTestId('open-in-gelatin'));
    expect(await sheet.findByText(LINK_EXPIRED)).toBeTruthy();
    // Once: two launches, not a loop.
    expect(repository.fake.portalLaunchCount()).toBe(2);
    expect(screen.queryByTestId('test-portal')).toBeNull();

    await press(screen.getByTestId('open-in-gelatin'));
    expect(await screen.findByTestId('test-portal')).toBeTruthy();
    expect(repository.fake.portalLaunchCount()).toBe(3);
  });

  it('says Gelatin could not be opened when no launch can be made', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    jest.spyOn(repository, 'createPortalLaunch').mockRejectedValue(new RepositoryError('timeout'));
    await lineup(repository);
    const sheet = await openSheet();
    await press(screen.getByTestId('open-in-gelatin'));
    expect(await sheet.findByText(OPEN_FAILED)).toBeTruthy();
    expect(screen.queryByTestId('test-portal')).toBeNull();
  });

  it('opens from Review the new offer in Gelatin and from a confirmed booking', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.setStatus(BLKMTN, 'reauthorization_required', { newOfferCents: 52000 });
    await lineup(repository);
    await press(screen.getByRole('button', { name: 'Review the new offer in Gelatin' }));
    const review = within(await screen.findByTestId('continue-in-gelatin'));
    expect(within(review.getByTestId('handoff-booking')).getByText('New offer from the DJ')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Close' }));

    const confirmed = await openSheet('dj_koyo');
    expect(within(confirmed.getByTestId('handoff-booking')).getByText('$457.00 charged · confirmed')).toBeTruthy();
  });

  it('builds no counter form and no accept or decline buttons in Memberly itself', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.setStatus(BLKMTN, 'reauthorization_required', { newOfferCents: 52000 });
    await lineup(repository);
    for (const name of [/^Accept/i, /^Decline/i, /^Counter/i, /^Pass$/i, /^Cancel booking/i]) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
    await press(screen.getByRole('button', { name: 'Review the new offer in Gelatin' }));
    const sheet = within(await screen.findByTestId('continue-in-gelatin'));
    // One way forward, Gelatin, beside closing the sheet.
    expect(sheet.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Close', OPEN_IN_GELATIN]);
  });
});

describe('the test portal, on sample data', () => {
  it('is unmistakably a stand-in: a Test portal pill and one line saying what it stands in for', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const portal = await openPortal();
    expect(portal.getAllByText('Test portal').length).toBeGreaterThanOrEqual(1);
    expect(portal.getByText(TEST_PORTAL_NOTE)).toBeTruthy();
    const booking = within(portal.getByTestId('test-portal-booking'));
    expect(booking.getByText('BLKMTN · Warehouse Friday')).toBeTruthy();
    expect(booking.getByText('Offer $390 · total $397.00')).toBeTruthy();
    expect(booking.getByText('Card held · waiting for the DJ')).toBeTruthy();
    for (const label of ['Accept', 'Pass', 'Counter at a new price', 'Let it expire', 'Cancel booking', 'Back to Memberly']) {
      expect(portal.getByRole('button', { name: label })).toBeTruthy();
    }
  });

  const actions: [PortalAction, string, string][] = [
    ['accept', 'confirmed', 'Confirmed'],
    ['pass', 'declined', 'Passed'],
    ['counter', 'negotiating', 'Negotiating'],
    ['expire', 'expired', 'Expired'],
    ['cancel', 'cancelled', 'Cancelled'],
  ];
  it.each(actions)('%s moves the booking to %s, and the Lineup shows it on the way back', async (action, status, label) => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const portal = await openPortal();
    await press(portal.getByTestId(`test-portal-${action}`));
    expect(within(portal.getByTestId('test-portal-booking')).getByText(label)).toBeTruthy();
    expect((await bookingsOf(repository, EVENT)).find((b) => b.requestId === BLKMTN)?.status).toBe(status);

    await press(portal.getByTestId('test-portal-back'));
    await waitFor(() => expect(screen.queryByTestId('test-portal')).toBeNull());
    expect(await within(screen.getByTestId('booking-dj_blkmtn')).findByText(label)).toBeTruthy();
  });

  it('a counter lands as a new offer from the DJ, at the DJ’s price', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const portal = await openPortal();
    await press(portal.getByTestId('test-portal-counter'));
    await act(async () => repository.fake.settleCounters());
    await press(portal.getByTestId('test-portal-back'));
    const card = within(screen.getByTestId('booking-dj_blkmtn'));
    expect(await card.findByText('New offer from the DJ')).toBeTruthy();
    expect(card.getByTestId('status-line-dj_blkmtn')).toHaveTextContent(
      'BLKMTN came back at $520. Your $397.00 hold was released. A new price means a new hold.',
    );
    expect(card.getByRole('button', { name: 'Review the new offer in Gelatin' })).toBeTruthy();
  });

  it('says so when a launch has already been used or has expired', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    // The launch the app is handed has already been opened once.
    const mint = repository.createPortalLaunch;
    jest.spyOn(repository, 'createPortalLaunch').mockImplementation(async (requestId) => {
      const launch = await mint(requestId);
      repository.fake.redeemLaunch(launch.launchUrl);
      return launch;
    });
    await lineup(repository);
    const portal = await openPortal();
    expect(portal.getByText(TEST_PORTAL_EXPIRED)).toBeTruthy();
    expect(portal.queryByTestId('test-portal-accept')).toBeNull();
    await press(portal.getByTestId('test-portal-back'));
    await waitFor(() => expect(screen.queryByTestId('test-portal')).toBeNull());
    expect(screen.queryByText(BACK_FROM_GELATIN)).toBeNull();
  });
});

describe('coming back from Gelatin', () => {
  it('reads the lineup again at once and shows "Back from Gelatin. Your lineup is up to date."', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const portal = await openPortal();
    await press(portal.getByTestId('test-portal-accept'));
    const before = reads(repository);
    await press(portal.getByTestId('test-portal-back'));

    expect(await screen.findByText(BACK_FROM_GELATIN)).toBeTruthy();
    // Straight away, not on the next 5 second tick.
    expect(reads(repository)).toBe(before + 1);
    expect(within(screen.getByTestId('booking-dj_blkmtn')).getByText('Confirmed')).toBeTruthy();
    expect(screen.getByText(unbrokenParts('2 confirmed · 1 to pay'))).toBeTruthy();
  });

  it('only refreshes, with no notice, when the organizer closes the portal themselves', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const portal = await openPortal();
    await press(portal.getByTestId('test-portal-pass'));
    const before = reads(repository);
    await press(portal.getByTestId('test-portal-close'));

    expect(await within(screen.getByTestId('booking-dj_blkmtn')).findByText('Passed')).toBeTruthy();
    expect(reads(repository)).toBe(before + 1);
    expect(screen.queryByText(BACK_FROM_GELATIN)).toBeNull();
  });

  it('does not say the lineup is up to date when the read on return fails', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    const portal = await openPortal();
    repository.fake.simulate({ failBookings: true });
    await press(portal.getByTestId('test-portal-back'));
    await waitFor(() => expect(screen.queryByTestId('test-portal')).toBeNull());
    expect(await screen.findByTestId('last-updated')).toBeTruthy();
    expect(screen.queryByText(BACK_FROM_GELATIN)).toBeNull();
  });

  it('works end to end when the lineup is one booking: the portal outlives the status changing under it', async () => {
    // Late Service with a single offer, sent and held: one card and nothing else.
    const repository = createFakeRepository({ delayMs: 0 });
    const event = 'e_late_service';
    await repository.removeDraftOffer(event, 'dj_nightform');
    const booking = await repository.createOffer(event, { djId: 'dj_koyo', offerCents: 45000, note: '', clientOfferId: 'only' });
    await repository.fake.confirmPayment((await repository.createPaymentSession(booking.requestId)).clientSecret);

    await lineup(repository, event);
    expect(screen.getAllByTestId(/^booking-/)).toHaveLength(1);
    const portal = await openPortal('dj_koyo');
    expect(portal.getByText('KOYO · Late Service')).toBeTruthy();
    await press(portal.getByTestId('test-portal-pass'));
    await press(portal.getByTestId('test-portal-back'));

    expect(await screen.findByText(BACK_FROM_GELATIN)).toBeTruthy();
    const card = within(screen.getByTestId('booking-dj_koyo'));
    expect(card.getByText('Passed')).toBeTruthy();
    // The card's action is now the alternates, and it opens.
    await press(card.getByRole('button', { name: 'Other DJs open that night' }));
    expect(await screen.findByTestId('alternates')).toBeTruthy();
  });
});

describe('polling around a visit to Gelatin', () => {
  const pass = (ms: number) => act(async () => void (await jest.advanceTimersByTimeAsync(ms)));
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('stops while the portal is open, reads at once on return and resumes if a DJ is still deciding', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<LineupView eventId={EVENT} />, { repository });
    await pass(50);
    expect(screen.getByText(POLL_LINE)).toBeTruthy();

    await press(screen.getByTestId('manage-dj_blkmtn'));
    await pass(50);
    await press(screen.getByTestId('open-in-gelatin'));
    await pass(50);
    expect(screen.getByTestId('test-portal')).toBeTruthy();
    const whileOpen = reads(repository);
    await pass(POLL_INTERVAL_MS * 4);
    expect(reads(repository)).toBe(whileOpen);

    // The DJ counters: still deciding, so polling picks up again after the return.
    await press(screen.getByTestId('test-portal-counter'));
    await press(screen.getByTestId('test-portal-back'));
    await pass(50);
    expect(reads(repository)).toBe(whileOpen + 1);
    expect(screen.getByText(BACK_FROM_GELATIN)).toBeTruthy();
    expect(within(screen.getByTestId('booking-dj_blkmtn')).getByText('Negotiating')).toBeTruthy();
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
    await pass(POLL_INTERVAL_MS + 100);
    expect(reads(repository)).toBe(whileOpen + 2);
  });

  it('does not resume when nothing is left to wait for', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<LineupView eventId={EVENT} />, { repository });
    await pass(50);
    await press(screen.getByTestId('manage-dj_blkmtn'));
    await pass(50);
    await press(screen.getByTestId('open-in-gelatin'));
    await pass(50);
    await press(screen.getByTestId('test-portal-accept'));
    await press(screen.getByTestId('test-portal-back'));
    await pass(50);
    const after = reads(repository);
    expect(screen.queryByText(POLL_LINE)).toBeNull();
    await pass(POLL_INTERVAL_MS * 4);
    expect(reads(repository)).toBe(after);
  });
});

describe('the return link: memberly://return/portal?event=…', () => {
  it('closes an open portal, steps back to the Lineup, and the Lineup says the organizer is back', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    let arrive: () => void = () => undefined;
    function App() {
      const [returned, setReturned] = useState(false);
      useEffect(() => {
        arrive = () => setReturned(true);
      }, []);
      return (
        <>
          <LineupView eventId={EVENT} />
          {returned ? <PortalReturnRoute /> : null}
        </>
      );
    }
    await renderWithProviders(<App />, { repository });
    await screen.findByTestId('booking-dj_blkmtn');
    const portal = await openPortal();
    await press(portal.getByTestId('test-portal-accept'));

    // Gelatin's last page opens the return link; Expo Router shows the return route over the Lineup.
    mockParams = { event: EVENT };
    await act(async () => arrive());
    await waitFor(() => expect(screen.queryByTestId('test-portal')).toBeNull());
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(await screen.findByText(BACK_FROM_GELATIN)).toBeTruthy();
    expect(within(screen.getByTestId('booking-dj_blkmtn')).getByText('Confirmed')).toBeTruthy();
  });

  it('with no portal open (the app was closed meanwhile), opens the event’s Lineup, which reads again and says so', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    mockParams = { event: EVENT };
    // The return route first, then the Lineup it routes to.
    await renderWithProviders(
      <>
        <PortalReturnRoute />
        <LineupView eventId={EVENT} />
      </>,
      { repository },
    );
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/lineup', params: { id: EVENT } });
    expect(router.back).not.toHaveBeenCalled();
    // The notice follows the Lineup's own read of the bookings; nothing is assumed from the link.
    expect(await screen.findByText(BACK_FROM_GELATIN)).toBeTruthy();
    expect(reads(repository)).toBeGreaterThanOrEqual(1);
  });

  it('goes to Manage when the link names no event', async () => {
    mockParams = {};
    await renderWithProviders(<PortalReturnRoute />);
    expect(router.replace).toHaveBeenCalledWith('/manage');
  });

  it('shows the notice only on the Lineup of the event it names', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    mockParams = { event: 'e_sunday_sessions' };
    await renderWithProviders(
      <>
        <PortalReturnRoute />
        <LineupView eventId={EVENT} />
      </>,
      { repository },
    );
    await screen.findByTestId('booking-dj_blkmtn');
    expect(screen.queryByText(BACK_FROM_GELATIN)).toBeNull();
  });
});
