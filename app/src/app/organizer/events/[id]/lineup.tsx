import { useIsFocused, useLocalSearchParams } from 'expo-router';

import { useStatusSimulation } from '@/features/lineup/devSimulation';
import { LineupView } from '@/features/lineup/LineupView';
import { useOfferSimulation } from '@/features/offers/devSimulation';

/**
 * The Lineup section (GEL-1009), with sending offers and the card hold
 * (GEL-1018 to GEL-1020), live status, alternates and the hand-off to Gelatin
 * (GEL-1022 to GEL-1024). `id` is "new" for an event not saved yet.
 * `simulate` is a dev-only switch for the offer and status edge states.
 * Status is polled only while this screen is the one in front.
 */
export default function LineupRoute() {
  const { id, from, simulate } = useLocalSearchParams<{ id: string; from?: string; simulate?: string }>();
  const focused = useIsFocused();
  useOfferSimulation(simulate);
  useStatusSimulation(simulate, id);
  return <LineupView eventId={id} fromForm={from === 'form'} focused={focused} />;
}
