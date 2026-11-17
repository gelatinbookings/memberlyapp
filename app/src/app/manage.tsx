import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Plus, TriangleAlert } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ErrorState, LoadingRows, PillButton, Screen, ScreenHeader, SectionHeader, Text } from '@/components/ui';
import { useCommunityOverview, useOrganizedCommunities } from '@/data/RepositoryProvider';
import type { OrganizerEvent } from '@/data/types';
import { formatCents } from '@/features/booking/money';
import { lineupNeedsAction, lineupSummary } from '@/features/booking/lineupSummary';
import { addedSummary } from '@/features/events/completeness';
import { CommunityThumb } from '@/features/communities/CommunityThumb';
import { openConnectStripe } from '@/features/passSetup/PassListScreen';
import { openNewEvent } from '@/features/passSetup/routes';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

export const SAMPLE_NUMBERS_LINE = 'Sample numbers until your community is live';
export const NO_NUMBERS_LINE = 'No sales or new members yet. Your numbers start here once there are.';
export const NO_EVENTS_TITLE = 'No events yet';
export const NO_EVENTS_LINE = 'Create your first event. Once it’s published, add a lineup from its page here.';
export const NO_COMMUNITY_TITLE = 'You don’t run a community yet';
export const NO_COMMUNITY_LINE = 'When you start one, its events, members and lineup are managed here.';

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
      <CommunityThumb cover={event.cover} size={64} />
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

const backToMe = () => (router.canGoBack() ? router.back() : router.replace('/me'));

/** Manage, opened from Me under You organize (no longer a tab). */
export default function ManageScreen() {
  const c = useTheme();
  // `?community=` opens one community: the one just created, or the one chosen on Me.
  const params = useLocalSearchParams<{ community?: string }>();
  const organized = useOrganizedCommunities();
  const list = organized.data ?? [];
  const communityId = (list.find((x) => x.id === params.community) ?? list[0])?.id;
  const toCreateEvent = () => openNewEvent(communityId);
  const overview = useCommunityOverview(communityId);
  const o = overview.data;
  // Someone who runs nothing can still land here from a link; say so plainly.
  const noCommunity = organized.isSuccess && !communityId;

  return (
    <Screen header={<ScreenHeader title="Manage" onBack={backToMe} />} testID="manage">
      {noCommunity ? (
        <View style={styles.none} testID="manage-no-community">
          <Text variant="headline" accessibilityRole="header">
            {NO_COMMUNITY_TITLE}
          </Text>
          <Text tone="muted">{NO_COMMUNITY_LINE}</Text>
        </View>
      ) : null}
      {!noCommunity && (overview.isPending || organized.isPending) ? <LoadingRows count={3} label="Loading your community" /> : null}
      {overview.isError || organized.isError || (overview.isSuccess && !o) ? (
        // An overview that comes back empty is a failure to say so, not a blank screen.
        <ErrorState
          title="Couldn’t load your community"
          onRetry={() => {
            organized.refetch();
            overview.refetch();
          }}
        />
      ) : null}
      {list.length > 1 ? (
        // Several communities: choose which one this screen manages.
        <View style={styles.switcher} accessibilityRole="radiogroup" testID="manage-switcher">
          {list.map((x) => (
            <Chip key={x.id} testID={`manage-community-${x.id}`} label={x.name} selected={x.id === communityId} onPress={() => router.setParams({ community: x.id })} />
          ))}
        </View>
      ) : null}
      {o ? (
        <>
          <View style={styles.header}>
            <CommunityThumb cover={o.community.logo ?? o.community.cover} />
            <View style={styles.flex}>
              <Text variant="headline" accessibilityRole="header" numberOfLines={1}>
                {o.community.name}
              </Text>
              <Text variant="secondary" tone="muted">
                {o.community.city} · {o.community.memberCount.toLocaleString('en-US')} {o.community.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>

          {o.setupTasks.length > 0 ? (
            <Card testID="manage-setup">
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
                    testID={`setup-${t.id}`}
                    label={t.actionLabel}
                    filled
                    onPress={() => (t.id === 'stripe' ? openConnectStripe(o.community.id) : router.push({ pathname: '/later', params: { title: t.title, milestone: '8' } }))}
                  />
                </View>
              ))}
            </Card>
          ) : null}

          <View style={styles.statsBlock}>
            <View style={styles.stats}>
              <Stat label="Revenue, Nov" value={formatCents(o.revenueMonthCents).replace('.00', '')} />
              <Stat label="New members" value={`+${o.newMembersMonth}`} />
              <Stat label="Churn" value={o.churnPercent == null ? '–' : `${o.churnPercent}%`} />
            </View>
            {o.sampleNumbers ? (
              <Text variant="helper" tone="muted">
                {SAMPLE_NUMBERS_LINE}
              </Text>
            ) : o.churnPercent == null ? (
              <Text variant="helper" tone="muted" testID="manage-no-numbers">
                {NO_NUMBERS_LINE}
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.upcomingHead}>
              <View style={styles.headTitle}>
                <SectionHeader title="Upcoming events" />
              </View>
              {o.upcoming.length > 0 ? (
                <PillButton label="New event" filled icon={<Plus size={14} color={c.onBrand} strokeWidth={2.5} />} onPress={toCreateEvent} />
              ) : null}
            </View>
            {o.upcoming.map((e) => (
              <UpcomingRow key={e.id} event={e} />
            ))}
            {o.upcoming.length === 0 ? (
              <Card testID="manage-no-events" style={styles.noEvents}>
                <View style={styles.noEventsText}>
                  <Text variant="cardTitle" align="center">
                    {NO_EVENTS_TITLE}
                  </Text>
                  <Text variant="secondary" tone="muted" align="center">
                    {NO_EVENTS_LINE}
                  </Text>
                </View>
                <Button label="New event" icon={<Plus size={18} color={c.onBrand} strokeWidth={2} />} onPress={toCreateEvent} />
              </Card>
            ) : null}
          </View>

          <View style={styles.links}>
            <PillButton
              testID="manage-members"
              label="Members"
              style={styles.link}
              onPress={() => router.push({ pathname: '/organizer/communities/[id]/members', params: { id: o.community.id } })}
            />
            <PillButton
              testID="manage-tiers"
              label="Tiers"
              style={styles.link}
              onPress={() => router.push({ pathname: '/organizer/communities/[id]/passes', params: { id: o.community.id } })}
            />
            <PillButton
              testID="manage-marketing"
              label="Marketing"
              style={styles.link}
              onPress={() => router.push({ pathname: '/organizer/communities/[id]/marketing', params: { id: o.community.id } })}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  none: { gap: space.sm },
  noEvents: { gap: space.card, paddingVertical: space.gutter },
  noEventsText: { gap: space.xs, paddingHorizontal: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
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
  links: { flexDirection: 'row', gap: space.sm },
  link: { flex: 1, paddingHorizontal: space.sm },
});
