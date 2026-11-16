import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { queryKeys, useRepository, useStorage } from '@/data/RepositoryProvider';

import { clearPendingPassOrder, listPendingPassOrders } from './pendingPassOrders';

/** How long the sheet waits for a paid order to read `paid` before saying it is still confirming. */
export const PASS_CONFIRM_TIMEOUT_MS = 10_000;
export const PASS_POLL_MS = 1000;
/** How often an order still pending after that is asked about, quietly, until it settles. */
export const PASS_WATCH_MS = 3000;

export const passWatchKey = ['pass-order-watch'] as const;

/** A new pass shows on the event page, Home, Events and the Card. */
export function refreshAfterPass(qc: QueryClient, eventId: string): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.event(eventId) }),
    qc.invalidateQueries({ queryKey: ['tonight'] }),
    qc.invalidateQueries({ queryKey: ['my-events'] }),
    qc.invalidateQueries({ queryKey: queryKeys.card }),
    qc.invalidateQueries({ queryKey: ['explore'] }),
    qc.invalidateQueries({ queryKey: queryKeys.passTypes(eventId) }),
  ]);
}

/**
 * Mounted once at the root. Pass orders that were paid for but had not read
 * `paid` when the sheet gave up waiting are asked about every few seconds
 * until they settle, whichever screen is showing and after a restart. It
 * only ever reads an order; it never starts a payment.
 */
export function PassOrderWatcher({ everyMs = PASS_WATCH_MS }: { everyMs?: number }) {
  const repo = useRepository();
  const storage = useStorage();
  const qc = useQueryClient();
  useQuery({
    queryKey: passWatchKey,
    queryFn: async () => {
      const waiting = (await listPendingPassOrders(storage)).filter((o) => o.awaiting && o.orderId);
      let open = 0;
      for (const o of waiting) {
        try {
          const order = await repo.getPassOrder(o.orderId!);
          if (order.status === 'pending') {
            open += 1;
            continue;
          }
          await clearPendingPassOrder(storage, o);
          if (order.status === 'paid') await refreshAfterPass(qc, o.eventId);
        } catch {
          open += 1;
        }
      }
      return open;
    },
    refetchInterval: (query) => ((query.state.data ?? 0) > 0 ? everyMs : false),
    staleTime: 0,
    retry: false,
  });
  return null;
}
