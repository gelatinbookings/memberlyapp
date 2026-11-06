import type { KeyValueStorage, MemberCard } from '@/data/types';

export const CARD_CACHE_KEY = 'memberly.card';

/** The last card the server sent, kept in secure storage for the door with no signal. */
export async function saveCachedCard(storage: KeyValueStorage, card: MemberCard): Promise<void> {
  try {
    await storage.set(CARD_CACHE_KEY, JSON.stringify(card));
  } catch {
    // Caching is a nicety; the card on screen is unaffected.
  }
}

/** The cached card while its QR token is still valid; null otherwise. */
export async function loadCachedCard(storage: KeyValueStorage, now: number = Date.now()): Promise<MemberCard | null> {
  try {
    const raw = await storage.get(CARD_CACHE_KEY);
    if (!raw) return null;
    const card = JSON.parse(raw) as MemberCard;
    return new Date(card.qr.expiresAt).getTime() > now ? card : null;
  } catch {
    return null;
  }
}
