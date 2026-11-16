import type { PaymentSession } from '@/data/types';

/** What the payment is for, so the sheet can say it in words. */
export type PaymentPurpose =
  | { kind: 'hold'; djName: string; eventName: string }
  | { kind: 'pass'; passName: string; eventName: string };

/**
 * One payment to present: the session exactly as Memberly's backend returned
 * it (client secret, publishable key, account, the server's total, merchant
 * name, expiry) plus what to call it on screen.
 */
export type PaymentSheetSession = PaymentSession & { purpose: PaymentPurpose };

/**
 * `succeeded`: the provider accepted the payment; the app still asks the server what happened.
 * `cancelled`: the sheet was closed; nothing changed.
 * `failed`: the provider refused it; `message` is the provider's own wording.
 */
export type PaymentResult = { status: 'succeeded' | 'cancelled' | 'failed'; message?: string };

/**
 * The one way the app takes a payment: card holds and pass orders both call
 * this. The implementation never hands card details to the app.
 */
export interface PaymentSheet {
  presentPaymentSheet(session: PaymentSheetSession): Promise<PaymentResult>;
}

export class PaymentsNotConfiguredError extends Error {
  readonly code = 'payments_not_configured';

  constructor() {
    super(
      'No payment sheet is configured. The test payment sheet only runs on the sample (fake) repository; pass a real implementation to <PaymentsProvider implementation={…}> (see "Where Stripe plugs in" in README.md).',
    );
    this.name = 'PaymentsNotConfiguredError';
  }
}

/** True once a session can no longer be used and a fresh one is needed. */
export function sessionExpired(session: Pick<PaymentSession, 'expiresAt'>, now: number = Date.now()): boolean {
  const at = Date.parse(session.expiresAt);
  return Number.isNaN(at) || at <= now;
}
