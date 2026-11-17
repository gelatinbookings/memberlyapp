import { useEffect } from 'react';
import { onlineManager, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { isNetworkFailure, isRepositoryError } from '@/data/errors';
import { queryKeys, useRepository, useStorage } from '@/data/RepositoryProvider';
import type { MemberlyRepository } from '@/data/repository';
import type { KeyValueStorage } from '@/data/types';

import { clearPendingOffer, listPendingOffers, markPendingOffer, type PendingOffer } from './pendingOffers';

export const pendingOffersKey = ['pending-offers'] as const;

const NONE: PendingOffer[] = [];

/** Offers from this phone still waiting on an answer, for one event. */
export function usePendingOffers(eventId: string): PendingOffer[] {
  const storage = useStorage();
  // Read from this phone's secure storage, so it runs with or without a connection.
  const all = useQuery({ queryKey: pendingOffersKey, queryFn: () => listPendingOffers(storage), staleTime: 0, networkMode: 'always' });
  return all.data?.filter((o) => o.eventId === eventId) ?? NONE;
}

const running = new WeakMap<KeyValueStorage, Promise<void>>();

/**
 * Send every offer that was queued with no connection, each with the
 * `clientOfferId` it was given when the organizer tapped send. Stops at the
 * first one that still cannot reach the server and leaves the rest queued.
 */
export function flushQueuedOffers(repo: MemberlyRepository, storage: KeyValueStorage, qc: QueryClient): Promise<void> {
  const inFlight = running.get(storage);
  if (inFlight) return inFlight;
  const run = (async () => {
    const queued = (await listPendingOffers(storage)).filter((o) => o.queued);
    if (queued.length === 0) return;
    const touched = new Set<string>();
    for (const o of queued) {
      try {
        await repo.createOffer(o.eventId, {
          djId: o.djId,
          offerCents: o.offerCents,
          note: o.note,
          setStart: o.setStart ?? null,
          setEnd: o.setEnd ?? null,
          clientOfferId: o.clientOfferId,
        });
        await clearPendingOffer(storage, o);
      } catch (error) {
        if (isRepositoryError(error, 'dj_unavailable')) {
          // Lineup tells the organizer the next time it is open.
          await markPendingOffer(storage, o, { queued: false, unavailable: true });
        } else if (isNetworkFailure(error) || !isRepositoryError(error)) {
          break;
        } else {
          // offer_open, invalid_offer, not_found: resending cannot help.
          await clearPendingOffer(storage, o);
        }
      }
      touched.add(o.eventId);
    }
    touched.forEach((eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.draftOffers(eventId) });
    });
    qc.invalidateQueries({ queryKey: ['community-overview'] });
    await qc.invalidateQueries({ queryKey: pendingOffersKey });
  })().finally(() => running.delete(storage));
  running.set(storage, run);
  return run;
}

/**
 * Mounted once at the root: sends queued offers when the app opens and every
 * time the connection comes back, whichever screen is showing.
 */
export function PendingOfferSync() {
  const repo = useRepository();
  const storage = useStorage();
  const qc = useQueryClient();
  useEffect(() => {
    const flush = () => {
      if (onlineManager.isOnline()) flushQueuedOffers(repo, storage, qc).catch(() => undefined);
    };
    flush();
    return onlineManager.subscribe((online) => {
      if (online) flush();
    });
  }, [repo, storage, qc]);
  return null;
}
