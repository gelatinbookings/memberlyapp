import { useLocalSearchParams } from 'expo-router';

import { PassFormScreen } from '@/features/passSetup/PassFormScreen';

/** A new pass for a community (`?community=`) or an event (`?event=`), GEL-1057. */
export default function NewPassRoute() {
  const { community, event } = useLocalSearchParams<{ community?: string; event?: string }>();
  return event ? <PassFormScreen scope="event" parentId={event} /> : <PassFormScreen scope="community" parentId={community ?? ''} />;
}
