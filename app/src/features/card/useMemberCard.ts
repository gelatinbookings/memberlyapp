import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { queryKeys, useRepository, useStorage } from '@/data/RepositoryProvider';
import type { MemberCard } from '@/data/types';
import { useOnline } from '@/lib/network';

import { loadCachedCard, saveCachedCard } from './cardCache';

export type CardState =
  | { status: 'loading' }
  | { status: 'ready'; card: MemberCard; offline: boolean }
  /** No connection and no valid cached token. */
  | { status: 'unavailable'; retry: () => void };

/**
 * The card from the server when online (and cached for later); the last
 * cached card, marked "Shown offline", when the server can't be reached and
 * its QR token is still valid.
 */
export function useMemberCard(): CardState {
  const repo = useRepository();
  const storage = useStorage();
  const online = useOnline();
  const live = useQuery({ queryKey: queryKeys.card, queryFn: () => repo.getCard(), enabled: online, retry: 0 });
  const [cached, setCached] = useState<MemberCard | null | undefined>(undefined);

  useEffect(() => {
    if (live.data) saveCachedCard(storage, live.data);
  }, [live.data, storage]);

  const needCache = !online || live.isError;
  useEffect(() => {
    if (needCache && cached === undefined) loadCachedCard(storage).then(setCached);
  }, [needCache, cached, storage]);

  if (live.data && !needCache) return { status: 'ready', card: live.data, offline: false };
  if (needCache) {
    if (cached === undefined) return { status: 'loading' };
    if (cached) return { status: 'ready', card: cached, offline: true };
    return { status: 'unavailable', retry: () => live.refetch() };
  }
  return { status: 'loading' };
}
