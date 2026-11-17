import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import type { Recurrence, RecurrenceFrequency } from '@/data/types';
import type { IsoDate } from '@/lib/dates';
import { space } from '@/theme/tokens';

import { COUNT_PICKS, countLabel, FREQUENCIES, frequencyShort, NO_REPEAT, recurrenceLabel, upcomingLine } from './recurrence';

/** The default length of a new series. */
const DEFAULT_COUNT = 8;

function ChipRow({ children, testID }: { children: React.ReactNode; testID: string }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Chips run edge to edge; the row keeps the screen's gutter at both ends.
      style={styles.bleed}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
      testID={testID}>
      {children}
    </ScrollView>
  );
}

/**
 * Repeats, inline: once, weekly, every 2 weeks or monthly (same weekday, e.g.
 * the third Friday) as a row of chips; once it repeats, a second row picks
 * how many dates. The line under them words the choice from the event's date
 * and shows the next few dates.
 */
export function RepeatChips({
  date,
  value,
  onChange,
}: {
  date: IsoDate | null;
  value: Recurrence | null;
  onChange: (recurrence: Recurrence | null) => void;
}) {
  const pick = (frequency: RecurrenceFrequency | null) =>
    onChange(frequency ? { frequency, count: value?.count === undefined ? DEFAULT_COUNT : value.count } : null);
  return (
    <View style={styles.wrap}>
      <Text variant="secondaryStrong">Repeats</Text>
      <ChipRow testID="repeat-frequency">
        <Chip testID="repeat-none" label={NO_REPEAT} selected={!value} onPress={() => pick(null)} />
        {FREQUENCIES.map((f) => (
          <Chip key={f} testID={`repeat-${f}`} label={frequencyShort(f)} selected={value?.frequency === f} onPress={() => pick(f)} />
        ))}
      </ChipRow>
      {value ? (
        <ChipRow testID="repeat-count">
          {COUNT_PICKS.map((n) => (
            <Chip key={String(n)} testID={`repeat-count-${n ?? 'none'}`} label={countLabel(n)} selected={value.count === n} onPress={() => onChange({ ...value, count: n })} />
          ))}
        </ChipRow>
      ) : null}
      {value ? (
        <Text variant="helper" tone="muted" testID="repeat-summary">
          {date ? `${recurrenceLabel(value, date)}. ${upcomingLine(date, value)}` : 'Pick a date to see which dates it repeats on.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  bleed: { marginHorizontal: -space.gutter },
  row: { gap: space.sm, paddingHorizontal: space.gutter },
});
