import type { KeyValueStorage } from '@/data/types';
import { newClientId } from '@/lib/clientId';
import { createPendingStore } from '@/lib/pendingStore';

/**
 * A pass order started on this phone that has not settled. The
 * `idempotencyKey` is kept in secure storage so a retry, after a timeout or
 * the app being closed, is the same order and can never be a second charge.
 */
export type PendingPassOrder = {
  eventId: string;
  passTypeId: string;
  idempotencyKey: string;
  /** Known once the server has answered. */
  orderId?: string;
  /** Paid for; waiting for the order to read `paid`. */
  awaiting?: boolean;
};

export const PENDING_PASS_ORDERS_INDEX = 'memberly.pending-pass-orders';
const PREFIX = 'memberly.pending-pass-order';

const stores = new WeakMap<KeyValueStorage, ReturnType<typeof createPendingStore<PendingPassOrder>>>();
function store(storage: KeyValueStorage) {
  let s = stores.get(storage);
  if (!s) {
    s = createPendingStore<PendingPassOrder>(storage, PENDING_PASS_ORDERS_INDEX, PREFIX);
    stores.set(storage, s);
  }
  return s;
}

type PassRef = { eventId: string; passTypeId: string };

export function listPendingPassOrders(storage: KeyValueStorage): Promise<PendingPassOrder[]> {
  return store(storage).list();
}

/** The stored order for this pass type, made if there is none. An existing key is always kept. */
export function ensurePendingPassOrder(storage: KeyValueStorage, ref: PassRef): Promise<PendingPassOrder> {
  const s = store(storage);
  return s.put(s.keyFor(ref.eventId, ref.passTypeId), (current) => ({
    ...current,
    eventId: ref.eventId,
    passTypeId: ref.passTypeId,
    idempotencyKey: current?.idempotencyKey ?? newClientId('pass'),
  }));
}

export async function markPendingPassOrder(
  storage: KeyValueStorage,
  ref: PassRef,
  patch: Pick<PendingPassOrder, 'orderId' | 'awaiting'>,
): Promise<void> {
  const s = store(storage);
  const key = s.keyFor(ref.eventId, ref.passTypeId);
  if (await s.get(key)) await s.put(key, (current) => ({ ...current!, ...patch }));
}

/** The order settled, or was never created: forget the key. */
export function clearPendingPassOrder(storage: KeyValueStorage, ref: PassRef): Promise<void> {
  const s = store(storage);
  return s.remove(s.keyFor(ref.eventId, ref.passTypeId));
}
