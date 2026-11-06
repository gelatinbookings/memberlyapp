import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Chip, Sheet, Text } from '@/components/ui';
import { useExplore } from '@/data/RepositoryProvider';
import type { ExploreFilters, ExploreKind } from '@/data/types';
import { ANYWHERE, COMMUNITY_TYPES, FILTER_GENRES, FILTER_VIBES, NEAR_ME } from '@/data/taxonomy';
import { size, space } from '@/theme/tokens';

import { groupCountLabel, resetFilters, showButtonLabel, toggleValue } from './filters';

function Group({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <Text variant="secondaryStrong" tone="muted">
          {title}
        </Text>
        <Text variant="helper" tone="muted">
          {count}
        </Text>
      </View>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

/**
 * Filters (F5): Communities or Events, then Location, Community type, Music
 * genres and Event vibes. The primary button carries the live count.
 */
export function ExploreFiltersSheet({
  visible,
  city,
  text,
  category,
  applied,
  onApply,
  onClose,
}: {
  visible: boolean;
  city: string;
  text: string;
  category: string;
  applied: ExploreFilters;
  onApply: (filters: ExploreFilters) => void;
  onClose: () => void;
}) {
  // Starts from what is applied; the screen remounts the sheet (a new key) on each opening.
  const [draft, setDraft] = useState(applied);

  const live = useExplore(visible ? { text, category, filters: draft } : null);
  const count = live.data?.count ?? 0;
  const set = (patch: Partial<ExploreFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const locations = [NEAR_ME, city, ANYWHERE];

  return (
    <Sheet
      testID="explore-filters"
      visible={visible}
      onClose={onClose}
      title="Filters"
      action={
        <Pressable accessibilityRole="button" accessibilityLabel="Reset" onPress={() => setDraft(resetFilters(city))} style={styles.reset}>
          <Text variant="bodyStrong" tone="brand">
            Reset
          </Text>
        </Pressable>
      }>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.kind}>
          {(['communities', 'events'] as ExploreKind[]).map((k) => (
            <Chip
              key={k}
              label={k === 'communities' ? 'Communities' : 'Events'}
              selected={draft.kind === k}
              onPress={() => set({ kind: k })}
              style={styles.kindChip}
            />
          ))}
        </View>
        <Group title="Location" count={draft.location}>
          {locations.map((l) => (
            <Chip key={l} label={l} selected={draft.location === l} onPress={() => set({ location: l })} />
          ))}
        </Group>
        <Group title="Community type" count={groupCountLabel(draft.communityTypes)}>
          {COMMUNITY_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={draft.communityTypes.includes(t)}
              onPress={() => set({ communityTypes: toggleValue(draft.communityTypes, t) })}
            />
          ))}
        </Group>
        <Group title="Music genres" count={groupCountLabel(draft.genres)}>
          {FILTER_GENRES.map((g) => (
            <Chip key={g} label={g} selected={draft.genres.includes(g)} onPress={() => set({ genres: toggleValue(draft.genres, g) })} />
          ))}
        </Group>
        <Group title="Event vibes" count={groupCountLabel(draft.vibes)}>
          {FILTER_VIBES.map((v) => (
            <Chip key={v} label={v} selected={draft.vibes.includes(v)} onPress={() => set({ vibes: toggleValue(draft.vibes, v) })} />
          ))}
        </Group>
      </ScrollView>
      <Button
        testID="explore-filters-show"
        label={live.data ? showButtonLabel(draft.kind, count) : 'Counting…'}
        disabled={!live.data || count === 0}
        onPress={() => onApply(draft)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  body: { gap: space.md },
  reset: { minHeight: size.minTarget, minWidth: size.minTarget, alignItems: 'flex-end', justifyContent: 'center' },
  kind: { flexDirection: 'row', gap: space.sm },
  kindChip: { flex: 1 },
  group: { gap: space.sm },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
