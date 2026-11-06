import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { LOGO_RATIO, logo } from '@/features/auth/components/AuthSheet';
import { useTheme } from '@/theme/theme';
import { motion, radius, size, space } from '@/theme/tokens';

type Slide = {
  title: string;
  body: string;
  photo: number;
  card: { title: string; detail: string; thumb: number };
  note: string;
};

/** One idea per slide: communities, passes on your card, booking talent. */
export const INTRO_SLIDES: Slide[] = [
  {
    title: 'Find your people',
    body: 'Join the communities behind the nights you love, from supper clubs to warehouse parties.',
    photo: require('@/assets/images/cover-warehouse.jpg'),
    card: { title: 'Second Sundays', detail: 'Atlanta · 1,204 members', thumb: require('@/assets/images/cover-crowd.jpg') },
    note: 'You’re in',
  },
  {
    title: 'Join once, show up anywhere',
    body: 'One Memberly Card gets you into every community you join. Passes land on it the moment you buy.',
    photo: require('@/assets/images/cover-dinner.jpg'),
    card: { title: 'Long Table · Sun 22', detail: 'Supper Club ATL · 6 seats left', thumb: require('@/assets/images/cover-rooftop.jpg') },
    note: 'Your pass is in your card',
  },
  {
    title: 'Running the night? Book the talent',
    body: 'Organizers book DJs open on their date right inside Create New Event, and pay only if the DJ accepts.',
    photo: require('@/assets/images/dj-koyo.jpg'),
    card: { title: 'KOYO', detail: 'House · Afrobeats · Midnight to 2', thumb: require('@/assets/images/dj-koyo.jpg') },
    note: 'On your lineup',
  },
];

function toCreateAccount() {
  router.replace('/create-account');
}

/** Three slides, Skip on each. Skip and the last Next go to Create account. */
export default function IntroScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = INTRO_SLIDES[index];
  const last = index === INTRO_SLIDES.length - 1;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: c.background, paddingTop: insets.top + space.sm, paddingBottom: Math.max(insets.bottom, space.md) },
      ]}>
      <View style={styles.top}>
        <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Memberly" />
        <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={toCreateAccount} hitSlop={8} style={styles.textButton}>
          <Text variant="secondaryStrong" tone="muted">
            Skip
          </Text>
        </Pressable>
      </View>

      <Animated.View key={index} entering={FadeIn.duration(motion.base)} style={styles.photoWrap}>
        <Image source={slide.photo} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
        <View style={styles.overlay}>
          <View style={[styles.overlayCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Image source={slide.card.thumb} style={styles.thumb} contentFit="cover" />
            <View style={styles.flex}>
              <Text variant="secondaryStrong" numberOfLines={1}>
                {slide.card.title}
              </Text>
              <Text variant="helper" tone="muted" numberOfLines={1}>
                {slide.card.detail}
              </Text>
            </View>
          </View>
          <View style={[styles.note, { backgroundColor: c.brandLine, borderColor: c.brandLine }]}>
            <Text variant="secondaryStrong" tone="onBrand">
              {slide.note}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.dots} accessible accessibilityLabel={`Slide ${index + 1} of ${INTRO_SLIDES.length}`}>
        {INTRO_SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.dot, { width: i === index ? 48 : 24, backgroundColor: i === index ? c.brand : c.muted }]} />
        ))}
      </View>

      <View style={styles.copy}>
        <Text variant="display" accessibilityRole="header" style={styles.title}>
          {slide.title}
        </Text>
        <Text tone="muted">{slide.body}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (index === 0 ? router.back() : setIndex(index - 1))}
          hitSlop={8}
          style={styles.textButton}>
          <Text variant="bodyStrong" tone="muted">
            Back
          </Text>
        </Pressable>
        <Button
          label={last ? 'Create account' : 'Next'}
          trailingIcon={<ArrowRight size={18} color={c.onBrand} strokeWidth={2} />}
          onPress={() => (last ? toCreateAccount() : setIndex(index + 1))}
          style={styles.next}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.gutter, gap: space.gutter },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { height: 30, width: 30 * LOGO_RATIO },
  textButton: { minHeight: size.minTarget, justifyContent: 'center' },
  photoWrap: { flex: 1, borderRadius: radius.card, overflow: 'hidden' },
  overlay: { position: 'absolute', left: space.md, bottom: space.md, gap: space.label },
  overlayCard: {
    width: 250,
    borderRadius: radius.notice,
    borderWidth: 1,
    paddingVertical: space.stack,
    paddingHorizontal: space.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.stack,
  },
  thumb: { width: 32, height: 32, borderRadius: radius.pill },
  flex: { flex: 1, minWidth: 0 },
  note: { alignSelf: 'flex-start', borderRadius: radius.notice, borderWidth: 1, paddingVertical: space.stack, paddingHorizontal: space.row },
  dots: { flexDirection: 'row', gap: space.label },
  dot: { height: 4, borderRadius: radius.pill },
  copy: { gap: space.sm },
  title: { fontSize: 30, lineHeight: 33 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  next: { paddingHorizontal: 24 },
});
