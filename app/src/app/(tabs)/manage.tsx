import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, Plus, TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, ErrorState, LoadingRows, PillButton, Screen, SectionHeader, Text } from '@/components/ui';
import { useCommunityOverview, useOrganizedCommunities } from '@/data/RepositoryProvider';
import type { OrganizerEvent } from '@/data/types';
import { formatCents } from '@/features/booking/money';
import { lineupNeedsAction, lineupSummary } from '@/features/booking/lineupSummary';
import { addedSummary } from '@/features/events/completeness';
import { openLater } from '@/features/navigation/later';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

function toCreateEvent() {
  router.push('/organizer/events/new');
}

/** The event's lineup line on its row: booking counts, or DJs added but not sent. */
function lineupLine(event: OrganizerEvent): string | null {
  if (event.bookings.length > 0) return lineupSummary(event.bookings);
  if (event.addedDjCount > 0) return addedSummary(event.addedDjCount);
  return null;
}

function UpcomingRow({ event }: { event: OrganizerEvent }) {
  const c = useTheme();
  const summary = lineupLine(event);
  const urgent = lineupNeedsAction(event.bookings);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${event.dateLabel}, ${event.salesLabel}. Lineup: ${summary ?? 'no lineup yet'}`}
      accessibilityHint="Opens the lineup"
      onPress={() => router.push({ pathname: '/organizer/events/[id]/lineup', params: { id: event.id } })}
      style={({ pressed }) => [styles.row, { borderColor: c.border, backgroundColor: c.card }, pressed ? { opacity: 0.85 } : null]}>
      {event.cover ? (
        <Image source={event.cover} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: c.muted }]} />
      )}
      <View style={styles.flex}>
        <Text variant="cardTitle" numberOfLines={1}>
          {event.name}
        </Text>
        <Text variant="secondary" tone="muted" numberOfLines={1}>
          {event.dateLabel} · {event.salesLabel}
        </Text>
        {summary ? (
          <Text variant="helper" tone={urgent ? 'warning' : 'muted'} numberOfLines={1}>
            Lineup: {summary}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card padding={12} style={styles.stat}>
      <Text variant="helper" tone="muted">
        {label}
      </Text>
      <Text variant="headline" style={styles.tabular}>
        {value}
      </Text>
    </Card>
  );
}

export default function ManageScreen() {
  const c = useTheme();
  const organized = useOrganizedCommunities();
  const communityId = organized.data?.[0]?.id;
  const overview = useCommunityOverview(communityId);
  const o = overview.data;

  return (
    <Screen tabs>
      {overview.isPending || organized.isPending ? <LoadingRows count={3} label="Loading your community" /> : null}
      {overview.isError || organized.isError ? (
        <ErrorState title="Couldn’t load your community" onRetry={() => overview.refetch()} />
      ) : null}
      {o ? (
        <>
          <View style={styles.header}>
            <Image source={o.community.cover} style={styles.logo} contentFit="cover" />
            <View style={styles.flex}>
              <Text variant="headline" accessibilityRole="header" numberOfLines={1}>
                {o.community.name}
              </Text>
              <Text variant="secondary" tone="muted">
                {o.community.city} · {o.community.memberCount.toLocaleString('en-US')} members
              </Text>
            </View>
          </View>

          {o.setupTasks.length > 0 ? (
            <Card>
              <View style={styles.taskHead}>
                <TriangleAlert size={16} color={c.warningText} strokeWidth={2} />
                <Text variant="secondaryStrong" tone="warning">
                  Finish setting up
                </Text>
              </View>
              {o.setupTasks.map((t) => (
                <View key={t.id} style={styles.task}>
                  <View style={styles.flex}>
                    <Text variant="cardTitle">{t.title}</Text>
                    <Text variant="helper" tone="muted">
                      {t.detail}
                    </Text>
                  </View>
                  <PillButton
                    label={t.actionLabel}
                    filled
                    onPress={() => router.push({ pathname: '/later', params: { title: t.title, milestone: '8' } })}
                  />
                </View>
              ))}
            </Card>
          ) : null}

          <View style={styles.statsBlock}>
            <View style={styles.stats}>
              <Stat label="Revenue, Nov" value={formatCents(o.revenueMonthCents).replace('.00', '')} />
              <Stat label="New members" value={`+${o.newMembersMonth}`} />
              <Stat label="Churn" value={`${o.churnPercent}%`} />
            </View>
            <Text variant="helper" tone="muted">
              Sample numbers until your community is live
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.upcomingHead}>
              <View style={styles.headTitle}>
                <SectionHeader title="Upcoming events" />
              </View>
              <PillButton label="New event" filled icon={<Plus size={14} color={c.onBrand} strokeWidth={2.5} />} onPress={toCreateEvent} />
            </View>
            {o.upcoming.map((e) => (
              <UpcomingRow key={e.id} event={e} />
            ))}
          </View>

          <View style={styles.links}>
            {['Members', 'Tiers', 'Marketing'].map((label) => (
              <PillButton key={label} label={label} style={styles.link} onPress={() => openLater(label, 'web')} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  logo: { width: 44, height: 44, borderRadius: radius.notice },
  taskHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  task: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  statsBlock: { gap: space.sm },
  stats: { flexDirection: 'row', gap: space.stack },
  stat: { flex: 1, gap: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
  section: { gap: space.stack },
  headTitle: { flex: 1 },
  upcomingHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, borderWidth: 1, borderRadius: radius.card, padding: 10 },
  thumb: { width: 64, height: 64, borderRadius: radius.notice },
  links: { flexDirection: 'row', gap: space.sm },
  link: { flex: 1, paddingHorizontal: space.sm },
});
