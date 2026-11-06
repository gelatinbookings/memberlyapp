import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Rise } from '@/components/motion/Rise';
import { Button, Text } from '@/components/ui';
import { LOGO_RATIO, logo } from '@/features/auth/components/AuthSheet';
import { WelcomeBackdrop } from '@/features/auth/components/WelcomeBackdrop';
import { useLaunchDone } from '@/features/launch/AnimatedSplash';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/**
 * First launch: the looping crowd video behind its scrim, then the
 * wordmark, one line and two ways in, rising in a stagger once the launch
 * splash has gone. The sign-in sheets open over it and it keeps playing.
 */
export default function WelcomeScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const launched = useLaunchDone();
  return (
    <View style={[styles.root, { backgroundColor: c.background }]} testID="welcome">
      <WelcomeBackdrop />
      {launched ? (
        <>
          <Rise index={0} style={[styles.logoWrap, { top: insets.top + space.sm }]}>
            <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Memberly" />
          </Rise>
          <View style={[styles.copy, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
            <Rise index={1}>
              <Text variant="display" accessibilityRole="header" style={styles.headline}>
                Find your people. Never miss the night.
              </Text>
            </Rise>
            <Rise index={2}>
              <Text tone="muted" style={styles.sub}>
                Communities, events and passes in one place, built around what you like.
              </Text>
            </Rise>
            <Rise index={3} style={styles.first}>
              <Button
                label="Create account"
                trailingIcon={<ArrowRight size={18} color={c.onBrand} strokeWidth={2} />}
                onPress={() => router.push('/intro')}
              />
            </Rise>
            <Rise index={4}>
              <Button
                label="I already have an account"
                variant="secondary"
                onPress={() => router.push('/sign-in')}
                style={styles.tall}
              />
            </Rise>
            <Rise index={5}>
              <Text variant="helper" tone="muted" align="center">
                By continuing you agree to the Terms and Privacy Policy.
              </Text>
            </Rise>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  logoWrap: { position: 'absolute', left: space.gutter },
  logo: { height: 36, width: 36 * LOGO_RATIO },
  copy: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: space.gutter, gap: 14 },
  headline: { fontSize: 36, lineHeight: 38, letterSpacing: -1.08 },
  sub: { maxWidth: 300 },
  first: { marginTop: space.stack },
  tall: { height: 52 },
});
