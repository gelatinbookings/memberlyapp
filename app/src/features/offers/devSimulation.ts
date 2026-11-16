import { useEffect } from 'react';
import { onlineManager } from '@tanstack/react-query';

import { getFakeControls } from '@/data/fakeRepository';
import { useRepository } from '@/data/RepositoryProvider';

/** `?simulate=` values Lineup accepts in development builds. See README. */
export type OfferSimulationParam = 'dj-taken' | 'timeout' | 'offline' | 'expired-session';

/** How long `simulate=offline` stays offline before the connection "returns" and queued offers send by themselves. */
export const OFFER_OFFLINE_HOLD_MS = 30_000;

function isSimulation(value: string | undefined): value is OfferSimulationParam {
  return value === 'dj-taken' || value === 'timeout' || value === 'offline' || value === 'expired-session';
}

/**
 * Dev-only: puts sending an offer into an edge state for demos and
 * screenshots, e.g. memberly://organizer/events/e_late_service/lineup?simulate=dj-taken.
 * Acts on the fake repository only and does nothing in a release build.
 * A declined payment needs no switch: the test payment sheet has a button for it.
 */
export function useOfferSimulation(simulate: string | undefined): void {
  const repo = useRepository();
  const active = __DEV__ && isSimulation(simulate) ? simulate : null;

  useEffect(() => {
    const fake = getFakeControls(repo);
    if (!active || !fake) return;
    if (active === 'offline') {
      onlineManager.setOnline(false);
      const reconnect = setTimeout(() => onlineManager.setOnline(true), OFFER_OFFLINE_HOLD_MS);
      return () => {
        clearTimeout(reconnect);
        onlineManager.setOnline(true);
      };
    }
    fake.simulate({
      djTakenNext: active === 'dj-taken',
      timeoutNextOffer: active === 'timeout',
      expiredSessions: active === 'expired-session' ? 1 : 0,
    });
    return () => fake.simulate({ djTakenNext: false, timeoutNextOffer: false, expiredSessions: 0 });
  }, [active, repo]);
}
