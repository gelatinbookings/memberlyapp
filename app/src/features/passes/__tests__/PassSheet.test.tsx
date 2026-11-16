import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import EventScreen from '@/app/event/[id]';
import { RepositoryError } from '@/data/errors';
import { createFakeRepository, DECLINED_MESSAGE, type FakeRepository } from '@/data/fakeRepository';
import type { KeyValueStorage } from '@/data/types';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { PassOrderWatcher } from '../passOrders';
import { PassSheet } from '../PassSheet';
import { listPendingPassOrders } from '../pendingPassOrders';
import { PASS_CONFIRMING, PASS_ON_CARD, PASS_PAYMENT_FAILED, PASS_SOLD_OUT, PASS_TRY_AGAIN } from '../usePassPurchase';

const params = { id: 'e_rooftop_hours' };
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => params,
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock; replace: jest.Mock; back: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Rooftop Hours: General pass $30, a members-free pass, and a sold-out table. The viewer has no pass yet. */
const EVENT = 'e_rooftop_hours';
const GENERAL = 'pass-get-pt_rooftop_general';

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

/** The sheet with a short wait for `paid`, and the root's watcher asking often. */
function sheet(repository: FakeRepository, storage?: KeyValueStorage) {
  return renderWithProviders(
    <>
      <PassOrderWatcher everyMs={20} />
      <PassSheet eventId={EVENT} confirmTimeoutMs={120} pollMs={10} />
    </>,
    { repository, storage },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  params.id = EVENT;
});

describe('Get a pass', () => {
  it('lists the pass types: name, price, what is included, Sold out and Free for members', async () => {
    await sheet(createFakeRepository({ delayMs: 0 }));
    expect(await screen.findByRole('header', { name: 'Get a pass' })).toBeTruthy();
    expect(await screen.findByText('Rooftop Hours · Fri, Nov 20')).toBeTruthy();

    const general = within(await screen.findByTestId('pass-pt_rooftop_general'));
    expect(general.getByText('General pass')).toBeTruthy();
    expect(general.getByText('$30')).toBeTruthy();
    expect(general.getByText('Entry all night and a welcome drink')).toBeTruthy();
    expect(general.getByRole('button', { name: 'Get General pass, $30' })).toBeTruthy();

    const member = within(screen.getByTestId('pass-pt_rooftop_member'));
    expect(member.getByText('Free for members')).toBeTruthy();
    expect(member.getByRole('button', { name: 'Claim Member pass, Free for members' })).toBeTruthy();

    const table = within(screen.getByTestId('pass-pt_rooftop_table'));
    expect(table.getByText('Sold out')).toBeTruthy();
    expect(table.queryByRole('button')).toBeNull();
  });

  it('pays for a pass with the server’s total, waits for paid, then says the pass is on the card', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await sheet(repository);
    await press(await screen.findByTestId(GENERAL));

    const payment = within(await screen.findByTestId('test-payment-sheet'));
    expect(payment.getByText('General pass · Rooftop Hours')).toBeTruthy();
    expect(payment.getByTestId('test-payment-total')).toHaveTextContent('$30.00');
    await press(payment.getByTestId('test-payment-pay'));

    expect(await screen.findByText(PASS_ON_CARD)).toBeTruthy();
    expect(repository.fake.passOrderCount()).toBe(1);
    // Home, Events and the Card all have it now.
    expect((await repository.getEvent(EVENT))?.viewerHasPass).toBe(true);
    expect((await repository.getMyEvents('upcoming')).find((e) => e.id === EVENT)?.relation).toBe('pass');
    expect((await repository.getCard()).passes?.some((p) => p.eventId === EVENT)).toBe(true);

    await press(screen.getByRole('button', { name: 'Show my pass' }));
    expect(router.replace).toHaveBeenCalledWith('/card');
  });

  it('claims a members-free pass in one tap, with no payment sheet', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await sheet(repository);
    await press(await screen.findByTestId('pass-get-pt_rooftop_member'));

    expect(await screen.findByText(PASS_ON_CARD)).toBeTruthy();
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();
    expect((await repository.getEvent(EVENT))?.viewerHasPass).toBe(true);
  });

  it('changes nothing when the payment sheet is closed, and the next try is the same order', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const createPassOrder = jest.fn(repository.createPassOrder);
    await sheet({ ...repository, createPassOrder });
    await press(await screen.findByTestId(GENERAL));
    await press(await screen.findByTestId('test-payment-close'));

    await waitFor(() => expect(screen.queryByTestId('test-payment-sheet')).toBeNull());
    expect(screen.getByRole('header', { name: 'Get a pass' })).toBeTruthy();
    expect(screen.queryByText(/didn’t go through|declined|just sold out|try again/i)).toBeNull();
    expect((await repository.getEvent(EVENT))?.viewerHasPass).toBe(false);

    await press(screen.getByTestId(GENERAL));
    await screen.findByTestId('test-payment-sheet');
    expect(createPassOrder).toHaveBeenCalledTimes(2);
    expect(createPassOrder.mock.calls[1][1].idempotencyKey).toBe(createPassOrder.mock.calls[0][1].idempotencyKey);
    expect(repository.fake.passOrderCount()).toBe(1);
  });

  it('says the payment didn’t go through after a declined card', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await sheet(repository);
    await press(await screen.findByTestId(GENERAL));
    await press(await screen.findByTestId('test-payment-decline'));
    expect(await screen.findByText(DECLINED_MESSAGE)).toBeTruthy();
    await press(screen.getByTestId('test-payment-close'));

    expect(await screen.findByText(PASS_PAYMENT_FAILED)).toBeTruthy();
    expect((await repository.getEvent(EVENT))?.viewerHasPass).toBe(false);
  });

  it('says "That pass just sold out." and refreshes the list', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { soldOutNext: true } });
    await sheet(repository);
    await press(await screen.findByTestId(GENERAL));

    expect(await screen.findByText(PASS_SOLD_OUT)).toBeTruthy();
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();
    await waitFor(() => expect(screen.queryByTestId(GENERAL)).toBeNull());
    expect(within(screen.getByTestId('pass-pt_rooftop_general')).getByText('Sold out')).toBeTruthy();
    expect(repository.fake.passOrderCount()).toBe(0);
  });

  it('shows the new price when it changed, and charges nothing until the member confirms again', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { priceChangeNext: true } });
    await sheet(repository);
    await press(await screen.findByTestId(GENERAL));

    expect(await screen.findByText('General pass is now $35. Tap Get again to confirm.')).toBeTruthy();
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();
    expect(repository.fake.passOrderCount()).toBe(0);
    expect(await within(screen.getByTestId('pass-pt_rooftop_general')).findByText('$35')).toBeTruthy();

    await press(screen.getByTestId(GENERAL));
    expect(await screen.findByTestId('test-payment-total')).toHaveTextContent('$35.00');
  });

  it('says it is still confirming after the wait, keeps asking quietly, and never charges twice', async () => {
    const repository = createFakeRepository({ delayMs: 0, simulation: { slowPassOrder: true }, slowPassConfirmMs: Infinity });
    const storage = keychain()();
    await sheet(repository, storage);
    await press(await screen.findByTestId(GENERAL));
    await press(await screen.findByTestId('test-payment-pay'));

    expect(await screen.findByText(PASS_CONFIRMING)).toBeTruthy();
    expect(screen.queryByText(PASS_ON_CARD)).toBeNull();
    // The order is remembered as paid for, so nothing can start a second payment.
    expect(await listPendingPassOrders(storage)).toMatchObject([{ eventId: EVENT, awaiting: true }]);
    expect(repository.fake.passOrderCount()).toBe(1);

    // The backend catches up; the watcher notices without anyone tapping.
    await act(async () => repository.fake.settlePassOrders());
    expect(await screen.findByText(PASS_ON_CARD)).toBeTruthy();
    await waitFor(async () => expect(await listPendingPassOrders(storage)).toEqual([]));
    expect(repository.fake.passOrderCount()).toBe(1);
  });

  it('reuses the same idempotency key after a timeout and after a restart', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const open = keychain();
    const createPassOrder = jest.fn(repository.createPassOrder).mockRejectedValueOnce(new RepositoryError('timeout'));
    const first = await sheet({ ...repository, createPassOrder }, open());
    await press(await screen.findByTestId(GENERAL));
    expect(await screen.findByText(PASS_TRY_AGAIN)).toBeTruthy();
    await first.unmount();

    // The app is opened again: fresh memory, the same keychain.
    await sheet({ ...repository, createPassOrder }, open());
    await press(await screen.findByTestId(GENERAL));
    await screen.findByTestId('test-payment-sheet');
    expect(createPassOrder).toHaveBeenCalledTimes(2);
    expect(createPassOrder.mock.calls[1][1].idempotencyKey).toBe(createPassOrder.mock.calls[0][1].idempotencyKey);
    expect(repository.fake.passOrderCount()).toBe(1);
  });
});

describe('the event page footer', () => {
  it('opens the pass sheet from Get a pass', async () => {
    await renderWithProviders(<EventScreen />);
    await press(await screen.findByRole('button', { name: 'Get a pass' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/event/[id]/pass', params: { id: EVENT } });
  });

  it('reads Show my pass once the member has one', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await repository.createPassOrder(EVENT, { passTypeId: 'pt_rooftop_member', quantity: 1, idempotencyKey: 'k', expectedPriceCents: 0 });
    await renderWithProviders(<EventScreen />, { repository });
    await press(await screen.findByRole('button', { name: 'Show my pass' }));
    expect(router.push).toHaveBeenCalledWith('/card');
    expect(screen.queryByRole('button', { name: 'Get a pass' })).toBeNull();
  });

  it('reads Sold out, disabled, when every pass type is sold out', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const soldOut: FakeRepository = {
      ...repository,
      getPassTypes: async (id) => (await repository.getPassTypes(id)).map((t) => ({ ...t, soldOut: true })),
    };
    await renderWithProviders(<EventScreen />, { repository: soldOut });
    const button = await screen.findByRole('button', { name: 'Sold out' });
    expect(button).toBeDisabled();
  });
});
