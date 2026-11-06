import { useLocalSearchParams } from 'expo-router';

import { PublishedScreen } from '@/features/events/PublishedScreen';

/** After Create & publish (GEL-1010). */
export default function PublishedRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PublishedScreen eventId={id} />;
}
