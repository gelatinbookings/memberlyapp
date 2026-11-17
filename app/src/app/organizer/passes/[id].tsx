import { useLocalSearchParams } from 'expo-router';

import { PassFormScreen } from '@/features/passSetup/PassFormScreen';

/** Edit a pass, or turn it off (GEL-1057). `?community=` or `?event=` says whose it is. */
export default function EditPassRoute() {
  const { id, community, event } = useLocalSearchParams<{ id: string; community?: string; event?: string }>();
  return event ? (
    <PassFormScreen scope="event" parentId={event} passId={id} />
  ) : (
    <PassFormScreen scope="community" parentId={community ?? ''} passId={id} />
  );
}
