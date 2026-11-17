import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getFakeControls, UNKNOWN_STATUS_SAMPLE } from '@/data/fakeRepository';
import { queryKeys, useRepository } from '@/data/RepositoryProvider';
import type { Booking } from '@/data/types';

/** `?simulate=` values Lineup accepts for status, alternates and the hand-off, in development builds. See README. */
export type StatusSimulationParam = 'stale' | 'refetch-fails' | 'unknown-status' | 'expired-launch' | 'no-alternates';

/** How long after the Lineup opens `stale` and `refetch-fails` take hold, so the first load is a current one. */
export const STATUS_SIMULATION_AFTER_MS = 3000;

function isSimulation(value: string | undefined): value is StatusSimulationParam {
  return (
    value === 'stale' || value === 'refetch-fails' || value === 'unknown-status' || value === 'expired-launch' || value === 'no-alternates'
  );
}

/**
 * Dev-only: puts booking status into an edge state for demos and screenshots,
 * e.g. memberly://organizer/events/e_warehouse_friday/lineup?simulate=stale.
 * Acts on the fake repository only and does nothing in a release build.
 *  - `stale`: reads answer with the backend's last known body.
 *  - `refetch-fails`: reads fail; the last known lineup stays.
 *  - `unknown-status`: the event's first booking reports a status the app does not know.
 *  - `expired-launch`: the next portal launch comes back expired, once.
 *  - `no-alternates`: nobody else is open that night.
 */
export function useStatusSimulation(simulate: string | undefined, eventId: string): void {
  const repo = useRepository();
  const qc = useQueryClient();
  const active = __DEV__ && isSimulation(simulate) ? simulate : null;

  useEffect(() => {
    const fake = getFakeControls(repo);
    if (!active || !fake) return;
    if (active === 'stale' || active === 'refetch-fails') {
      const patch = active === 'stale' ? { staleBookings: true } : { failBookings: true };
      const start = setTimeout(() => {
        fake.simulate(patch);
        qc.invalidateQueries({ queryKey: queryKeys.bookings(eventId) });
      }, STATUS_SIMULATION_AFTER_MS);
      return () => {
        clearTimeout(start);
        fake.simulate({ staleBookings: false, failBookings: false });
      };
    }
    if (active === 'unknown-status') {
      let cancelled = false;
      // Whichever booking is first on the event, once it has loaded.
      const pick = setTimeout(() => {
        const first = qc.getQueryData<Booking[]>(queryKeys.bookings(eventId))?.[0];
        if (cancelled || !first) return;
        fake.setStatus(first.requestId, UNKNOWN_STATUS_SAMPLE);
        qc.invalidateQueries({ queryKey: queryKeys.bookings(eventId) });
      }, STATUS_SIMULATION_AFTER_MS);
      return () => {
        cancelled = true;
        clearTimeout(pick);
      };
    }
    fake.simulate({ expiredLaunches: active === 'expired-launch' ? 1 : 0, noAlternates: active === 'no-alternates' });
    return () => fake.simulate({ expiredLaunches: 0, noAlternates: false });
  }, [active, repo, qc, eventId]);
}
