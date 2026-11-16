import type { KeyValueStorage } from '@/data/types';
import { newClientId } from '@/lib/clientId';
import { createPendingStore } from '@/lib/pendingStore';

/**
 * An offer the organizer has sent from this phone whose answer has not come
 * back yet. Kept in secure storage so a retry, after a timeout, a lost
 * connection or the app being closed, sends the same `clientOfferId` and the
 * DJ never gets two requests.
 */
export type PendingOffer = {
  eventId: string;
  djId: string;
  clientOfferId: string;
  offerCents: number;
  note: string;
  /** Sent with no connection: goes out by itself when the connection returns. */
  queued?: boolean;
  /** Went out from the queue and the DJ was not available. Lineup says so once. */
  unavailable?: boolean;
};

export const PENDING_OFFERS_INDEX = 'memberly.pending-offers';
const PREFIX = 'memberly.pending-offer';

const stores = new WeakMap<KeyValueStorage, ReturnType<typeof createPendingStore<PendingOffer>>>();
function store(storage: KeyValueStorage) {
  let s = stores.get(storage);
  if (!s) {
    s = createPendingStore<PendingOffer>(storage, PENDING_OFFERS_INDEX, PREFIX);
    stores.set(storage, s);
  }
  return s;
}

type OfferRef = { eventId: string; djId: string };

export function listPendingOffers(storage: KeyValueStorage): Promise<PendingOffer[]> {
  return store(storage).list();
}

/**
 * The stored offer for this DJ on this event, made if there is none. An
 * existing `clientOfferId` is always kept: that is the whole point.
 */
export function ensurePendingOffer(
  storage: KeyValueStorage,
  offer: OfferRef & { offerCents: number; note: string },
  flags: Pick<PendingOffer, 'queued'> = {},
): Promise<PendingOffer> {
  const s = store(storage);
  return s.put(s.keyFor(offer.eventId, offer.djId), (current) => ({
    eventId: offer.eventId,
    djId: offer.djId,
    clientOfferId: current?.clientOfferId ?? newClientId('offer'),
    offerCents: offer.offerCents,
    note: offer.note,
    ...(flags.queued || current?.queued ? { queued: true } : null),
  }));
}

export async function markPendingOffer(
  storage: KeyValueStorage,
  ref: OfferRef,
  flags: Pick<PendingOffer, 'queued' | 'unavailable'>,
): Promise<void> {
  const s = store(storage);
  const key = s.keyFor(ref.eventId, ref.djId);
  if (await s.get(key)) await s.put(key, (current) => ({ ...current!, ...flags }));
}

/** The answer arrived (or the request can never succeed): forget the id. */
export function clearPendingOffer(storage: KeyValueStorage, ref: OfferRef): Promise<void> {
  const s = store(storage);
  return s.remove(s.keyFor(ref.eventId, ref.djId));
}
