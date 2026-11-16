import { router } from 'expo-router';
import { ChevronDown, Lock, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, IconButton, PillButton, Spinner, Text } from '@/components/ui';
import { useDraftOfferActions, useDraftOffers, useOrganizerEvent, useTalent, useTalentCount } from '@/data/RepositoryProvider';
import type { Dj, TalentFilters } from '@/data/types';
import { formatIsoDate } from '@/lib/dates';
import { useQueryOnline } from '@/lib/queryClient';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import {
  Attribution,
  NoCityState,
  NoneOpenState,
  NotReadyState,
  TalentSkeleton,
  TooTightState,
  UnavailableFooter,
  UnavailableState,
} from './BrowseStates';
import { DjCard } from './DjCard';
import { DjProfileSheet } from './DjProfileSheet';
import { budgetLabel, doneLabel, filtersActive, genreLabel, matchLine, NO_FILTERS, openLine } from './filters';
import { TalentFiltersSheet } from './TalentFiltersSheet';

type View_ =
  | 'loading'
  | 'results'
  | 'too-tight'
  | 'none-open'
  | 'no-city'
  | 'unavailable'
  | 'offline'
  | 'incomplete'
  | 'missing';

/**
 * Browse talent (GEL-1012 to GEL-1015): DJs open on the event's night in the
 * event's city, from Gelatin. The screen only names the event; the repository
 * derives the city and the date. Adding a DJ writes straight to the Lineup's
 * unsent offers, so closing this screen shows them there.
 */
export function BrowseTalentScreen({ eventId }: { eventId: string }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const event = useOrganizerEvent(eventId);
  const [filters, setFilters] = useState<TalentFilters>(NO_FILTERS);
  const [sheet, setSheet] = useState({ open: false, opening: 0 });
  const [profile, setProfile] = useState<Dj | null>(null);

  const talent = useTalent(eventId, filters);
  const offers = useDraftOffers(eventId);
  const actions = useDraftOfferActions(eventId);
  const online = useQueryOnline();

  const active = filtersActive(filters);
  const first = talent.data?.pages[0];
  const djs = useMemo(() => talent.data?.pages.flatMap((p) => p.djs) ?? [], [talent.data]);
  const added = useMemo(() => new Set((offers.data ?? []).map((o) => o.dj.id)), [offers.data]);
  // "3 of 10 DJs match" needs the unfiltered count too.
  const everyone = useTalentCount(eventId, NO_FILTERS, active && !!first);

  const day = event.data?.date ? formatIsoDate(event.data.date) : null;
  const city = event.data?.city?.name ?? null;

  const view: View_ =
    event.isSuccess && !event.data
      ? 'missing'
      : event.data && (!day || !city)
        ? 'incomplete'
        : first && day && city
          ? !first.citySupported
            ? 'no-city'
            : djs.length > 0
              ? 'results'
              : active
                ? 'too-tight'
                : 'none-open'
          : !online
            ? 'offline'
            : talent.isError || event.isError
              ? 'unavailable'
              : 'loading';

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/organizer/events/[id]/lineup', params: { id: eventId } });
  }, [eventId]);

  const add = (dj: Dj) => {
    // A failed add puts the card back as it was; nothing else to say here.
    actions.add(dj).catch(() => undefined);
  };
  const remove = (dj: Dj) => {
    actions.remove(dj.id).catch(() => undefined);
  };
  const toggle = (dj: Dj) => (added.has(dj.id) ? remove(dj) : add(dj));
  const retry = () => {
    if (event.isError) event.refetch();
    talent.refetch();
  };
  const openFilters = () => setSheet((s) => ({ open: true, opening: s.opening + 1 }));

  const where = day && city ? `${city} · ${day}` : 'Your event’s night and city';
  const subtitle =
    view === 'loading'
      ? day && city
        ? `Finding DJs open on ${day} in ${city}…`
        : 'Finding DJs…'
      : view === 'results' && day && city
        ? active
          ? matchLine(first?.total, everyone.data)
          : openLine(first?.total, day, city)
        : view === 'too-tight'
          ? matchLine(0, everyone.data)
          : where;

  const showFilters = (view === 'results' || view === 'too-tight') && day && city;

  return (
    <View testID="browse-talent" style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + space.md }]}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text variant="headline" accessibilityRole="header" numberOfLines={1}>
            Browse talent
          </Text>
          <Text variant="secondary" tone="muted" numberOfLines={1} testID="browse-subtitle">
            {subtitle}
          </Text>
        </View>
        <IconButton accessibilityLabel="Close" icon={<X size={18} color={c.foreground} strokeWidth={2} />} onPress={close} />
      </View>

      {showFilters ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <Chip
              testID="chip-budget"
              label={budgetLabel(filters.budget)}
              selected={filters.budget != null}
              trailingIcon={<ChevronDown size={12} color={filters.budget ? c.brandText : c.foreground} strokeWidth={2} />}
              onPress={openFilters}
            />
            <Chip
              testID="chip-genre"
              label={genreLabel(filters.genre)}
              selected={filters.genre != null}
              trailingIcon={<ChevronDown size={12} color={filters.genre ? c.brandText : c.foreground} strokeWidth={2} />}
              onPress={openFilters}
            />
            {/* The night and city are the event's: shown locked, changed in Date & time and Location. */}
            <Chip testID="chip-city" label={city} icon={<Lock size={12} color={c.mutedText} strokeWidth={2} />} onPress={openFilters} />
            <Chip testID="chip-date" label={day} icon={<Lock size={12} color={c.mutedText} strokeWidth={2} />} onPress={openFilters} />
          </ScrollView>
        </View>
      ) : null}

      {view === 'results' ? (
        <FlatList
          testID="talent-list"
          data={djs}
          keyExtractor={(dj) => dj.id}
          renderItem={({ item }) => (
            <DjCard dj={item} added={added.has(item.id)} onToggle={() => toggle(item)} onOpen={() => setProfile(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (talent.hasNextPage && !talent.isFetchingNextPage && !talent.isFetchNextPageError) talent.fetchNextPage();
          }}
          ListFooterComponent={
            talent.isFetchingNextPage ? (
              <View testID="talent-more" accessible accessibilityLabel="Loading more DJs" style={styles.more}>
                <Spinner />
              </View>
            ) : talent.isFetchNextPageError ? (
              <View style={styles.more}>
                <PillButton testID="talent-more-retry" label="Load more DJs" onPress={() => talent.fetchNextPage()} />
              </View>
            ) : undefined
          }
        />
      ) : (
        <View style={styles.state}>
          {view === 'loading' ? <TalentSkeleton /> : null}
          {view === 'no-city' && city ? (
            <NoCityState city={city} isDraft={event.data?.status !== 'published'} onContinue={close} />
          ) : null}
          {view === 'too-tight' && day ? <TooTightState eventId={eventId} filters={filters} day={day} onChange={setFilters} /> : null}
          {view === 'none-open' && day && city ? <NoneOpenState city={city} day={day} onContinue={close} /> : null}
          {view === 'unavailable' || view === 'offline' ? (
            <UnavailableState offline={view === 'offline'} onRetry={retry} onContinue={close} />
          ) : null}
          {view === 'incomplete' || view === 'missing' ? <NotReadyState missing={view === 'missing'} onBack={close} /> : null}
        </View>
      )}

      {view === 'results' ? (
        <View style={[styles.bar, { borderTopColor: c.border, backgroundColor: c.background, paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <Button testID="browse-done" label={doneLabel(added.size)} onPress={close} />
          <Attribution />
        </View>
      ) : (
        <View style={[styles.foot, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
          <Attribution />
          {view === 'unavailable' || view === 'offline' ? <UnavailableFooter /> : null}
        </View>
      )}

      {day && city ? (
        <TalentFiltersSheet
          key={sheet.opening}
          visible={sheet.open}
          eventId={eventId}
          city={city}
          day={day}
          applied={filters}
          onApply={(next) => {
            setFilters(next);
            setSheet((s) => ({ ...s, open: false }));
          }}
          onClose={() => setSheet((s) => ({ ...s, open: false }))}
        />
      ) : null}
      <DjProfileSheet
        dj={profile}
        day={day ?? ''}
        added={profile ? added.has(profile.id) : false}
        onAdd={(dj) => {
          add(dj);
          setProfile(null);
        }}
        onRemove={remove}
        onClose={() => setProfile(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingHorizontal: space.gutter },
  titles: { flex: 1, minWidth: 0 },
  filters: { gap: space.sm, paddingHorizontal: space.gutter },
  list: { paddingHorizontal: space.gutter, paddingBottom: space.md, gap: space.stack },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  state: { flex: 1, paddingHorizontal: space.gutter },
  bar: { borderTopWidth: 1, paddingTop: space.row, paddingHorizontal: space.gutter, gap: space.sm },
  foot: { paddingHorizontal: space.gutter, gap: space.stack },
});
