import { onlineManager } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { RepositoryError } from '@/data/errors';
import { createFakeRepository, DECLINED_MESSAGE, type FakeRepository } from '@/data/fakeRepository';
import type { KeyValueStorage } from '@/data/types';
import { PublishedScreen } from '@/features/events/PublishedScreen';
import { LineupView } from '@/features/lineup/LineupView';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { CONFIRMING_HOLD, OFFLINE_OFFERS_NOTICE, PAYMENT_FAILED_TITLE, paymentFailedBody, SEND_FAILED, TAKEN_BODY } from '../copy';
import { listPendingOffers } from '../pendingOffers';
import { PendingOfferSync } from '../sync';
import { bookingsOf } from '@/test-utils/bookings';
import { unbrokenParts } from '@/features/booking/lineupSummary';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Late Service: Sat, Nov 28, a draft with KOYO ($450) and NIGHTFORM (private rate) added and no offers sent. */
const EVENT = 'e_late_service';

/** One keychain that outlives a run of the app. */
function keychain() {
  const data = new Map<string, string>();
  return (): KeyValueStorage => ({
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => {
      data.set(k, v);
    },
    remove: async (k) => {
      data.delete(k);
    },
  });
}

/** A fake server where NIGHTFORM already has a $600 fee entered, so both offers can be sent. */
async function server(options: Parameters<typeof createFakeRepository>[0] = {}) {
  const repository = createFakeRepository({ delayMs: 0, ...options });
  await repository.updateDraftOffer(EVENT, 'dj_nightform', { offerCents: 60000 });
  return repository;
}

function lineup(repository: FakeRepository, storage?: KeyValueStorage) {
  return renderWithProviders(
    <>
      <PendingOfferSync />
      <LineupView eventId={EVENT} />
    </>,
    { repository, storage },
  );
}

/** Send N offers, then confirm on the review sheet for the first DJ. */
async function sendAndConfirm(label: RegExp | string = 'Hold $457.00 and send') {
  await press(await screen.findByTestId('send-offers'));
  await press(await screen.findByRole('button', { name: label }));
}

beforeEach(() => {
  jest.clearAllMocks();
  onlineManager.setOnline(true);
});
afterAll(() => onlineManager.setOnline(true));

describe('offer review', () => {
  it('shows the fee, the Gelatin service fee and the server’s total for one DJ, with the three lines and no extra fields', async () => {
    await lineup(await server());
    await press(await screen.findByTestId('send-offers'));

    const sheet = within(await screen.findByTestId('offer-review'));
    expect(sheet.getByRole('header', { name: 'Your offer to KOYO' })).toBeTruthy();
    expect(sheet.getByText('Late Service · Sat, Nov 28')).toBeTruthy();
    expect(await sheet.findByText('KOYO’s fee')).toBeTruthy();
    expect(sheet.getByText('$450.00')).toBeTruthy();
    expect(sheet.getByText('Gelatin service fee')).toBeTruthy();
    expect(sheet.getByText('$7.00')).toBeTruthy();
    expect(sheet.getByText('Held on your card')).toBeTruthy();
    expect(sheet.getByTestId('money-total')).toHaveTextContent('$457.00');
    expect(sheet.getByText('Your card is held, not charged.')).toBeTruthy();
    expect(sheet.getByText('KOYO sees the offer only after the hold succeeds.')).toBeTruthy();
    expect(
      sheet.getByText('You’re charged $457.00 only if KOYO accepts. If they pass or don’t answer in time, the hold is released.'),
    ).toBeTruthy();
    expect(sheet.getByRole('button', { name: 'Hold $457.00 and send' })).toBeTruthy();
    // Fee and note only: nothing to type on the review sheet.
    expect(sheet.queryByText(/set time|rider|deposit|counter/i)).toBeNull();
  });

  it('shows the total the server quoted, whatever it is, on every screen after', async () => {
    // Gelatin's test environment answers 47096 for a 45000 offer (GEL-1016). The app must show that, not $457.00.
    const repository = await server({ quote: () => ({ serviceFeeCents: 2096, totalCents: 47096 }) });
    await lineup(repository);
    await press(await screen.findByTestId('send-offers'));
    expect(await screen.findByTestId('money-total')).toHaveTextContent('$470.96');
    expect(screen.getByText('$20.96')).toBeTruthy();

    await press(screen.getByRole('button', { name: 'Hold $470.96 and send' }));
    const payment = within(await screen.findByTestId('test-payment-sheet'));
    expect(payment.getByTestId('test-payment-total')).toHaveTextContent('$470.96');

    await press(payment.getByTestId('test-payment-pay'));
    const held = within(await screen.findByTestId('card-held'));
    expect(held.getByText(/^\$470\.96 is held on your card, not charged\./)).toBeTruthy();
    expect(screen.queryByText(/\$457\.00/)).toBeNull();
  });

  it('carries the note, and Edit goes back to the offer fields without sending anything', async () => {
    const repository = await server();
    await repository.updateDraftOffer(EVENT, 'dj_koyo', { note: 'Headline set, midnight to 2.' });
    await lineup(repository);
    await press(await screen.findByTestId('send-offers'));
    expect(await screen.findByText('“Headline set, midnight to 2.”')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Edit offer' }));
    expect(screen.queryByTestId('offer-review')).toBeNull();
    expect(repository.fake.requestCount(EVENT)).toBe(0);
  });
});

describe('the idempotency key', () => {
  it('sends a clientOfferId made on the device and kept in secure storage until the answer arrives', async () => {
    const repository = await server();
    const storage = keychain()();
    let stored: string | undefined;
    const createOffer = jest.fn(async (...args: Parameters<FakeRepository['createOffer']>) => {
      // While the call is in flight, the id is already in secure storage.
      stored = (await listPendingOffers(storage))[0]?.clientOfferId;
      return repository.createOffer(...args);
    });
    await lineup({ ...repository, createOffer }, storage);
    await sendAndConfirm();
    await screen.findByTestId('test-payment-sheet');

    expect(createOffer).toHaveBeenCalledTimes(1);
    const [eventId, input] = createOffer.mock.calls[0];
    expect(eventId).toBe(EVENT);
    expect(input).toMatchObject({ djId: 'dj_koyo', offerCents: 45000, note: '' });
    expect(input.clientOfferId).toBeTruthy();
    expect(stored).toBe(input.clientOfferId);
    // The answer arrived: nothing is left to retry.
    await waitFor(async () => expect(await listPendingOffers(storage)).toEqual([]));
  });

  it('reuses the same id after a timeout, so the DJ gets one request', async () => {
    const repository = await server({ simulation: { timeoutNextOffer: true } });
    const createOffer = jest.fn(repository.createOffer);
    await lineup({ ...repository, createOffer });
    await sendAndConfirm();

    // The server made the request, but the answer never came back.
    expect(await screen.findByText(SEND_FAILED)).toBeTruthy();
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();

    await press(screen.getByRole('button', { name: 'Hold $457.00 and send' }));
    await screen.findByTestId('test-payment-sheet');

    expect(createOffer).toHaveBeenCalledTimes(2);
    expect(createOffer.mock.calls[1][1].clientOfferId).toBe(createOffer.mock.calls[0][1].clientOfferId);
    expect(repository.fake.requestCount(EVENT)).toBe(1);
  });

  it('reuses the same id after a cold start', async () => {
    const repository = await server();
    const open = keychain();
    // The first call is lost on the way out; the app is then closed.
    const createOffer = jest
      .fn(repository.createOffer)
      .mockRejectedValueOnce(new RepositoryError('timeout'));
    const first = await lineup({ ...repository, createOffer }, open());
    await sendAndConfirm();
    expect(await screen.findByText(SEND_FAILED)).toBeTruthy();
    await first.unmount();

    // A new run of the app: fresh memory, the same keychain.
    await lineup({ ...repository, createOffer }, open());
    await sendAndConfirm();
    await screen.findByTestId('test-payment-sheet');

    expect(createOffer).toHaveBeenCalledTimes(2);
    expect(createOffer.mock.calls[1][1].clientOfferId).toBe(createOffer.mock.calls[0][1].clientOfferId);
    expect(repository.fake.requestCount(EVENT)).toBe(1);
  });
});

describe('the card hold', () => {
  it('holds through the payment sheet, then shows the status the server gives', async () => {
    const repository = await server();
    await lineup(repository);
    await sendAndConfirm();

    const payment = within(await screen.findByTestId('test-payment-sheet'));
    expect(payment.getByText('Test payment')).toBeTruthy();
    expect(payment.getByText('Hold for KOYO · Late Service')).toBeTruthy();
    expect(payment.getByText('Held now. Charged only if KOYO accepts.')).toBeTruthy();
    // Until the hold succeeds the request is only "Payment needed".
    expect((await bookingsOf(repository, EVENT))[0].status).toBe('authorization_required');

    await press(payment.getByTestId('test-payment-pay'));
    const held = within(await screen.findByTestId('card-held'));
    expect(held.getByRole('header', { name: 'Card held. KOYO has your offer.' })).toBeTruthy();
    expect(held.getByText(/is held on your card, not charged/)).toBeTruthy();
    expect(held.getByText('Card held')).toBeTruthy();
    // Nothing says the card was charged before the DJ accepts.
    expect(held.queryByText(/(?<!not )charged(?! only)/i)).toBeNull();
    expect((await bookingsOf(repository, EVENT))[0].status).toBe('requested');

    await press(held.getByRole('button', { name: 'Back to your lineup' }));
    expect(screen.queryByTestId('card-held')).toBeNull();
    const card = within(screen.getByTestId('booking-dj_koyo'));
    expect(card.getByText('Card held · waiting for the DJ')).toBeTruthy();
    expect(card.getByText(/held on your card, not charged/)).toBeTruthy();
  });

  it('shows Card held for the first and only DJ on a lineup with no bookings yet', async () => {
    // One draft, no bookings: as the draft becomes a request the lineup must never look empty,
    // or the screen swaps to the empty state and the flow loses its place.
    const repository = createFakeRepository({ delayMs: 0 });
    await repository.removeDraftOffer(EVENT, 'dj_nightform');
    await lineup(repository);
    await press(await screen.findByTestId('send-offers'));
    await press(await screen.findByRole('button', { name: 'Hold $457.00 and send' }));

    await press(within(await screen.findByTestId('test-payment-sheet')).getByTestId('test-payment-pay'));
    const held = within(await screen.findByTestId('card-held'));
    expect(held.getByRole('header', { name: 'Card held. KOYO has your offer.' })).toBeTruthy();
    expect(held.getByRole('button', { name: 'Back to your lineup' })).toBeTruthy();
    expect(await bookingsOf(repository, EVENT)).toHaveLength(1);
  });

  it('never marks the hold done on its own: if the server still says payment needed, so does the app', async () => {
    const repository = await server();
    // The payment sheet reports success, but the server has not moved the request yet.
    const lagging: FakeRepository = { ...repository, fake: { ...repository.fake, confirmPayment: async () => ({ status: 'succeeded' }) } };
    await lineup(lagging);
    await sendAndConfirm();
    await press(await screen.findByTestId('test-payment-pay'));

    expect(await screen.findByText(CONFIRMING_HOLD)).toBeTruthy();
    expect(screen.queryByTestId('card-held')).toBeNull();
    expect(within(screen.getByTestId('booking-dj_koyo')).getByText('Payment needed')).toBeTruthy();
  });

  it('stays Payment needed with Pay now when the sheet is closed, with no error copy', async () => {
    const repository = await server();
    await lineup(repository);
    await sendAndConfirm();
    await press(await screen.findByTestId('test-payment-close'));

    await waitFor(() => expect(screen.queryByTestId('test-payment-sheet')).toBeNull());
    const card = within(await screen.findByTestId('booking-dj_koyo'));
    expect(card.getByText('Payment needed')).toBeTruthy();
    expect(card.getByRole('button', { name: 'Pay now' })).toBeTruthy();
    expect(screen.queryByTestId('payment-failed')).toBeNull();
    expect(screen.queryByText(/didn’t go through|declined|failed|error/i)).toBeNull();
    // The second DJ was not sent: still an offer to review.
    expect(screen.getByTestId('added-dj_nightform')).toBeTruthy();
    expect(repository.fake.requestCount(EVENT)).toBe(1);
  });

  it('shows the card’s message in the sheet, then "Payment didn’t go through" with Try again', async () => {
    const repository = await server();
    const createPaymentSession = jest.fn(repository.createPaymentSession);
    await lineup({ ...repository, createPaymentSession });
    await sendAndConfirm();

    await press(await screen.findByTestId('test-payment-decline'));
    expect(await screen.findByText(DECLINED_MESSAGE)).toBeTruthy();
    await press(screen.getByTestId('test-payment-close'));

    const failed = within(await screen.findByTestId('payment-failed'));
    expect(failed.getByRole('header', { name: PAYMENT_FAILED_TITLE })).toBeTruthy();
    expect(failed.getByText(paymentFailedBody('KOYO'))).toBeTruthy();
    expect(failed.getByText('Offer $450 · total $457.00')).toBeTruthy();
    expect(failed.getByText('Payment needed')).toBeTruthy();
    expect((await bookingsOf(repository, EVENT))[0].status).toBe('authorization_required');

    // Not now: the card on Lineup keeps saying so, still under "Payment needed".
    await press(failed.getByRole('button', { name: 'Not now' }));
    const card = within(screen.getByTestId('booking-dj_koyo'));
    expect(card.getByText('Payment needed')).toBeTruthy();
    expect(card.getByTestId('payment-failed-dj_koyo')).toBeTruthy();

    // Try again asks for a fresh session and opens the sheet again.
    await press(card.getByRole('button', { name: 'Try again' }));
    await press(await screen.findByTestId('test-payment-pay'));
    await screen.findByTestId('card-held');
    expect(createPaymentSession).toHaveBeenCalledTimes(2);
  });

  it('replaces an expired session without a word', async () => {
    const repository = await server({ simulation: { expiredSessions: 1 } });
    const createPaymentSession = jest.fn(repository.createPaymentSession);
    await lineup({ ...repository, createPaymentSession });
    await sendAndConfirm();

    await press(await screen.findByTestId('test-payment-pay'));
    await screen.findByTestId('card-held');
    expect(createPaymentSession).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/expired/i)).toBeNull();
  });

  it('runs the same hold from Pay now on a Lineup card', async () => {
    // Warehouse Friday: NIGHTFORM is unpaid at $607.00.
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<LineupView eventId="e_warehouse_friday" />, { repository });
    await press(await screen.findByTestId('pay-dj_nightform'));

    const payment = within(await screen.findByTestId('test-payment-sheet'));
    expect(payment.getByTestId('test-payment-total')).toHaveTextContent('$607.00');
    await press(payment.getByTestId('test-payment-pay'));
    await screen.findByTestId('card-held');
    expect((await bookingsOf(repository, 'e_warehouse_friday')).find((b) => b.dj.id === 'dj_nightform')?.status).toBe('requested');
  });

  it('runs the same hold from Pay now on the Published screen', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<PublishedScreen eventId="e_warehouse_friday" />, { repository });
    await press(await screen.findByTestId('published-pay'));
    await press(await screen.findByTestId('test-payment-pay'));

    const held = within(await screen.findByTestId('card-held'));
    await press(held.getByRole('button', { name: 'Back to your lineup' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/lineup', params: { id: 'e_warehouse_friday' } });
  });
});

describe('several DJs', () => {
  it('reviews each DJ in turn, and leaves an unpaid one as Payment needed with Pay now', async () => {
    const repository = await server();
    await lineup(repository);

    // KOYO: review, hold, card held.
    await sendAndConfirm();
    await press(await screen.findByTestId('test-payment-pay'));
    const held = within(await screen.findByTestId('card-held'));

    // On to NIGHTFORM, who has a separate total and a separate hold.
    await press(held.getByRole('button', { name: 'Next: your offer to NIGHTFORM' }));
    const review = within(await screen.findByTestId('offer-review'));
    expect(review.getByRole('header', { name: 'Your offer to NIGHTFORM' })).toBeTruthy();
    await press(await review.findByRole('button', { name: 'Hold $607.00 and send' }));

    // The payment sheet is closed without paying.
    await press(await screen.findByTestId('test-payment-close'));
    await waitFor(() => expect(screen.queryByTestId('test-payment-sheet')).toBeNull());

    expect(within(screen.getByTestId('booking-dj_koyo')).getByText('Card held · waiting for the DJ')).toBeTruthy();
    const unpaid = within(screen.getByTestId('booking-dj_nightform'));
    expect(unpaid.getByText('Payment needed')).toBeTruthy();
    expect(unpaid.getByText('$607.00')).toBeTruthy();
    expect(unpaid.getByRole('button', { name: 'Pay now' })).toBeTruthy();
    expect(screen.getByText(unbrokenParts('1 waiting · 1 to pay'))).toBeTruthy();
    expect(repository.fake.requestCount(EVENT)).toBe(2);
    expect(await repository.getDraftOffers(EVENT)).toEqual([]);
  });
});

describe('DJ taken', () => {
  it('says the DJ isn’t available, holds nothing, gives no reason, and offers DJs who are still open', async () => {
    const repository = await server({ simulation: { djTakenNext: true } });
    const createPaymentSession = jest.fn(repository.createPaymentSession);
    await lineup({ ...repository, createPaymentSession });
    await sendAndConfirm();

    const sheet = within(await screen.findByTestId('dj-taken'));
    expect(sheet.getByRole('header', { name: 'KOYO isn’t available that night' })).toBeTruthy();
    expect(sheet.getByText(new RegExp(`^${TAKEN_BODY}`))).toBeTruthy();
    // Never a reason, stated or guessed.
    expect(sheet.queryByText(/booked|confirmed|someone|declined|passed|busy|elsewhere|another (event|gig)|because|just got/i)).toBeNull();

    // Nothing was sent and nothing was held.
    expect(repository.fake.requestCount(EVENT)).toBe(0);
    expect(createPaymentSession).not.toHaveBeenCalled();
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();

    // Up to three DJs still open that night, from the catalog, each with Offer.
    expect(await sheet.findByText('BLKMTN')).toBeTruthy();
    expect(sheet.getByText('Baile funk · Jersey club · draws 150–205')).toBeTruthy();
    expect(sheet.getAllByRole('button', { name: 'Offer' }).length).toBeLessThanOrEqual(3);
    expect(sheet.queryByText('NIGHTFORM')).toBeNull();
    expect(sheet.getByRole('button', { name: 'See everyone open that night' })).toBeTruthy();
    expect(sheet.getByText('DJs, availability and rates from Gelatin')).toBeTruthy();

    // KOYO leaves the lineup; the other DJ's offer carries on.
    await waitFor(async () => expect((await repository.getDraftOffers(EVENT)).map((o) => o.dj.id)).toEqual(['dj_nightform']));
    await press(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByRole('header', { name: 'Your offer to NIGHTFORM' })).toBeTruthy();
  });

  it('still shows DJ taken when that DJ was the only one on a lineup with no bookings', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { djTakenNext: true } });
    await repository.removeDraftOffer(EVENT, 'dj_nightform');
    await lineup(repository);
    await sendAndConfirm();

    const sheet = within(await screen.findByTestId('dj-taken'));
    expect(sheet.getByRole('header', { name: 'KOYO isn’t available that night' })).toBeTruthy();
    await waitFor(async () => expect(await repository.getDraftOffers(EVENT)).toHaveLength(0));
    // The sheet outlives the lineup going empty underneath it.
    expect(screen.getByTestId('dj-taken')).toBeTruthy();
    expect(await sheet.findByText('BLKMTN')).toBeTruthy();
  });

  it('adds an alternate to the lineup with its own offer fields', async () => {
    const repository = await server({ simulation: { djTakenNext: true } });
    await lineup(repository);
    await sendAndConfirm();
    const row = within(await screen.findByTestId('alternate-dj_blkmtn'));
    await press(row.getByRole('button', { name: 'Offer' }));

    expect(screen.queryByTestId('dj-taken')).toBeNull();
    expect(await screen.findByTestId('added-dj_blkmtn')).toBeTruthy();
    expect(screen.queryByTestId('added-dj_koyo')).toBeNull();
  });

  it('opens Browse talent from See everyone open that night', async () => {
    await lineup(await server({ simulation: { djTakenNext: true } }));
    await sendAndConfirm();
    await press(await screen.findByTestId('taken-see-everyone'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/browse', params: { id: EVENT } });
  });
});

describe('offline', () => {
  it('saves the offers, says so, and sends them with the same ids when the connection returns', async () => {
    const repository = await server();
    const storage = keychain()();
    const createOffer = jest.fn(repository.createOffer);
    await lineup({ ...repository, createOffer }, storage);
    await screen.findByTestId('send-offers');

    await act(async () => onlineManager.setOnline(false));
    await press(screen.getByTestId('send-offers'));

    expect(await screen.findByText(OFFLINE_OFFERS_NOTICE)).toBeTruthy();
    expect(screen.queryByTestId('offer-review')).toBeNull();
    expect(createOffer).not.toHaveBeenCalled();
    const saved = await listPendingOffers(storage);
    expect(saved.map((o) => [o.djId, o.offerCents, o.queued])).toEqual([
      ['dj_koyo', 45000, true],
      ['dj_nightform', 60000, true],
    ]);

    // Back online: both go out by themselves, each with the id it was saved with.
    await act(async () => onlineManager.setOnline(true));
    await waitFor(() => expect(createOffer).toHaveBeenCalledTimes(2));
    expect(createOffer.mock.calls.map(([, input]) => input.clientOfferId)).toEqual(saved.map((o) => o.clientOfferId));

    await waitFor(() => expect(screen.queryByText(OFFLINE_OFFERS_NOTICE)).toBeNull());
    expect(within(await screen.findByTestId('booking-dj_koyo')).getByRole('button', { name: 'Pay now' })).toBeTruthy();
    expect(within(screen.getByTestId('booking-dj_nightform')).getByText('$607.00')).toBeTruthy();
    expect(repository.fake.requestCount(EVENT)).toBe(2);
    expect(await listPendingOffers(storage)).toEqual([]);
  });

  it('queues the offer when the connection drops on the review sheet', async () => {
    const repository = await server();
    const storage = keychain()();
    await lineup(repository, storage);
    await press(await screen.findByTestId('send-offers'));
    const confirm = await screen.findByRole('button', { name: 'Hold $457.00 and send' });

    repository.fake.simulate({ offline: true });
    await press(confirm);

    expect(await screen.findByText(OFFLINE_OFFERS_NOTICE)).toBeTruthy();
    expect(repository.fake.requestCount(EVENT)).toBe(0);
    expect((await listPendingOffers(storage)).every((o) => o.queued)).toBe(true);
  });
});
