import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, ErrorState, GroupedList, LoadingRows, Notice, Screen, Text } from '@/components/ui';
import { useEventBookings, useOrganizerEvent } from '@/data/RepositoryProvider';
import { firstUnpaid, openBookingRows } from '@/features/booking/statusLine';
import { openLater } from '@/features/navigation/later';
import { radius, space } from '@/theme/tokens';

export const NO_LINEUP_PUBLISHED =
  'Nothing was sent and nothing was charged. Add talent any time before the night.';

const toManage = () => router.dismissTo('/manage');

/**
 * After Create & publish (GEL-1010). Publishing never waited on talent; this
 * reads bookings only to say what is still open. No "Live" pill or eyebrow.
 */
export function PublishedScreen({ eventId }: { eventId: string }) {
  const event = useOrganizerEvent(eventId);
  const bookings = useEventBookings(eventId);
  const e = event.data;

  if (event.isLoading) {
    return (
      <Screen>
        <LoadingRows count={2} label="Loading" />
      </Screen>
    );
  }
  if (!e) {
    return (
      <Screen>
        <ErrorState title="This event isn’t available" detail="It may have been removed." />
        <Button label="Done" variant="secondary" onPress={toManage} />
      </Screen>
    );
  }

  const all = bookings.data ?? [];
  const rows = openBookingRows(all);
  const unpaid = firstUnpaid(all);
  const byId = new Map(all.map((b) => [b.requestId, b]));

  const second =
    all.length === 0 ? (
      <Button label="Add talent" onPress={() => openLater('Browse talent', 'browse')} style={styles.action} />
    ) : unpaid ? (
      <Button label="Pay now" onPress={() => openLater(`Pay for ${unpaid.dj.name}`, 'offer')} style={styles.action} />
    ) : (
      <Button
        label="See lineup"
        onPress={() => router.push({ pathname: '/organizer/events/[id]/lineup', params: { id: e.id } })}
        style={styles.action}
      />
    );

  return (
    <Screen
      testID="published"
      footer={
        <View style={styles.actions}>
          <Button label="Done" variant="secondary" onPress={toManage} style={styles.action} />
          {second}
        </View>
      }>
      <View style={styles.center}>
        {e.cover ? <Image source={e.cover} style={styles.cover} contentFit="cover" accessibilityLabel={`${e.name} cover`} /> : null}
        <View style={styles.text}>
          <Text variant="display" align="center" accessibilityRole="header">
            {e.name} is live
          </Text>
          <Text tone="muted" align="center">
            Your event page is published and passes are on sale.
          </Text>
        </View>
        {all.length === 0 ? (
          <Notice title="Published with no lineup." center>
            {NO_LINEUP_PUBLISHED}
          </Notice>
        ) : null}
        {rows.length > 0 ? (
          <GroupedList>
            {rows.map((r) => {
              const dj = byId.get(r.requestId)?.dj;
              return (
                <View key={r.requestId} style={styles.row} testID={`open-${r.requestId}`}>
                  {dj ? <Avatar source={dj.photo} initials={dj.initials} size={36} /> : null}
                  <View style={styles.flex}>
                    <Text variant="bodyStrong" tone={r.warning ? 'warning' : 'default'}>
                      {r.title}
                    </Text>
                    <Text variant="helper" tone="muted">
                      {r.detail}
                    </Text>
                  </View>
                </View>
              );
            })}
          </GroupedList>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: 18 },
  cover: { width: '100%', height: 180, borderRadius: radius.card },
  text: { gap: space.sm, paddingHorizontal: space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.row, paddingHorizontal: 14, paddingVertical: 12 },
  flex: { flex: 1, minWidth: 0, gap: 2 },
  actions: { flexDirection: 'row', gap: space.stack },
  action: { flex: 1, height: 52 },
});
