import { useEffect, useState } from 'react';
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/theme';
import { motion } from '@/theme/tokens';

export const welcomeVideo = require('@/assets/video/welcome-crowd.mp4');
export const welcomePoster = require('@/assets/images/welcome-crowd-poster.jpg');

/** Screens that sit over the Welcome video: it keeps playing behind their dimmed backdrop. */
const PLAYS_ON = new Set(['/welcome', '/sign-in', '/create-account']);

/**
 * The whole video sits under one flat layer (night, and the wordmark reads).
 * The lower part, where the copy and buttons sit, darkens further through a
 * black-only fade: a legibility scrim over media, the one place DESIGN.md
 * allows a fade, so there is no visible edge across the crowd.
 */
export function WelcomeScrim() {
  const c = useTheme();
  const { height } = useWindowDimensions();
  return (
    <>
      <View pointerEvents="none" style={[styles.band, { top: 0, backgroundColor: c.scrim }]} />
      <Svg pointerEvents="none" style={[styles.band, { top: height * 0.38 }]} width="100%" height={height * 0.62}>
        <Defs>
          <LinearGradient id="welcome-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.background} stopOpacity={0} />
            <Stop offset="0.45" stopColor={c.background} stopOpacity={0.55} />
            <Stop offset="1" stopColor={c.background} stopOpacity={0.7} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#welcome-fade)" />
      </Svg>
    </>
  );
}

/** The poster still under the scrim. The launch splash shows this while the logo plays. */
export function WelcomePoster() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="welcome-poster">
      <Image source={welcomePoster} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
      <WelcomeScrim />
    </View>
  );
}

/**
 * The Welcome background: the poster, then the looping crowd video faded in
 * over it once its first frame is ready, so it never flashes black. Muted and
 * mixed with other audio, so the member's music keeps playing. Under Reduce
 * Motion there is no player source and the poster stays still. Plays only
 * while Welcome or its sign-in sheets are on top and the app is active; the
 * player is released when Welcome unmounts (after sign-in).
 */
export function WelcomeBackdrop() {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const player = useVideoPlayer(reduceMotion ? null : welcomeVideo, (p) => {
    p.loop = true;
    p.muted = true;
    p.audioMixingMode = 'mixWithOthers';
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const fade = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const shouldPlay = !reduceMotion && active && PLAYS_ON.has(pathname);
  useEffect(() => {
    if (reduceMotion) return;
    if (shouldPlay) player.play();
    else player.pause();
  }, [shouldPlay, player, reduceMotion]);

  // Cross-fade in only when the player is ready and a frame is on screen: never a black flash.
  const [framed, setFramed] = useState(false);
  const visible = framed && status === 'readyToPlay';
  useEffect(() => {
    if (visible) fade.set(withTiming(1, { duration: motion.slow }));
  }, [visible, fade]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={welcomePoster} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors testID="welcome-poster" />
      {reduceMotion ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
          <VideoView
            testID="welcome-video"
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
            onFirstFrameRender={() => setFramed(true)}
          />
        </Animated.View>
      )}
      <WelcomeScrim />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
