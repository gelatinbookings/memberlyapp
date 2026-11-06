import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

/** Gap between items in a stagger. */
export const STAGGER_MS = 90;

/**
 * Rises into place with a fade, `index` steps after the first. Opacity and
 * transform only. Under Reduce Motion it simply appears.
 */
export function Rise({
  index = 0,
  delay = 0,
  children,
  style,
}: {
  index?: number;
  delay?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const entering = reduceMotion ? undefined : FadeInDown.delay(delay + index * STAGGER_MS).duration(420).withInitialValues({ transform: [{ translateY: 16 }] });
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
