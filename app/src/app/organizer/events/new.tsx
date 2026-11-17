import { useLocalSearchParams } from 'expo-router';

import { EventFormScreen } from '@/features/events/EventFormScreen';

/** Create New Event for a new event (GEL-1008); `?community=` says whose it is (GEL-1055). */
export default function NewEventRoute() {
  const { community } = useLocalSearchParams<{ community?: string }>();
  return <EventFormScreen communityId={community} />;
}
