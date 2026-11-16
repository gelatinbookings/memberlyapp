import { useLocalSearchParams } from 'expo-router';

import { usePassSimulation } from '@/features/passes/devSimulation';
import { PassSheet } from '@/features/passes/PassSheet';

/**
 * Get a pass (GEL-1036): a bottom sheet over the event page, presented as a
 * transparent modal. `simulate` is a dev-only switch for slow, sold-out and
 * price-changed.
 */
export default function PassRoute() {
  const { id, simulate } = useLocalSearchParams<{ id: string; simulate?: string }>();
  usePassSimulation(simulate);
  return <PassSheet eventId={id} />;
}
