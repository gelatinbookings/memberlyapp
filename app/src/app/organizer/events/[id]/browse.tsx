import { useLocalSearchParams } from 'expo-router';

import { BrowseTalentScreen } from '@/features/talent/BrowseTalentScreen';
import { useTalentSimulation } from '@/features/talent/devSimulation';

/**
 * Browse talent (GEL-1012), a full-screen modal over Lineup. `simulate` is a
 * dev-only switch for the edge states: loading, unavailable, offline.
 */
export default function BrowseRoute() {
  const { id, simulate } = useLocalSearchParams<{ id: string; simulate?: string }>();
  const ready = useTalentSimulation(simulate);
  return ready ? <BrowseTalentScreen eventId={id} /> : null;
}
