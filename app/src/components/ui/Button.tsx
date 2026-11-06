import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme';
import { motion, radius, size, space } from '@/theme/tokens';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressed scale: subtle, transform only, and off under Reduce Motion. */
export const PRESSED_SCALE = 0.97;

/** The primary action on a screen or sheet. 6px radius (the Memberly control radius). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  trailingIcon,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const c = useTheme();
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const inactive = disabled || loading;
  const press = (down: boolean) => {
    setPressed(down);
    if (!reduceMotion) scale.set(withTiming(down ? PRESSED_SCALE : 1, { duration: motion.fast }));
  };
  const height = variant === 'secondary' ? size.secondaryButton : size.primaryButton;
  const fill = (pressed: boolean) => {
    if (variant === 'secondary') return pressed ? c.muted : 'transparent';
    if (variant === 'destructive') return c.destructive;
    return pressed ? c.brandPressed : c.brand;
  };
  const labelTone = variant === 'secondary' ? 'default' : 'onBrand';

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={() => press(true)}
      onPressOut={() => press(false)}
      style={[
        styles.base,
        {
          height,
          backgroundColor: fill(pressed && !inactive),
          borderColor: variant === 'secondary' ? c.border : 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
        scaleStyle,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? c.foreground : c.onBrand} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            variant="cardTitle"
            tone={labelTone}
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={styles.label}>
            {label}
          </Text>
          {trailingIcon}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, maxWidth: '100%' },
  label: { flexShrink: 1 },
});
