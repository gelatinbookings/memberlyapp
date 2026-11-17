import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spinner } from '@/components/ui';
import { usePortalReturn } from '@/lib/portal';
import { useTheme } from '@/theme/theme';

/**
 * Where Gelatin's portal sends the organizer when they are done (GEL-1024):
 * memberly://return/portal?event=<event id>. The link carries nothing but the
 * event to land on; whatever happened over there is read from the server.
 *
 * With the portal still open over the app (the usual case on iPhone), this
 * closes it and steps back to the screen that opened it, which reads the
 * lineup again and shows "Back from Gelatin". With nothing open (the app was
 * closed in the meantime), it opens the event's Lineup, which does the same.
 */
export default function PortalReturnRoute() {
  const c = useTheme();
  const { event } = useLocalSearchParams<{ event?: string }>();
  const { completeReturn } = usePortalReturn();
  const eventId = typeof event === 'string' && event.length > 0 ? event : null;

  useEffect(() => {
    const wasOpen = completeReturn(eventId);
    if (wasOpen && router.canGoBack()) router.back();
    else if (eventId) router.replace({ pathname: '/organizer/events/[id]/lineup', params: { id: eventId } });
    else router.replace('/manage');
  }, [completeReturn, eventId]);

  return (
    <View style={[styles.fill, { backgroundColor: c.background }]} accessibilityLabel="Returning to Memberly">
      <Spinner />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
