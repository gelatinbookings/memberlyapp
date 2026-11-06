import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Map as MapIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, ErrorState, IconButton, Screen, SectionHeader, Skeleton, Text } from '@/components/ui';
import { useMyEvents, useRepository, useTonight, useViewer } from '@/data/RepositoryProvider';
import type { MemberEvent } from '@/data/types';
import { featuredLabel, greeting, isTonight, lineupLine, longDate, passLine, pickFeatured, type Featured } from '@/features/home/featured';
import { formatEventDate, formatEventTime } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { font, radius, size, space } from '@/theme/tokens';

const logo = require('@/assets/images/logo-memberly.png');
const LOGO_RATIO = 740 / 210;
/** The viewer's city zone until the profile carries one (M8). */
const CITY_ZONE = 'America/New_York';

function openEvent(e: MemberEvent) {
  router.push({ pathname: '/event/[id]', params: { id: e.id } });
}

/** The committed purple Memberly card: brand fill, white Show card pill. */
function MemberCardTeaser({ name, communities, line }: { name: string; communities: number; line: string }) {
  const c = useTheme();
  return (
    <View style={[styles.member, { backgroundColor: c.brand }]} testID="home-member-card">
      <View style={styles.memberTop}>
        <Image source={logo} style={styles.memberLogo} contentFit="contain" accessibilityLabel="Memberly" />
        <Text variant="helper" tone="onBrand" style={styles.soft}>
          {communities} {communities === 1 ? 'community' : 'communities'}
        </Text>
      </View>
      <View style={styles.memberBottom}>
        <View style={styles.flex}>
          <Text variant="title" tone="onBrand" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="secondary" tone="onBrand" style={styles.soft} numberOfLines={1}>
            {line}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show card"
          onPress={() => router.push('/card')}
          style={({ pressed }) => [styles.showCard, { backgroundColor: c.onBrand, opacity: pressed ? 0.85 : 1 }]}>
          <Text variant="secondaryStrong" style={[styles.showCardLabel, { color: c.brand }]}>
            Show card
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScrimPill({ label }: { label: string }) {
  const c = useTheme();
  return (
    <View style={[styles.scrimPill, { backgroundColor: c.scrim }]}>
      <Text variant="helper" tone="onBrand" style={styles.semibold}>
        {label}
      </Text>
    </View>
  );
}

/** Tonight's pass (or the next one, or tonight's top event) as a large photo card. */
function FeaturedCard({ featured, now }: { featured: Featured; now: Date }) {
  const c = useTheme();
  const e = featured.event;
  const when = isTonight(e, now)
    ? formatEventTime(e.startsAt, e.timeZone)
    : `${formatEventDate(e.startsAt, e.timeZone)} · ${formatEventTime(e.startsAt, e.timeZone)}`;
  const label = featuredLabel(featured);
  const meta = lineupLine(e);
  return (
    <Pressable
      testID="home-featured"
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${e.name}, ${when}, ${meta}`}
      onPress={() => openEvent(e)}
      style={({ pressed }) => [styles.featured, pressed ? { opacity: 0.9 } : null]}>
      <Image source={e.cover} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.featuredPills}>
        <ScrimPill label={label} />
        <ScrimPill label={when} />
      </View>
      <View style={[styles.featuredBand, { backgroundColor: c.scrim }]}>
        <Text variant="headline" tone="onBrand" style={styles.featuredTitle} numberOfLines={1}>
          {e.name}
        </Text>
        <Text variant="secondary" tone="onBrand" style={styles.soft} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

function CarouselCard({ event }: { event: MemberEvent }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${event.priceLabel}`}
      onPress={() => openEvent(event)}
      style={({ pressed }) => [styles.carouselCard, pressed ? { opacity: 0.85 } : null]}>
      <Image source={event.cover} style={styles.carouselImage} contentFit="cover" />
      <Text variant="bodyStrong" numberOfLines={1}>
        {event.name}
      </Text>
      <Text variant="helper" tone="muted" numberOfLines={1}>
        {event.viewerHasPass ? 'Your pass' : event.priceLabel}
      </Text>
    </Pressable>
  );
}

function HomeSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading Home" accessibilityState={{ busy: true }}>
      <Skeleton height={124} />
      <Skeleton height={300} />
      <Skeleton height={20} width="40%" round />
      <View style={styles.skeletonRow}>
        <Skeleton height={110} width={150} />
        <Skeleton height={110} width={150} />
      </View>
    </View>
  );
}

/** Home, "2 · Exploring": greeting, the purple Memberly card, tonight's pass, and what else is on. */
export default function HomeScreen() {
  const c = useTheme();
  const repo = useRepository();
  const viewer = useViewer();
  const v = viewer.data;
  const tonight = useTonight(v?.city);
  const upcoming = useMyEvents('upcoming');
  const now = repo.now();
  const events = tonight.data ?? [];
  const ready = !!v && tonight.isSuccess && upcoming.isSuccess;
  const featured = ready ? pickFeatured(events, upcoming.data ?? [], now) : null;
  const also = events.filter((e) => e.id !== featured?.event.id);

  return (
    <Screen tabs testID="home">
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="secondary" tone="muted">
            {longDate(now, CITY_ZONE)}
          </Text>
          <Text variant="display" accessibilityRole="header" style={styles.greeting}>
            {greeting(now, CITY_ZONE)},{'\n'}
            {v?.firstName ?? ' '}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            accessibilityLabel="Tonight on the map"
            variant="card"
            size={size.field}
            icon={<MapIcon size={20} color={c.foreground} strokeWidth={2} />}
            onPress={() => router.push({ pathname: '/tonight', params: { view: 'map' } })}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Me" onPress={() => router.navigate('/me')}>
            <Avatar initials={v?.initials ?? ''} size={size.field} />
          </Pressable>
        </View>
      </View>

      {viewer.isError || tonight.isError ? (
        <ErrorState
          title="Couldn’t load tonight"
          detail="Check your connection and try again."
          onRetry={() => {
            viewer.refetch();
            tonight.refetch();
            upcoming.refetch();
          }}
        />
      ) : null}

      {!ready && !viewer.isError && !tonight.isError ? <HomeSkeleton /> : null}

      {ready && v ? (
        <>
          <MemberCardTeaser name={`${v.firstName} ${v.lastName}`} communities={v.communityCount} line={passLine(events, featured)} />
          {featured ? <FeaturedCard featured={featured} now={now} /> : null}

          {events.length === 0 ? (
            <View style={styles.empty} testID="home-empty">
              <Text variant="title">Nothing on tonight in {v.city}</Text>
              <Text tone="muted">See what’s coming up this week.</Text>
              <Pressable accessibilityRole="link" onPress={() => router.navigate('/explore')} style={styles.link}>
                <Text variant="bodyStrong" tone="brand">
                  Explore this week
                </Text>
              </Pressable>
            </View>
          ) : null}

          {also.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Also tonight" actionLabel="See all" onAction={() => router.push('/tonight')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.carousel}>
                {also.map((e) => (
                  <CarouselCard key={e.id} event={e} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: space.row },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  greeting: { fontSize: 34, lineHeight: 36, letterSpacing: -1, marginTop: 2 },
  member: { borderRadius: radius.card, padding: 18, gap: 28 },
  memberTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberLogo: { height: 22, width: 22 * LOGO_RATIO },
  memberBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: space.row },
  soft: { opacity: 0.85 },
  semibold: { fontFamily: font.semibold },
  showCard: { minHeight: size.minTarget, paddingHorizontal: space.md, borderRadius: radius.pill, justifyContent: 'center' },
  showCardLabel: { fontFamily: font.bold },
  featured: { height: 300, borderRadius: radius.card, overflow: 'hidden', justifyContent: 'space-between' },
  featuredPills: { flexDirection: 'row', gap: space.label, padding: space.card },
  scrimPill: { height: 30, paddingHorizontal: space.stack, borderRadius: radius.pill, justifyContent: 'center' },
  featuredBand: { padding: space.card, gap: space.xs },
  featuredTitle: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 25 },
  section: { gap: space.row },
  bleed: { marginHorizontal: -space.gutter },
  carousel: { gap: space.row, paddingHorizontal: space.gutter },
  carouselCard: { width: 150, gap: 2 },
  carouselImage: { width: 150, height: 110, borderRadius: radius.card, marginBottom: 4 },
  empty: { gap: space.xs },
  link: { minHeight: size.minTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  skeleton: { gap: space.section },
  skeletonRow: { flexDirection: 'row', gap: space.row },
});
