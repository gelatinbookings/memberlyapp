import { useLocalSearchParams } from 'expo-router';

import { LineupView } from '@/features/lineup/LineupView';
import { useOfferSimulation } from '@/features/offers/devSimulation';

/**
 * The Lineup section (GEL-1009), with sending offers and the card hold
 * (GEL-1018 to GEL-1020). `id` is "new" for an event not saved yet.
 * `simulate` is a dev-only switch for the offer edge states.
 */
export default function LineupRoute() {
  const { id, from, simulate } = useLocalSearchParams<{ id: string; from?: string; simulate?: string }>();
  useOfferSimulation(simulate);
  return <LineupView eventId={id} fromForm={from === 'form'} />;
}
