import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, ErrorState, IconButton, LoadingRows, Screen, Text } from '@/components/ui';
import { useTonight, useViewer } from '@/data/RepositoryProvider';
import { EventRow } from '@/features/events/EventRow';
import { TonightMapView } from '@/features/home/TonightMapView';
import { useTheme } from '@/theme/theme';
import { size, space } from '@/theme/tokens';

type TonightView = 'list' | 'map';

/** Everything on tonight in the member's city: a list by default, or the map. */
export default function TonightScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ view?: TonightView }>();
  const [view, setView] = useState<TonightView>(params.view === 'map' ? 'map' : 'list');
  const viewer = useViewer();
  const city = viewer.data?.city;
  const tonight = useTonight(city);
  const events = tonight.data ?? [];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <View style={styles.header}>
      <IconButton
        accessibilityLabel="Back"
        variant={view === 'map' ? 'card' : 'outline'}
        icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />}
        onPress={back}
      />
      <View style={styles.toggle}>
        {/* Over the map the unselected chip needs the card fill to read. */}
        <Chip label="List" selected={view === 'list'} onPress={() => setView('list')} style={view === 'map' ? { backgroundColor: c.card } : undefined} />
        <Chip label="Map" selected={view === 'map'} onPress={() => setView('map')} />
      </View>
    </View>
  );

  if (view === 'map') {
    return (
      <View style={styles.root}>
        <TonightMapView events={events} onList={() => setView('list')} />
        <View style={[styles.overMap, { top: insets.top + space.sm }]}>{header}</View>
      </View>
    );
  }

  return (
    <Screen>
      {header}
      <View style={styles.titles}>
        <Text variant="display" accessibilityRole="header">
          Tonight{city ? ` in ${city}` : ''}
        </Text>
        <Text variant="secondary" tone="muted">
          {tonight.isSuccess ? `${events.length} ${events.length === 1 ? 'event' : 'events'} · your pass first` : ' '}
        </Text>
      </View>
      {tonight.isPending ? <LoadingRows count={4} label="Loading tonight" /> : null}
      {tonight.isError ? <ErrorState title="Couldn’t load tonight" onRetry={() => tonight.refetch()} /> : null}
      {tonight.isSuccess && events.length === 0 ? (
        <View style={styles.empty}>
          <Text tone="muted">Nothing on tonight in {city}.</Text>
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/explore')} style={styles.link}>
            <Text variant="bodyStrong" tone="brand">
              See this week in Explore
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.list}>
        {events.map((e) => (
          <EventRow key={e.id} event={e} showDistance framed />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', gap: space.sm },
  overMap: { position: 'absolute', left: space.gutter, right: space.gutter },
  titles: { gap: space.xs },
  list: { gap: space.stack },
  empty: { gap: space.xs },
  link: { minHeight: size.minTarget, justifyContent: 'center', alignSelf: 'flex-start' },
});
