import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Chip, ErrorState, LoadingRows, Screen, SectionHeader, Text } from '@/components/ui';
import { useExplore, useRepository, useViewer } from '@/data/RepositoryProvider';
import type { Community, ExploreFilters, ExploreQuery } from '@/data/types';
import { EXPLORE_CATEGORIES } from '@/data/taxonomy';
import { EventRow } from '@/features/events/EventRow';
import { ExploreFiltersSheet } from '@/features/explore/ExploreFiltersSheet';
import { defaultFilters, filtersActive } from '@/features/explore/filters';
import { LATER } from '@/features/navigation/later';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTheme } from '@/theme/theme';
import { font, radius, size, space } from '@/theme/tokens';

/** Results update after the member stops typing for this long. */
export const SEARCH_DEBOUNCE_MS = 300;
const WEEK_MS = 7 * 24 * 3600 * 1000;

function openCommunity(c: Community) {
  // Community pages are not native yet: the labelled stop for the web page.
  router.push({ pathname: '/later', params: { title: c.name, milestone: LATER.web.milestone, note: LATER.web.note } });
}

function members(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k members` : `${n} members`;
}

function CommunityTile({ community }: { community: Community }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${community.name}, ${community.city}, ${members(community.memberCount)}`}
      onPress={() => openCommunity(community)}
      style={({ pressed }) => [styles.tile, pressed ? { opacity: 0.8 } : null]}>
      <Image source={community.cover} style={styles.tileImage} contentFit="cover" />
      <Text variant="cardTitle" numberOfLines={1}>
        {community.name}
      </Text>
      <Text variant="secondary" tone="muted" numberOfLines={1}>
        {community.city} · {members(community.memberCount)}
      </Text>
    </Pressable>
  );
}

function CommunityRow({ community }: { community: Community }) {
  const c = useTheme();
  const meta = [community.city, community.type, members(community.memberCount)].filter(Boolean).join(' · ');
  return (
    <Pressable
      testID={`community-row-${community.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${community.name}, ${meta}`}
      onPress={() => openCommunity(community)}
      style={({ pressed }) => [styles.row, { borderColor: c.border, backgroundColor: c.card }, pressed ? { opacity: 0.8 } : null]}>
      <Image source={community.cover} style={styles.thumb} contentFit="cover" />
      <View style={styles.flex}>
        <Text variant="cardTitle" numberOfLines={1}>
          {community.name}
        </Text>
        <Text variant="secondary" tone="muted" numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const c = useTheme();
  const repo = useRepository();
  const viewer = useViewer();
  const city = viewer.data?.city ?? '';
  const [text, setText] = useState('');
  const [category, setCategory] = useState('All');
  const [applied, setApplied] = useState<ExploreFilters | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // A fresh key per opening, so the sheet's draft starts from the applied filters.
  const [sheetKey, setSheetKey] = useState(0);
  const openSheet = () => {
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  };
  const search = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);

  const filters = useMemo(() => applied ?? defaultFilters(city), [applied, city]);
  const narrowed = !!city && filtersActive(filters, city);
  const searching = search.length > 0 || narrowed;

  const query: ExploreQuery | null = city ? { text: searching ? search : '', category, filters } : null;
  const result = useExplore(query);

  const reset = () => {
    setText('');
    setApplied(null);
  };

  const now = repo.now().getTime();
  const thisWeek = useMemo(
    () =>
      (result.data?.events ?? []).filter(
        (e) => new Date(e.endsAt).getTime() >= now && new Date(e.startsAt).getTime() < now + WEEK_MS,
      ),
    [result.data, now],
  );

  const communities = result.data?.communities ?? [];
  const events = result.data?.events ?? [];
  // A sheet filter shows the kind it was set to; plain text shows both.
  const showCommunities = !narrowed || filters.kind === 'communities';
  const showEvents = !narrowed || filters.kind === 'events';
  const empty = (showCommunities ? communities.length : 0) + (showEvents ? events.length : 0) === 0;

  return (
    <Screen tabs>
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Explore
        </Text>
        <Text variant="secondary" tone="muted">
          Communities and events picked for you
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.search, { backgroundColor: c.card, borderColor: c.border }]}>
          <Search size={18} color={c.mutedText} strokeWidth={2} />
          <TextInput
            testID="explore-search"
            value={text}
            onChangeText={setText}
            placeholder="Community, event or vibe"
            placeholderTextColor={c.mutedText}
            selectionColor={c.ring}
            keyboardAppearance="dark"
            accessibilityLabel="Search communities and events"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.input, { color: c.foreground }]}
          />
          {text ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setText('')} hitSlop={10} style={styles.clear}>
              <X size={16} color={c.mutedText} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          testID="explore-filter-button"
          accessibilityRole="button"
          accessibilityLabel={narrowed ? 'Filters, on' : 'Filters'}
          onPress={openSheet}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: narrowed ? c.tint : pressed ? c.muted : c.card,
              borderColor: narrowed ? c.brandLine : c.border,
            },
          ]}>
          <SlidersHorizontal size={18} color={narrowed ? c.brandText : c.foreground} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.bleed}>
        {EXPLORE_CATEGORIES.map((label) => (
          <Chip key={label} label={label} selected={category === label} onPress={() => setCategory(label)} />
        ))}
      </ScrollView>

      {result.isPending ? <LoadingRows count={3} label="Loading Explore" /> : null}
      {result.isError ? (
        <ErrorState title="Couldn’t load Explore" detail="Check your connection and try again." onRetry={() => result.refetch()} />
      ) : null}

      {result.data && searching ? (
        empty ? (
          <View style={styles.empty} testID="explore-empty">
            <Text variant="title" align="center">
              {search ? `No matches for ‘${search}’` : 'No matches for these filters'}
            </Text>
            <Text tone="muted" align="center">
              Try a different word, or clear the filters.
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Reset" onPress={reset} style={styles.resetLink}>
              <Text variant="bodyStrong" tone="brand">
                Reset
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {showCommunities && communities.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title={`${communities.length} ${communities.length === 1 ? 'community' : 'communities'}`} />
                {communities.map((x) => (
                  <CommunityRow key={x.id} community={x} />
                ))}
              </View>
            ) : null}
            {showEvents && events.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title={`${events.length} ${events.length === 1 ? 'event' : 'events'}`} />
                {events.map((e) => (
                  <EventRow key={e.id} event={e} showDate framed />
                ))}
              </View>
            ) : null}
            {narrowed ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Reset filters" onPress={reset} style={styles.resetLink}>
                <Text variant="bodyStrong" tone="brand">
                  Reset filters
                </Text>
              </Pressable>
            ) : null}
          </>
        )
      ) : null}

      {result.data && !searching ? (
        <>
          <View style={styles.section}>
            <SectionHeader title="Top communities this week" />
            {communities.length > 0 ? (
              <View style={styles.grid}>
                {communities.slice(0, 4).map((x) => (
                  <CommunityTile key={x.id} community={x} />
                ))}
              </View>
            ) : (
              <Text tone="muted">No {category.toLowerCase()} communities in {city} yet.</Text>
            )}
          </View>
          <View style={styles.section}>
            <SectionHeader title="Near you this week" />
            {thisWeek.map((e) => (
              <EventRow key={e.id} event={e} showDate framed />
            ))}
            {thisWeek.length === 0 ? <Text tone="muted">Nothing like that this week. Try another chip.</Text> : null}
          </View>
        </>
      ) : null}

      <ExploreFiltersSheet
        key={sheetKey}
        visible={sheetOpen}
        city={city}
        text={search}
        category={category}
        applied={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => {
          setApplied(f);
          setSheetOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  searchRow: { flexDirection: 'row', gap: space.sm },
  search: {
    flex: 1,
    height: size.field,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.stack,
  },
  input: { flex: 1, fontFamily: font.regular, fontSize: 15, height: 46 },
  clear: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  filterButton: {
    width: size.field,
    height: size.field,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bleed: { marginHorizontal: -space.gutter },
  chips: { gap: space.sm, paddingHorizontal: space.gutter },
  section: { gap: space.row },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.row },
  tile: { width: '47%', flexGrow: 1, gap: 4 },
  tileImage: { width: '100%', height: 150, borderRadius: radius.card, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, borderWidth: 1, borderRadius: radius.card, padding: 10 },
  thumb: { width: size.rowThumb, height: size.rowThumb, borderRadius: radius.notice },
  flex: { flex: 1, gap: 2 },
  empty: { gap: space.sm, paddingVertical: space.gutter, alignItems: 'center' },
  resetLink: { minHeight: size.minTarget, alignItems: 'center', justifyContent: 'center' },
});
