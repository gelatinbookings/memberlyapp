import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { isRepositoryError } from '@/data/errors';
import { queryKeys, useRepository, useStorage } from '@/data/RepositoryProvider';
import type { PassOrder, PassType } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { usePayments, type PaymentResult } from '@/lib/payments';

import { PASS_CONFIRM_TIMEOUT_MS, PASS_POLL_MS, passWatchKey, refreshAfterPass } from './passOrders';
import { clearPendingPassOrder, ensurePendingPassOrder, markPendingPassOrder } from './pendingPassOrders';

export const PASS_ON_CARD = 'Your pass is on your card.';
export const PASS_CONFIRMING = 'We’re confirming your payment. Your pass will appear on your card shortly.';
export const PASS_SOLD_OUT = 'That pass just sold out.';
export const PASS_PAYMENT_FAILED = 'Payment didn’t go through. You weren’t charged.';
export const PASS_OFFLINE = 'You’re offline. Try again when you’re back.';
export const PASS_TRY_AGAIN = 'That didn’t go through. Try again.';

/** "General pass is now $35. Tap Get again to confirm." The price is the server's. */
export function priceChangedLine(passName: string, totalCents: number): string {
  return `${passName} is now ${formatRate(totalCents)}. Tap Get again to confirm.`;
}

/** `choose`: the list. `confirming`: paid, waiting on the order. `paid`: done. `slow`: still pending after the wait. */
export type PassPhase = 'choose' | 'confirming' | 'paid' | 'slow';
export type PassNotice = { tone: 'error' | 'warning' | 'muted'; text: string } | null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get a pass (GEL-1036): order, pay through the shared payment sheet, then
 * wait for the server to say `paid`. A members-free pass is claimed in one
 * call. The total is the server's; this hook never works one out.
 */
export function usePassPurchase({
  eventId,
  eventName,
  confirmTimeoutMs = PASS_CONFIRM_TIMEOUT_MS,
  pollMs = PASS_POLL_MS,
}: {
  eventId: string;
  eventName: string;
  confirmTimeoutMs?: number;
  pollMs?: number;
}) {
  const repo = useRepository();
  const storage = useStorage();
  const qc = useQueryClient();
  const payments = usePayments();
  const [phase, setPhase] = useState<PassPhase>('choose');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<PassNotice>(null);
  const [passName, setPassName] = useState<string | null>(null);

  /** Ask until the order reads `paid`, for up to ten seconds. After that the root watcher carries on. */
  const awaitPaid = async (ref: { eventId: string; passTypeId: string }, orderId: string) => {
    setPhase('confirming');
    const deadline = Date.now() + confirmTimeoutMs;
    for (;;) {
      const order = await repo.getPassOrder(orderId).catch(() => null);
      if (order?.status === 'paid') {
        await clearPendingPassOrder(storage, ref);
        await refreshAfterPass(qc, eventId);
        setPhase('paid');
        return;
      }
      if (order?.status === 'failed') {
        await clearPendingPassOrder(storage, ref);
        setNotice({ tone: 'error', text: PASS_PAYMENT_FAILED });
        setPhase('choose');
        return;
      }
      if (Date.now() >= deadline) break;
      await sleep(pollMs);
    }
    setPhase('slow');
    qc.invalidateQueries({ queryKey: passWatchKey });
  };

  const get = async (type: PassType) => {
    if (busyId || type.soldOut) return;
    const ref = { eventId, passTypeId: type.id };
    setBusyId(type.id);
    setNotice(null);
    setPassName(type.name);
    try {
      const stored = await ensurePendingPassOrder(storage, ref);
      // Already paid for: wait for it, never pay again.
      if (stored.awaiting && stored.orderId) return await awaitPaid(ref, stored.orderId);

      let order: PassOrder;
      try {
        order = await repo.createPassOrder(eventId, {
          passTypeId: type.id,
          quantity: 1,
          idempotencyKey: stored.idempotencyKey,
          expectedPriceCents: type.priceCents,
        });
      } catch (error) {
        if (isRepositoryError(error, 'pass_unavailable')) {
          await clearPendingPassOrder(storage, ref);
          setNotice({ tone: 'error', text: PASS_SOLD_OUT });
          qc.invalidateQueries({ queryKey: queryKeys.passTypes(eventId) });
        } else if (isRepositoryError(error, 'price_changed')) {
          await clearPendingPassOrder(storage, ref);
          setNotice({
            tone: 'warning',
            text: error.totalCents != null ? priceChangedLine(type.name, error.totalCents) : `The price of ${type.name} changed. Tap Get again to confirm.`,
          });
          await qc.invalidateQueries({ queryKey: queryKeys.passTypes(eventId) });
        } else {
          // The key stays stored: trying again is the same order.
          setNotice({ tone: 'muted', text: isRepositoryError(error, 'offline') ? PASS_OFFLINE : PASS_TRY_AGAIN });
        }
        return;
      }
      await markPendingPassOrder(storage, ref, { orderId: order.orderId });

      // A members-free pass comes back paid; there is no payment step.
      if (order.status === 'paid') {
        await clearPendingPassOrder(storage, ref);
        await refreshAfterPass(qc, eventId);
        setPhase('paid');
        return;
      }
      if (!order.payment) return await awaitPaid(ref, order.orderId);

      let result: PaymentResult;
      try {
        result = await payments.presentPaymentSheet({ ...order.payment, purpose: { kind: 'pass', passName: type.name, eventName } });
      } catch {
        setNotice({ tone: 'muted', text: PASS_TRY_AGAIN });
        return;
      }
      if (result.status === 'failed') setNotice({ tone: 'error', text: PASS_PAYMENT_FAILED });
      // Cancelled: the sheet stays as it was.
      if (result.status !== 'succeeded') return;
      await markPendingPassOrder(storage, ref, { orderId: order.orderId, awaiting: true });
      qc.invalidateQueries({ queryKey: passWatchKey });
      await awaitPaid(ref, order.orderId);
    } finally {
      setBusyId(null);
    }
  };

  return {
    phase,
    busyId,
    notice,
    passName,
    /** Get or Claim one pass type. Runs on by itself; what happens shows in `phase` and `notice`. */
    get: (type: PassType) => {
      void get(type);
    },
  };
}
