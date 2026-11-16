import { useEffect, useState } from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';

import { setFakeTalentMode, TALENT_LOADING_HOLD_MS } from '@/data/fakeRepository';

/** `?simulate=` values Browse talent accepts in development builds. See README. */
export type TalentSimulationParam = 'loading' | 'unavailable' | 'offline';

/** How long `simulate=offline` stays offline before the connection "returns" and DJs load by themselves. */
export const OFFLINE_HOLD_MS = TALENT_LOADING_HOLD_MS;

function isSimulation(value: string | undefined): value is TalentSimulationParam {
  return value === 'loading' || value === 'unavailable' || value === 'offline';
}

function apply(mode: TalentSimulationParam): void {
  if (mode === 'offline') onlineManager.setOnline(false);
  else setFakeTalentMode(mode);
}

/**
 * Dev-only: puts Browse talent into an edge state for demos and screenshots,
 * e.g. memberly://organizer/events/e_long_table/browse?simulate=unavailable.
 * Acts on the fake repository only and does nothing in a release build.
 * Returns false until the state is in place, so the screen's first read
 * already meets it; with no `simulate` it is true at once.
 */
export function useTalentSimulation(simulate: string | undefined): boolean {
  const qc = useQueryClient();
  const active = __DEV__ && isSimulation(simulate) ? simulate : null;
  const [applied, setApplied] = useState<TalentSimulationParam | null>(null);

  useEffect(() => {
    if (!active) return;
    qc.removeQueries({ queryKey: ['talent'] });
    qc.removeQueries({ queryKey: ['talent-count'] });
    apply(active);
    // The connection "returns" after a while, to show DJs loading by themselves.
    const reconnect = active === 'offline' ? setTimeout(() => onlineManager.setOnline(true), OFFLINE_HOLD_MS) : null;
    const ready = setTimeout(() => setApplied(active), 0);
    return () => {
      clearTimeout(ready);
      if (reconnect) clearTimeout(reconnect);
      if (active === 'offline') onlineManager.setOnline(true);
      else setFakeTalentMode('ok');
    };
  }, [active, qc]);

  return applied === active;
}
