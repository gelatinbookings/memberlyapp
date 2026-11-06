import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, size as sizes } from '@/theme/tokens';

export type IconButtonProps = {
  icon: ReactNode;
  /** Required: icon-only buttons need a spoken name. */
  accessibilityLabel: string;
  onPress?: () => void;
  /** Visual diameter, 36–48. The hit area is always at least 44. */
  size?: number;
  variant?: 'outline' | 'card' | 'scrim' | 'plain';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 44,
  variant = 'outline',
  style,
  testID,
}: IconButtonProps) {
  const c = useTheme();
  const slop = Math.max(0, Math.ceil((sizes.minTarget - size) / 2));
  const bg =
    variant === 'card' ? c.card : variant === 'scrim' ? c.scrim : 'transparent';
  const border = variant === 'outline' || variant === 'card' ? c.border : 'transparent';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={slop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, backgroundColor: pressed ? c.muted : bg, borderColor: border },
        style,
      ]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
