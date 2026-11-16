import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Chip, Sheet, Skeleton, Text } from '@/components/ui';
import { useTalentCount, useTalentGenres } from '@/data/RepositoryProvider';
import type { TalentFilters } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { BUDGET_BANDS, genreOptions, NO_FILTERS, showDjsLabel, toggleBudget, toggleGenre } from './filters';

export const LOCKED_HELPER = 'Change these in Date & time and Location.';

/** The event's city or night: shown, never editable here. */
function Locked({ label }: { label: string }) {
  const c = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}, from your event`} style={[styles.locked, { backgroundColor: c.muted }]}>
      <Lock size={13} color={c.foreground} strokeWidth={2} />
      <Text variant="secondaryStrong">{label}</Text>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="secondaryStrong" tone="muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Filters (GEL-1013): the event's city and night shown locked, then one
 * budget band and one genre. Nothing changes until the button is pressed;
 * closing the sheet any other way keeps what was applied.
 */
export function TalentFiltersSheet({
  visible,
  eventId,
  city,
  day,
  applied,
  onApply,
  onClose,
}: {
  visible: boolean;
  eventId: string;
  city: string;
  day: string;
  applied: TalentFilters;
  onApply: (filters: TalentFilters) => void;
  onClose: () => void;
}) {
  // Starts from what is applied; the screen remounts the sheet (a new key) on each opening.
  const [draft, setDraft] = useState(applied);
  // Genres come from Gelatin for this city and the chosen band.
  const genres = useTalentGenres(eventId, draft.budget, visible);
  const count = useTalentCount(eventId, draft, visible, true);
  const options = genreOptions(genres.data ?? [], draft.genre);

  return (
    <Sheet
      testID="talent-filters"
      visible={visible}
      onClose={onClose}
      title="Filters"
      action={
        <Pressable accessibilityRole="button" accessibilityLabel="Reset" onPress={() => setDraft(NO_FILTERS)} style={styles.reset}>
          <Text variant="bodyStrong" tone="brand">
            Reset
          </Text>
        </Pressable>
      }>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Group title="From your event">
          <View style={styles.chips}>
            <Locked label={city} />
            <Locked label={day} />
          </View>
          <Text variant="helper" tone="muted">
            {LOCKED_HELPER}
          </Text>
        </Group>
        <Group title="Budget per DJ">
          <View style={styles.chips}>
            {BUDGET_BANDS.map((b) => (
              <Chip
                key={b.id}
                testID={`budget-${b.id}`}
                label={b.label}
                selected={draft.budget === b.id}
                onPress={() => setDraft((d) => toggleBudget(d, b.id))}
                style={styles.half}
              />
            ))}
          </View>
        </Group>
        <Group title="Genre">
          <View style={styles.chips}>
            {genres.data ? (
              options.map((g) => (
                <Chip key={g} testID={`genre-${g}`} label={g} selected={draft.genre === g} onPress={() => setDraft((d) => toggleGenre(d, g))} />
              ))
            ) : genres.isError ? (
              <Text variant="secondary" tone="muted">
                Genres didn’t load. You can still filter by budget.
              </Text>
            ) : (
              [72, 96, 80, 64, 104, 88].map((w, i) => <Skeleton key={i} height={size.chip} width={w} round />)
            )}
          </View>
        </Group>
      </ScrollView>
      <Button testID="talent-filters-show" label={showDjsLabel(count.data)} onPress={() => onApply(draft)} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  body: { gap: space.md },
  reset: { minHeight: size.minTarget, minWidth: size.minTarget, alignItems: 'flex-end', justifyContent: 'center' },
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  half: { flexBasis: '45%', flexGrow: 1 },
  locked: {
    minHeight: size.chip,
    paddingHorizontal: space.row,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.label,
  },
});
