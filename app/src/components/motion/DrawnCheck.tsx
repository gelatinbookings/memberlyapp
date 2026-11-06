import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { radius } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LENGTH = 24;
export const CHECK_DRAW_MS = 360;

/** A brand disc whose check mark draws itself in. Drawn at once under Reduce Motion. */
export function DrawnCheck({ size = 56, label = 'Verified' }: { size?: number; label?: string }) {
  const c = useTheme();
  const reduceMotion = useReducedMotion();
  const drawn = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) drawn.set(withTiming(1, { duration: CHECK_DRAW_MS, easing: Easing.out(Easing.cubic) }));
  }, [reduceMotion, drawn]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: LENGTH * (1 - drawn.value) }));

  return (
    <Animated.View
      entering={reduceMotion ? undefined : ZoomIn.duration(200)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="drawn-check"
      style={[styles.disc, { width: size, height: size, backgroundColor: c.brand }]}>
      <View>
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
          <AnimatedPath
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke={c.onBrand}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={LENGTH}
            animatedProps={props}
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disc: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
