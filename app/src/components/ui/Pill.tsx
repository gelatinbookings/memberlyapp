import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { StatusTone } from '@/features/booking/status';
import { useTheme } from '@/theme/theme';
import { radius, type Palette } from '@/theme/tokens';

import { Text } from './Text';

function toneColors(tone: PillTone, c: Palette): { bg: string; fg: string } {
  switch (tone) {
    case 'warning':
      return { bg: c.warningBg, fg: c.warningText };
    case 'held':
      return { bg: c.tint, fg: c.brandText };
    case 'success':
      return { bg: c.successBg, fg: c.successText };
    case 'brand':
      return { bg: c.brand, fg: c.onBrand };
    default:
      return { bg: c.muted, fg: c.mutedText };
  }
}

/** `brand` is the filled purple "New" pill. */
export type PillTone = StatusTone | 'brand';

export function Pill({ label, tone, style }: { label: string; tone: PillTone; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  const { bg, fg } = toneColors(tone, c);
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]} accessible accessibilityLabel={label}>
      <Text variant="label" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** The member's own pass on an event row. */
export function PassPill() {
  return <Pill label="Pass" tone="success" />;
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
});
