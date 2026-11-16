import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import { createFakeRepository } from '@/data/fakeRepository';
import type { MemberlyRepository } from '@/data/repository';
import type { PaymentSession } from '@/data/types';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { PaymentSheetOutlet, PaymentsNotConfiguredError, resolvePaymentSheet, sessionExpired, usePayments } from '../index';
import type { PaymentResult, PaymentSheet, PaymentSheetSession } from '../types';
import { TEST_PAYMENT_NOTE } from '../TestPaymentSheet';

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

const real: PaymentSheet = { presentPaymentSheet: async () => ({ status: 'succeeded' }) };
const test: PaymentSheet = { presentPaymentSheet: async () => ({ status: 'cancelled' }) };

describe('which payment sheet the app uses', () => {
  it('uses a configured implementation first', () => {
    expect(resolvePaymentSheet({ implementation: real, testSheet: test, dev: false })).toBe(real);
  });

  it('uses the test payment sheet only when it is offered, which is only on the fake repository', () => {
    expect(resolvePaymentSheet({ testSheet: test, dev: true })).toBe(test);
    expect(resolvePaymentSheet({ testSheet: test, dev: false })).toBe(test);
  });

  it('throws a clear error outside development when nothing real is configured', () => {
    expect(() => resolvePaymentSheet({ testSheet: null, dev: false })).toThrow(PaymentsNotConfiguredError);
    expect(() => resolvePaymentSheet({ testSheet: null, dev: false })).toThrow(/No payment sheet is configured/);
  });

  it('lets a development build open, and fails clearly when a payment is asked for', async () => {
    const sheet = resolvePaymentSheet({ testSheet: null, dev: true });
    await expect(sheet.presentPaymentSheet({} as PaymentSheetSession)).rejects.toThrow(PaymentsNotConfiguredError);
  });

  it('knows when a session has expired', () => {
    const now = Date.parse('2026-11-20T18:00:00Z');
    expect(sessionExpired({ expiresAt: '2026-11-20T18:30:00Z' }, now)).toBe(false);
    expect(sessionExpired({ expiresAt: '2026-11-20T17:59:59Z' }, now)).toBe(true);
    expect(sessionExpired({ expiresAt: 'not a date' }, now)).toBe(true);
  });
});

/** A screen that takes one payment and prints how it ended. */
function Checkout({ session, onResult }: { session: PaymentSheetSession; onResult: (r: PaymentResult | Error) => void }) {
  const payments = usePayments();
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pay"
        onPress={() => {
          payments.presentPaymentSheet(session).then(onResult, onResult);
        }}>
        <Text>Pay</Text>
      </Pressable>
      <PaymentSheetOutlet />
    </View>
  );
}

async function holdSession(repository: ReturnType<typeof createFakeRepository>): Promise<PaymentSheetSession> {
  const booking = await repository.createOffer('e_late_service', { djId: 'dj_koyo', offerCents: 45000, note: '', clientOfferId: 'offer_t' });
  const session: PaymentSession = await repository.createPaymentSession(booking.requestId);
  return { ...session, purpose: { kind: 'hold', djName: 'KOYO', eventName: 'Late Service' } };
}

describe('the test payment sheet', () => {
  it('is plainly a stand-in: a Test payment pill, the server’s total, the hold line, and no card fields', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const session = await holdSession(repository);
    await renderWithProviders(<Checkout session={session} onResult={jest.fn()} />, { repository });
    await press(screen.getByRole('button', { name: 'Pay' }));

    await screen.findByTestId('test-payment-sheet');
    expect(screen.getByText('Test payment')).toBeTruthy();
    expect(screen.getByTestId('test-payment-total')).toHaveTextContent('$457.00');
    expect(screen.getByText('Held now. Charged only if KOYO accepts.')).toBeTruthy();
    expect(screen.getByText(TEST_PAYMENT_NOTE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pay with test wallet' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Use a declined test card' })).toBeTruthy();
    // It never collects payment details: nothing to type into, and no card wording.
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/TextInput/);
    expect(screen.queryByText(/card number|expiry|MM ?\/ ?YY|CVC|CVV|security code/i)).toBeNull();
  });

  it('names the pass for a pass order', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const order = await repository.createPassOrder('e_rooftop_hours', {
      passTypeId: 'pt_rooftop_general',
      quantity: 1,
      idempotencyKey: 'pass_t',
      expectedPriceCents: 3000,
    });
    const session: PaymentSheetSession = { ...order.payment!, purpose: { kind: 'pass', passName: 'General pass', eventName: 'Rooftop Hours' } };
    await renderWithProviders(<Checkout session={session} onResult={jest.fn()} />, { repository });
    await press(screen.getByRole('button', { name: 'Pay' }));

    expect(await screen.findByText('General pass · Rooftop Hours')).toBeTruthy();
    expect(screen.getByTestId('test-payment-total')).toHaveTextContent('$30.00');
    expect(screen.queryByText(/Held now/)).toBeNull();
  });

  it('resolves succeeded, cancelled, or failed with the message', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const session = await holdSession(repository);
    const onResult = jest.fn();
    await renderWithProviders(<Checkout session={session} onResult={onResult} />, { repository });

    // Closed untouched: cancelled.
    await press(screen.getByRole('button', { name: 'Pay' }));
    await press(await screen.findByTestId('test-payment-close'));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith({ status: 'cancelled' }));
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();

    // A declined card shows its message; closing reports the failure.
    await press(screen.getByRole('button', { name: 'Pay' }));
    await press(await screen.findByTestId('test-payment-decline'));
    expect(await screen.findByText('Your card was declined. Try a different card.')).toBeTruthy();
    await press(screen.getByTestId('test-payment-close'));
    await waitFor(() =>
      expect(onResult).toHaveBeenLastCalledWith({ status: 'failed', message: 'Your card was declined. Try a different card.' }),
    );

    // The test wallet succeeds.
    await press(screen.getByRole('button', { name: 'Pay' }));
    await press(await screen.findByTestId('test-payment-pay'));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith({ status: 'succeeded' }));
  });

  it('is not offered to a repository that is not the fake one', async () => {
    const fake = createFakeRepository({ delayMs: 0 });
    const session = await holdSession(fake);
    // What M8's HTTP repository looks like to the provider: the same methods and no fake controls.
    const { fake: _controls, ...methods } = fake;
    const http: MemberlyRepository = methods;
    const onResult = jest.fn();
    await renderWithProviders(<Checkout session={session} onResult={onResult} />, { repository: http });
    await press(screen.getByRole('button', { name: 'Pay' }));

    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(onResult.mock.calls[0][0]).toBeInstanceOf(PaymentsNotConfiguredError);
    expect(screen.queryByTestId('test-payment-sheet')).toBeNull();
  });
});
