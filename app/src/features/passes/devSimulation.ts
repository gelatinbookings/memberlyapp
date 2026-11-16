import { useEffect } from 'react';

import { getFakeControls } from '@/data/fakeRepository';
import { useRepository } from '@/data/RepositoryProvider';

/** `?simulate=` values the Get a pass sheet accepts in development builds. See README. */
export type PassSimulationParam = 'slow' | 'sold-out' | 'price-changed';

function isSimulation(value: string | undefined): value is PassSimulationParam {
  return value === 'slow' || value === 'sold-out' || value === 'price-changed';
}

/**
 * Dev-only: puts pass checkout into an edge state for demos and screenshots,
 * e.g. memberly://event/e_rooftop_hours/pass?simulate=slow. Acts on the fake
 * repository only and does nothing in a release build.
 */
export function usePassSimulation(simulate: string | undefined): void {
  const repo = useRepository();
  const active = __DEV__ && isSimulation(simulate) ? simulate : null;

  useEffect(() => {
    const fake = getFakeControls(repo);
    if (!active || !fake) return;
    fake.simulate({
      slowPassOrder: active === 'slow',
      soldOutNext: active === 'sold-out',
      priceChangeNext: active === 'price-changed',
    });
    return () => fake.simulate({ slowPassOrder: false, soldOutNext: false, priceChangeNext: false });
  }, [active, repo]);
}
