import { router } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomSheetFrame, SectionHeader, useTabBarClearance } from '@/components/ui';
import type { MemberEvent } from '@/data/types';
import { EventRow } from '@/features/events/EventRow';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { MapPlaceholder } from './MapPlaceholder';

/** Tonight on the map, the list in a sheet below, your own pass first. (Home's M2 layout, now behind Tonight → Map.) */
export function TonightMapView({ events, onList }: { events: MemberEvent[]; onList: () => void }) {
  const c = useTheme();
  const { height } = useWindowDimensions();
  const clearance = useTabBarClearance();
  const mapHeight = Math.round(height * 0.6);
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <MapPlaceholder events={events} height={mapHeight} />
      <BottomSheetFrame padBottom={false} style={[styles.sheet, { top: mapHeight - 60 }]}>
        <SectionHeader
          title={`${events.length} ${events.length === 1 ? 'event' : 'events'} tonight`}
          actionLabel="List view"
          onAction={onList}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.list, { paddingBottom: clearance - space.gutter }]}>
          {events.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              showDistance
              onPress={e.viewerHasPass ? () => router.push('/card') : undefined}
            />
          ))}
        </ScrollView>
      </BottomSheetFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: space.row },
  list: { gap: space.card },
});
