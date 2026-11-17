import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme';
import { motion, radius } from '@/theme/tokens';

import { PRESSED_SCALE } from './Button';

/** The floating action button's diameter. */
export const FAB_SIZE = 56;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The floating action button (DESIGN.md): a round 56px brand button with a
 * white plus. One per screen at most; today it is on Home only and opens the
 * Create sheet. Flat like everything else: no shadow. Pressing darkens it and
 * eases it to 0.97; under Reduce Motion it only darkens.
 */
export function Fab({
  onPress,
  accessibilityLabel = 'Create',
  style,
  testID,
}: {
  onPress: () => void;
  /** Spoken name. "Create" for the Home button. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const c = useTheme();
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const press = (down: boolean) => {
    setPressed(down);
    if (!reduceMotion) scale.set(withTiming(down ? PRESSED_SCALE : 1, { duration: motion.fast }));
  };
  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => press(true)}
      onPressOut={() => press(false)}
      style={[styles.fab, { backgroundColor: pressed ? c.brandPressed : c.brand }, style, scaleStyle]}>
      <Plus size={24} color={c.onBrand} strokeWidth={2} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: { width: FAB_SIZE, height: FAB_SIZE, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
