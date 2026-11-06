import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton, Text } from '@/components/ui';
import { formatIsoDate, formatMonth, monthGrid, toIsoDate, type IsoDate } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { font, radius, size, space } from '@/theme/tokens';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Month grid for picking the night. The selected day is brand; days before today are off. */
export function MonthCalendar({
  selected,
  today,
  onSelect,
}: {
  selected: IsoDate | null;
  /** Today at the venue, "2026-11-18". */
  today: IsoDate;
  onSelect: (date: IsoDate) => void;
}) {
  const c = useTheme();
  const start = (selected ?? today).split('-').map(Number);
  const [view, setView] = useState({ year: start[0], month: start[1] });
  const step = (delta: number) =>
    setView(({ year, month }) => {
      const m = month + delta;
      return m < 1 ? { year: year - 1, month: 12 } : m > 12 ? { year: year + 1, month: 1 } : { year, month: m };
    });
  const [ty, tm] = today.split('-').map(Number);
  const atFirstMonth = view.year === ty && view.month === tm;

  return (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.card }]}>
      <View style={styles.head}>
        <Text variant="bodyStrong" style={styles.month} accessibilityRole="header">
          {formatMonth(view.year, view.month)}
        </Text>
        <View style={styles.arrows}>
          <IconButton
            size={36}
            accessibilityLabel="Previous month"
            icon={<ChevronLeft size={16} color={atFirstMonth ? c.border : c.foreground} strokeWidth={2} />}
            onPress={atFirstMonth ? undefined : () => step(-1)}
          />
          <IconButton
            size={36}
            accessibilityLabel="Next month"
            icon={<ChevronRight size={16} color={c.foreground} strokeWidth={2} />}
            onPress={() => step(1)}
          />
        </View>
      </View>
      <View style={styles.week} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {WEEKDAY_INITIALS.map((d, i) => (
          <Text key={i} variant="helper" tone="muted" align="center" style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      {monthGrid(view.year, view.month).map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((day, i) => {
            if (day == null) return <View key={i} style={styles.cell} />;
            const iso = toIsoDate(view.year, view.month, day);
            const isSelected = iso === selected;
            const past = iso < today;
            return (
              <Pressable
                key={i}
                testID={`day-${iso}`}
                accessibilityRole="button"
                accessibilityLabel={formatIsoDate(iso)}
                accessibilityState={{ selected: isSelected, disabled: past }}
                disabled={past}
                onPress={() => onSelect(iso)}
                style={({ pressed }) => [
                  styles.cell,
                  styles.day,
                  { backgroundColor: isSelected ? c.brand : pressed ? c.muted : 'transparent' },
                ]}>
                <Text
                  variant="body"
                  style={{
                    fontFamily: isSelected ? font.bold : font.medium,
                    color: isSelected ? c.onBrand : past ? c.border : c.foreground,
                  }}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.card, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  month: { fontFamily: font.semibold },
  arrows: { flexDirection: 'row', gap: space.sm },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, fontFamily: font.semibold },
  cell: { flex: 1, height: size.minTarget },
  day: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
