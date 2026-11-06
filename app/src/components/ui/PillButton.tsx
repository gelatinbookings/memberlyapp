import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, size } from '@/theme/tokens';

import { Text } from './Text';

export type PillButtonProps = {
  label: string;
  onPress?: () => void;
  /** Filled marks the one action on a highlighted card (Manage, Added). */
  filled?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A light action inside a row or card (Add, Offer, Show card). Round, 44px. */
export function PillButton({ label, onPress, filled = false, icon, disabled, style, testID }: PillButtonProps) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: filled ? (pressed ? c.brandPressed : c.brand) : pressed ? c.muted : 'transparent',
          borderColor: filled ? c.brand : c.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      <View style={styles.row}>
        {icon}
        <Text variant="secondaryStrong" tone={filled ? 'onBrand' : 'default'}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.chip,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
