import { useLocalSearchParams } from 'expo-router';

import { EventFormScreen } from '@/features/events/EventFormScreen';

/** Create New Event for a saved event; `?open=when` jumps to Date & time. */
export default function EditEventRoute() {
  const { id, open } = useLocalSearchParams<{ id: string; open?: string }>();
  return <EventFormScreen eventId={id} open={open} />;
}
