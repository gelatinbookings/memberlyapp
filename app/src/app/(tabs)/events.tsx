import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, ErrorState, LoadingRows, Screen, SectionHeader, Text } from '@/components/ui';
import { useMyEvents, useRepository } from '@/data/RepositoryProvider';
import type { MyEvent, MyEventsScope } from '@/data/types';
import { EventRow } from '@/features/events/EventRow';
import { countLine, groupUpcoming } from '@/features/events/grouping';
import { size, space } from '@/theme/tokens';

const SCOPES: { scope: MyEventsScope; label: string }[] = [
  { scope: 'upcoming', label: 'Upcoming' },
  { scope: 'past', label: 'Past' },
  { scope: 'saved', label: 'Saved' },
];

/** One line on why the scope is empty, and the way to Explore. */
export const EMPTY_SCOPE: Record<MyEventsScope, string> = {
  upcoming: 'Nothing coming up yet. Passes you get and events you’re going to land here.',
  past: 'Nights you’ve been to show up here the morning after.',
  saved: 'Save an event from its page to decide later. It waits for you here.',
};

function EventSection({ title, events }: { title: string; events: MyEvent[] }) {
  if (events.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {events.map((e) => (
        <EventRow key={e.id} event={e} relation={e.relation} showDate framed />
      ))}
    </View>
  );
}

export default function EventsScreen() {
  const repo = useRepository();
  const [scope, setScope] = useState<MyEventsScope>('upcoming');
  const upcoming = useMyEvents('upcoming');
  const shown = useMyEvents(scope);
  const events = shown.data ?? [];
  const groups = groupUpcoming(events, repo.now());

  return (
    <Screen tabs>
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Events
        </Text>
        <Text variant="secondary" tone="muted">
          {upcoming.data ? countLine(upcoming.data) : ' '}
        </Text>
      </View>

      <View style={styles.chips}>
        {SCOPES.map((s) => (
          <Chip key={s.scope} label={s.label} selected={scope === s.scope} onPress={() => setScope(s.scope)} />
        ))}
      </View>

      {shown.isPending ? <LoadingRows count={3} label="Loading your events" /> : null}
      {shown.isError ? <ErrorState title="Couldn’t load your events" onRetry={() => shown.refetch()} /> : null}

      {shown.isSuccess && events.length === 0 ? (
        <View style={styles.empty} testID={`events-empty-${scope}`}>
          <Text tone="muted">{EMPTY_SCOPE[scope]}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel="Find something in Explore" onPress={() => router.push('/explore')} style={styles.link}>
            <Text variant="bodyStrong" tone="brand">
              Find something in Explore
            </Text>
          </Pressable>
        </View>
      ) : null}

      {shown.isSuccess && scope !== 'past' ? (
        <>
          <EventSection title="This week" events={groups.thisWeek} />
          <EventSection title="Later" events={groups.later} />
        </>
      ) : null}

      {shown.isSuccess && scope === 'past' ? <EventSection title="Past" events={events} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  chips: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  section: { gap: space.stack },
  empty: { gap: space.xs },
  link: { minHeight: size.minTarget, justifyContent: 'center', alignSelf: 'flex-start' },
});
