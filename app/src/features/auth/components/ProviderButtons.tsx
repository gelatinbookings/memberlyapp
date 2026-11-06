import { useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { AuthProviderName } from '@/data/types';
import { LATER } from '@/features/navigation/later';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { useAuth } from '../AuthProvider';
import { AppleMark, GoogleMark } from './ProviderMarks';

function ProviderButton({
  label,
  mark,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  mark: ReactNode;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? c.muted : c.card, borderColor: c.border, opacity: disabled ? 0.5 : 1 },
      ]}>
      {busy ? (
        <ActivityIndicator color={c.foreground} />
      ) : (
        <View style={styles.row}>
          {mark}
          <Text variant="cardTitle">{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Continue with Google everywhere, and Continue with Apple on iPhone. In this
 * build both sign in the sample member directly; M8 runs the native sheets.
 */
export function ProviderButtons({ disabled = false }: { disabled?: boolean }) {
  const c = useTheme();
  const auth = useAuth();
  const [busy, setBusy] = useState<AuthProviderName | null>(null);

  const run = async (provider: AuthProviderName) => {
    setBusy(provider);
    try {
      await auth.signInWithProvider(provider);
    } catch {
      Alert.alert('Couldn’t sign you in', 'Try again, or use a code sent to your email.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.stack}>
      <ProviderButton
        label="Continue with Google"
        mark={<GoogleMark />}
        busy={busy === 'google'}
        disabled={disabled || busy !== null}
        onPress={() => run('google')}
      />
      {Platform.OS === 'ios' ? (
        <ProviderButton
          label="Continue with Apple"
          mark={<AppleMark color={c.foreground} />}
          busy={busy === 'apple'}
          disabled={disabled || busy !== null}
          onPress={() => run('apple')}
        />
      ) : null}
    </View>
  );
}

/** A muted line with one brand-coloured action; the whole 44pt row is the target. */
export function LinkLine({ lead, action, onPress }: { lead: string; action: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${lead} ${action}`} onPress={onPress} style={styles.linkLine}>
      <Text variant="secondary" tone="muted" align="center">
        {lead}{' '}
        <Text variant="secondaryStrong" tone="brand">
          {action}
        </Text>
      </Text>
    </Pressable>
  );
}

/** Terms of Use and Privacy Policy open the web pages until they are native. */
export function LegalLine() {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Terms of Use and Privacy Policy"
      onPress={() =>
        router.push({
          pathname: '/later',
          params: { title: 'Terms and privacy', milestone: LATER.web.milestone, note: LATER.web.note },
        })
      }
      style={styles.linkLine}>
      <Text variant="helper" tone="muted" align="center">
        By continuing, you agree to our{' '}
        <Text variant="helper" tone="brand">
          Terms of Use
        </Text>{' '}
        and{' '}
        <Text variant="helper" tone="brand">
          Privacy Policy
        </Text>
        .
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.stack },
  button: {
    height: size.primaryButton,
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.stack },
  linkLine: { minHeight: size.minTarget, justifyContent: 'center' },
});
