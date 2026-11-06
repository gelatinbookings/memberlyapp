import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetHandle, Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { motion, radius, space } from '@/theme/tokens';

/** The still welcome photo, kept as a fallback asset; Welcome now plays the crowd video. */
export const welcomePhoto = require('@/assets/images/cover-crowd.jpg');
export const logo = require('@/assets/images/logo-memberly.png');
/** The wordmark's aspect ratio (740 × 210). */
export const LOGO_RATIO = 740 / 210;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/welcome');
}

/**
 * Sign in and Create account rise as a sheet over Welcome (a transparent
 * modal, so its video keeps playing), which drops to 35%. Tapping the dimmed
 * background closes the sheet.
 */
export function AuthSheet({
  title,
  subtitle,
  children,
  testID,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  testID?: string;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // Springs up over the dimmed photo; under Reduce Motion it fades in instead.
  const entering = reduceMotion ? FadeIn.duration(motion.fast) : SlideInDown.springify().damping(22).stiffness(190).mass(0.9);
  return (
    <View style={styles.root} testID={testID}>
      <Animated.View entering={FadeIn.duration(motion.base)} style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid} pointerEvents="box-none">
        <Animated.View
          entering={entering}
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { backgroundColor: c.background, borderColor: c.border, maxHeight: '92%', paddingBottom: Math.max(insets.bottom, space.md) },
          ]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.content}>
            <SheetHandle />
            <Image source={logo} style={styles.sheetLogo} contentFit="contain" accessibilityElementsHidden />
            <View style={styles.head}>
              <Text variant="display" accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text tone="muted">{subtitle}</Text>
            </View>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** "or" between the email path and the providers. */
export function OrRule() {
  const c = useTheme();
  return (
    <View style={styles.or} accessibilityElementsHidden importantForAccessibility="no">
      <View style={[styles.rule, { backgroundColor: c.border }]} />
      <Text variant="helper" tone="muted">
        or
      </Text>
      <View style={[styles.rule, { backgroundColor: c.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  avoid: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  content: { paddingTop: 10, paddingHorizontal: space.gutter, gap: space.md },
  sheetLogo: { height: 34, width: 34 * LOGO_RATIO, marginTop: 2 },
  head: { gap: space.xs },
  title: { fontSize: 24, lineHeight: 28 },
  or: { flexDirection: 'row', alignItems: 'center', gap: space.stack },
  rule: { flex: 1, height: 1 },
});
