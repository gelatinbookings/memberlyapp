import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

import { WelcomePoster } from '@/features/auth/components/WelcomeBackdrop';
import { useTheme } from '@/theme/theme';
import { motion, radius } from '@/theme/tokens';

const logo = require('@/assets/images/logo-memberly.png');
/** Same width as the native splash image (app.json → expo-splash-screen → imageWidth). */
const LOGO_WIDTH = 180;
const LOGO_HEIGHT = LOGO_WIDTH * (210 / 740);
const DISC = 140;

/** Timings, in ms. The whole launch stays under about 1.6s. */
export const SPLASH_TIMING = { pulse: 650, exit: 300, reducedExit: 150 } as const;

const LaunchContext = createContext(true);

/** False while the launch animation covers the first screen. Welcome waits for it before its stagger. */
export function useLaunchDone(): boolean {
  return useContext(LaunchContext);
}

export const LaunchProvider = LaunchContext.Provider;

/**
 * The JS half of the launch. It first draws exactly what the native splash
 * shows (black, the wordmark at the same size), so hiding the native splash
 * is seamless; then a purple disc pulses out behind the mark and the whole
 * layer cross-fades into the first screen. With Reduce Motion it only fades.
 * It never waits on itself: once `ready` and the pulse are done, it leaves.
 */
export function AnimatedSplash({
  ready,
  known = true,
  backdrop = false,
  onShown,
  onDone,
}: {
  /** The first screen is placed (fonts, session, gate). */
  ready: boolean;
  /** The session has been read, so the backdrop is decided: the pulse starts then, over the right background. */
  known?: boolean;
  /** Fade the Welcome poster in behind the mark (signed out), so the hand-off to Welcome's video is seamless. */
  backdrop?: boolean;
  /** First frame is on screen: hide the native splash now. */
  onShown: () => void;
  onDone: () => void;
}) {
  const c = useTheme();
  const reduceMotion = useReducedMotion();
  const [pulsed, setPulsed] = useState(reduceMotion);
  const shownOnce = useRef(false);

  const disc = useSharedValue(0);
  const mark = useSharedValue(1);
  const layer = useSharedValue(1);

  // The pulse: the disc grows from nothing behind the mark and fades as it goes; the mark breathes once.
  useEffect(() => {
    if (reduceMotion || !known) return;
    disc.set(withTiming(1, { duration: SPLASH_TIMING.pulse, easing: Easing.out(Easing.cubic) }));
    mark.set(
      withSequence(
        withTiming(1.06, { duration: SPLASH_TIMING.pulse / 2, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: SPLASH_TIMING.pulse / 2, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    const t = setTimeout(() => setPulsed(true), SPLASH_TIMING.pulse);
    return () => clearTimeout(t);
  }, [reduceMotion, known, disc, mark]);

  // Leave as soon as both the pulse and the first screen are ready.
  useEffect(() => {
    if (!ready || !pulsed) return;
    const exit = reduceMotion ? SPLASH_TIMING.reducedExit : SPLASH_TIMING.exit;
    layer.set(withTiming(0, { duration: exit }));
    if (!reduceMotion) mark.set(withTiming(1.12, { duration: exit, easing: Easing.in(Easing.quad) }));
    const t = setTimeout(onDone, exit);
    return () => clearTimeout(t);
  }, [ready, pulsed, reduceMotion, layer, mark, onDone]);

  const poster = useSharedValue(0);
  useEffect(() => {
    if (backdrop) poster.set(reduceMotion ? 1 : withTiming(1, { duration: motion.slow }));
  }, [backdrop, reduceMotion, poster]);
  const posterStyle = useAnimatedStyle(() => ({ opacity: poster.value }));

  const layerStyle = useAnimatedStyle(() => ({ opacity: layer.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: mark.value }] }));
  const discStyle = useAnimatedStyle(() => ({
    opacity: 1 - disc.value,
    transform: [{ scale: 0.2 + disc.value * 2.4 }],
  }));

  return (
    <Animated.View
      testID="animated-splash"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={() => {
        if (shownOnce.current) return;
        shownOnce.current = true;
        onShown();
      }}
      style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.background }, layerStyle]}>
      {backdrop ? (
        <Animated.View style={[StyleSheet.absoluteFill, posterStyle]}>
          <WelcomePoster />
        </Animated.View>
      ) : null}
      {reduceMotion ? null : <Animated.View style={[styles.disc, { backgroundColor: c.brand }, discStyle]} />}
      <Animated.View style={markStyle}>
        <Image source={logo} style={styles.logo} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  disc: { position: 'absolute', width: DISC, height: DISC, borderRadius: radius.pill },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
});
