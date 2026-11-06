import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { DrawnCheck } from '@/components/motion/DrawnCheck';

import { Button, IconButton, Notice, Screen, Text } from '@/components/ui';
import type { CodeIntent } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { font, radius, size, space } from '@/theme/tokens';

import { useAuth } from './AuthProvider';
import { useCountdown } from './countdown';

export const CODE_LENGTH = 4;
export const WRONG_CODE = 'That code doesn’t match. Check the latest email or resend.';
export const EXPIRED_CODE = 'That code expired. We sent a new one.';

type Problem = 'wrong' | 'expired' | 'failed' | null;

/** How long the check shows before the app moves on. */
export const SUCCESS_HOLD_MS = { full: 650, reduced: 250 } as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Verification code: four boxes filled from the number pad, the next box
 * takes focus, Resend counts down and then becomes a link. One-time-code
 * autofill comes from the hidden field's content type.
 */
export function VerifyCodeView({ email, intent, resendAfter }: { email: string; intent: CodeIntent; resendAfter: number }) {
  const c = useTheme();
  const auth = useAuth();
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<Problem>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const countdown = useCountdown(resendAfter);
  const reduceMotion = useReducedMotion();
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const shake = () => {
    if (reduceMotion) return;
    const d = 45;
    shakeX.set(
      withSequence(
        withTiming(-10, { duration: d }),
        withTiming(10, { duration: d }),
        withTiming(-7, { duration: d }),
        withTiming(7, { duration: d }),
        withTiming(0, { duration: d }),
      ),
    );
  };

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || verifying) return;
    setVerifying(true);
    try {
      const result = await auth.verifyCode(email, value, {
        // Show the check drawing in, then let the gate move on.
        beforeSignIn: async () => {
          setVerified(true);
          await wait(reduceMotion ? SUCCESS_HOLD_MS.reduced : SUCCESS_HOLD_MS.full);
        },
      });
      if (result.ok) return; // The gate takes it from here: preferences for a new member, Home otherwise.
      if (result.reason === 'expired') {
        setCode('');
        countdown.restart(result.resendAfterSeconds);
      }
      if (result.reason === 'wrong') shake();
      setProblem(result.reason);
    } catch {
      setProblem('failed');
    } finally {
      setVerifying(false);
    }
  };

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (problem && digits.length < CODE_LENGTH) setProblem(problem === 'expired' ? 'expired' : null);
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  const resend = async () => {
    setProblem(null);
    setCode('');
    try {
      const { resendAfterSeconds } = await auth.sendCode({ email, intent });
      countdown.restart(resendAfterSeconds);
    } catch {
      setProblem('failed');
    }
    input.current?.focus();
  };

  const wrong = problem === 'wrong';
  const message = wrong
    ? WRONG_CODE
    : problem === 'expired'
      ? EXPIRED_CODE
      : problem === 'failed'
        ? 'We couldn’t check that code. Try again.'
        : null;

  return (
    <Screen
      footer={
        <Button
          label="Verify"
          disabled={code.length !== CODE_LENGTH || verified}
          loading={verifying && !verified}
          trailingIcon={<ArrowRight size={18} color={c.onBrand} strokeWidth={2} />}
          onPress={() => verify(code)}
        />
      }>
      <IconButton
        accessibilityLabel="Back"
        icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
      />
      <View style={styles.head}>
        <Text variant="display" accessibilityRole="header">
          Enter the code we sent
        </Text>
        <Text tone="muted">
          A 4-digit code went to <Text variant="bodyStrong">{email}</Text>.
        </Text>
      </View>

      {verified ? (
        <View style={styles.success}>
          <DrawnCheck label="Code verified" />
          <Text variant="bodyStrong">You’re in</Text>
        </View>
      ) : null}

      <Animated.View style={[shakeStyle, verified ? styles.hiddenRow : null]}>
        <Pressable
          accessibilityRole="none"
          accessibilityLabel="Verification code"
          onPress={() => input.current?.focus()}
          style={styles.boxes}
          testID="code-boxes">
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const digit = code[i];
            const active = !wrong && i === Math.min(code.length, CODE_LENGTH - 1) && code.length < CODE_LENGTH;
            const borderColor = wrong ? c.errorText : digit ? c.brandLine : active ? c.brand : c.border;
            const backgroundColor = wrong ? c.errorBg : digit ? c.tint : c.card;
            return (
              <View key={i} testID={`code-box-${i}`} style={[styles.box, { borderColor, backgroundColor }]}>
                {digit ? (
                  // Each digit pops in as it is typed.
                  <Animated.View
                    key={`${i}-${digit}`}
                    entering={reduceMotion ? undefined : ZoomIn.springify().damping(14).stiffness(260)}>
                    <Text style={[styles.digit, { color: wrong ? c.errorText : c.foreground }]}>{digit}</Text>
                  </Animated.View>
                ) : active ? (
                  <View style={[styles.caret, { backgroundColor: c.brand }]} />
                ) : null}
              </View>
            );
          })}
        </Pressable>
      </Animated.View>
      <TextInput
        ref={input}
        testID="code-input"
        value={code}
        onChangeText={onChange}
        autoFocus
        keyboardType="number-pad"
        keyboardAppearance="dark"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        caretHidden
        accessibilityLabel="Verification code"
        style={styles.hidden}
      />

      {message ? <Notice tone={wrong || problem === 'failed' ? 'error' : 'muted'}>{message}</Notice> : null}

      <View style={styles.resend}>
        <Text variant="secondary" tone="muted">
          Didn’t get it?
        </Text>
        {countdown.done ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Resend code" onPress={resend} hitSlop={8} style={styles.link}>
            <Text variant="secondaryStrong" tone="brand">
              Resend code
            </Text>
          </Pressable>
        ) : (
          <View style={styles.link} accessible accessibilityLabel={`Resend in ${countdown.label}`}>
            <Text variant="secondaryStrong" tone="brand" style={styles.waiting}>
              Resend in {countdown.label}
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space.sm },
  boxes: { flexDirection: 'row', gap: space.stack },
  box: { flex: 1, height: 64, borderRadius: radius.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  digit: { fontFamily: font.extrabold, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
  caret: { width: 2, height: 28 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  hiddenRow: { display: 'none' },
  success: { alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
  resend: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  link: { minHeight: size.minTarget, justifyContent: 'center' },
  waiting: { opacity: 0.7, fontVariant: ['tabular-nums'] },
});
