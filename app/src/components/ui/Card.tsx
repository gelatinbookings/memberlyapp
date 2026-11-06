import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

export type CardProps = {
  children: ReactNode;
  /** Selected, added or "yours": purple tint with a purple line. */
  selected?: boolean;
  /** Warning edge for a card that needs action (new offer from the DJ). */
  attention?: boolean;
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** 16px card with a 1px border. Flat: no shadow. Never nest cards. */
export function Card({
  children,
  selected = false,
  attention = false,
  padding = space.card,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: CardProps) {
  const c = useTheme();
  const base = [
    styles.card,
    {
      padding,
      backgroundColor: selected ? c.tint : c.card,
      borderColor: attention ? c.warningText : selected ? c.brandLine : c.border,
    },
    style,
  ];
  if (!onPress) {
    return (
      <View testID={testID} style={base}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed ? { opacity: 0.85 } : null]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.stack,
  },
});
