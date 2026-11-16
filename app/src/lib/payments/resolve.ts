import { PaymentsNotConfiguredError, type PaymentSheet } from './types';

/**
 * Which payment sheet the app uses.
 *  - A real implementation, when one is configured (M8: the Stripe sheet).
 *  - The test payment sheet, offered only when the repository is the fake one.
 *  - Otherwise nothing can take a payment. Outside development that is a
 *    build mistake and throws at once; in development the app still opens and
 *    the error surfaces the moment a payment is asked for.
 */
export function resolvePaymentSheet({
  implementation,
  testSheet,
  dev,
}: {
  implementation?: PaymentSheet;
  /** Null unless the repository is the fake one. */
  testSheet: PaymentSheet | null;
  dev: boolean;
}): PaymentSheet {
  if (implementation) return implementation;
  if (testSheet) return testSheet;
  if (!dev) throw new PaymentsNotConfiguredError();
  return { presentPaymentSheet: () => Promise.reject(new PaymentsNotConfiguredError()) };
}
