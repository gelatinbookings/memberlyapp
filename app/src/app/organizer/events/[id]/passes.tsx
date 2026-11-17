import { useLocalSearchParams } from 'expo-router';

import { PassListScreen } from '@/features/passSetup/PassListScreen';

/** An event's passes (Create New Event → Access & passes, GEL-1057). */
export default function EventPassesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PassListScreen scope="event" parentId={id} />;
}
