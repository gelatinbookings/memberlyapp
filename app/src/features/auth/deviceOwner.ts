import type { KeyValueStorage } from '@/data/types';
import { CARD_CACHE_KEY } from '@/features/card/cardCache';
import { clearPendingOffer, listPendingOffers } from '@/features/offers/pendingOffers';
import { clearPendingPassOrder, listPendingPassOrders } from '@/features/passes/pendingPassOrders';

/** Whose things are kept on this phone: the viewer id of the last person signed in. */
export const DEVICE_OWNER_KEY = 'memberly.device-owner';

/** What the phone keeps for one person between launches: the offline card, offers waiting to send, pass orders still settling. */
async function forgetPersonalState(storage: KeyValueStorage): Promise<void> {
  await storage.remove(CARD_CACHE_KEY);
  for (const offer of await listPendingOffers(storage)) await clearPendingOffer(storage, offer);
  for (const order of await listPendingPassOrders(storage)) await clearPendingPassOrder(storage, order);
}

/**
 * Make the phone's stored state belong to `viewerId`. The same person signing
 * back in keeps theirs (a queued offer must go out under the id it already
 * has). Anyone else starts clean: the last person's offline card, queued
 * offers and unsettled pass orders are removed first.
 *
 * `atLaunch`: a session restored from storage on a phone with no owner
 * recorded yet (an install from before this existed). What is stored is that
 * person's, so it is kept.
 */
export async function claimDevice(storage: KeyValueStorage, viewerId: string, { atLaunch = false }: { atLaunch?: boolean } = {}): Promise<void> {
  try {
    const owner = await storage.get(DEVICE_OWNER_KEY);
    if (owner === viewerId) return;
    if (!(atLaunch && owner == null)) await forgetPersonalState(storage);
    await storage.set(DEVICE_OWNER_KEY, viewerId);
  } catch {
    // Storage trouble never blocks signing in; the query cache is cleared regardless.
  }
}
