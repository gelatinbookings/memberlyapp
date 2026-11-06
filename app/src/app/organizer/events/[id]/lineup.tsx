import { useLocalSearchParams } from 'expo-router';

import { LineupView } from '@/features/lineup/LineupView';

/** The Lineup section (GEL-1009). `id` is "new" for an event not saved yet. */
export default function LineupRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  return <LineupView eventId={id} fromForm={from === 'form'} />;
}
