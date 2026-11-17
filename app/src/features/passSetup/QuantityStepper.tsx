import { Minus, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { IconButton, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { sanitizeCount } from './passForm';

/** The most a count can be: five digits, as `sanitizeCount` allows. */
const MAX = 99999;

/**
 * A count with minus and plus on either side (Quantity for an event pass,
 * Member limit for a tier). The number can also be typed. Empty is no limit:
 * minus from 1 clears it, plus from empty starts at 1.
 */
export function QuantityStepper({
  label,
  value,
  onChange,
  helper = 'Optional. Leave it empty for no limit.',
  testID,
}: {
  label: string;
  /** As typed: digits, or empty for no limit. */
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  testID?: string;
}) {
  const c = useTheme();
  const n = value === '' ? null : Number(value);
  const down = () => {
    if (n == null) return;
    onChange(n <= 1 ? '' : String(n - 1));
  };
  const up = () => onChange(String(Math.min(MAX, (n ?? 0) + 1)));
  return (
    <View style={styles.wrap}>
      <Text variant="secondaryStrong">{label}</Text>
      <View style={styles.row}>
        <IconButton
          testID={testID ? `${testID}-minus` : undefined}
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          icon={<Minus size={18} color={n == null ? c.mutedText : c.foreground} strokeWidth={2} />}
          onPress={down}
          style={n == null ? styles.off : undefined}
        />
        <TextField
          testID={testID}
          label={label}
          hideLabel
          value={value}
          placeholder="No limit"
          keyboardType="number-pad"
          onChangeText={(text) => onChange(sanitizeCount(text))}
          style={styles.flex}
        />
        <IconButton
          testID={testID ? `${testID}-plus` : undefined}
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          icon={<Plus size={18} color={c.foreground} strokeWidth={2} />}
          onPress={up}
        />
      </View>
      <Text variant="helper" tone="muted">
        {helper}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.label },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  off: { opacity: 0.4 },
});
