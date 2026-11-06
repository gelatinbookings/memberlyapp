import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, size } from '@/theme/tokens';

import { Text } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Filter and choice chip. Round, 44px. Selected: tint, purple line, purple text. */
export function Chip({ label, selected = false, onPress, icon, trailingIcon, style, testID }: ChipProps) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? c.tint : pressed ? c.muted : 'transparent',
          borderColor: selected ? c.brandLine : c.border,
        },
        style,
      ]}>
      <View style={styles.row}>
        {icon}
        <Text variant="secondaryStrong" tone={selected ? 'brand' : 'default'}>
          {label}
        </Text>
        {trailingIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.chip,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
