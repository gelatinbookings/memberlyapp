import { StyleSheet, View } from 'react-native';

import { formatCents } from '@/features/booking/money';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { Card } from './Card';
import { Text } from './Text';

export type MoneyLine = { label: string; cents: number };

export type MoneySummaryProps = {
  /** Lines exactly as the server itemises them (fee, Gelatin service fee). */
  lines: MoneyLine[];
  /** The server's total. Shown as given; this component never adds lines up. */
  total: MoneyLine;
  /** Says what happens to the total: held, charged or released. */
  footnote?: string;
};

export function MoneySummary({ lines, total, footnote }: MoneySummaryProps) {
  const c = useTheme();
  return (
    <Card>
      {lines.map((line) => (
        <View key={line.label} style={styles.row}>
          <Text tone="muted">{line.label}</Text>
          <Text style={styles.tabular}>{formatCents(line.cents)}</Text>
        </View>
      ))}
      <View style={[styles.rule, { backgroundColor: c.border }]} />
      <View style={[styles.row, styles.totalRow]}>
        <Text variant="bodyStrong">{total.label}</Text>
        <Text variant="money" testID="money-total">
          {formatCents(total.cents)}
        </Text>
      </View>
      {footnote ? (
        <Text variant="helper" tone="muted">
          {footnote}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  totalRow: { alignItems: 'baseline' },
  rule: { height: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
});
