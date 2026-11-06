import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme';
import { font, motion, radius, size, space } from '@/theme/tokens';

import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Hide the label visually but keep it as the field's spoken name. */
  hideLabel?: boolean;
  helper?: string;
  /** Warning outline and helper, e.g. a missing fee. */
  warning?: string | null;
  /** A muted prefix inside the field: "$" for money. */
  prefix?: string;
  /** Money fields: 16px/700 tabular. */
  money?: boolean;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
};

/** 48px field, 6px radius, 1px border, label 6px above, helper below. Focus shows the ring. */
export function TextField({
  label,
  hideLabel = false,
  helper,
  warning,
  prefix,
  money = false,
  multiline = false,
  style,
  inputStyle,
  ...input
}: TextFieldProps) {
  const c = useTheme();
  const reduceMotion = useReducedMotion();
  // The focus ring eases in over the resting border: opacity only.
  const focus = useSharedValue(0);
  const ringStyle = useAnimatedStyle(() => ({ opacity: focus.value }));
  const setFocused = (on: boolean) => {
    focus.set(reduceMotion ? (on ? 1 : 0) : withTiming(on ? 1 : 0, { duration: motion.base }));
  };
  const borderColor = warning ? c.warningText : c.border;
  return (
    <View style={[styles.wrap, style]}>
      {hideLabel ? null : <Text variant="secondaryStrong">{label}</Text>}
      <View
        style={[
          styles.box,
          { borderColor, backgroundColor: c.card },
          multiline ? styles.multiline : null,
          inputStyle,
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: warning ? c.warningText : c.ring }, ringStyle]}
        />
        {prefix ? (
          <Text tone="muted" style={styles.prefix}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={warning ?? helper}
          placeholderTextColor={c.mutedText}
          selectionColor={c.ring}
          cursorColor={c.ring}
          keyboardAppearance="dark"
          multiline={multiline}
          {...input}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: c.foreground, fontFamily: money ? font.bold : font.regular },
            money ? styles.money : null,
            multiline ? styles.multilineInput : null,
          ]}
        />
      </View>
      {warning ? (
        <Text variant="helper" tone="warning">
          {warning}
        </Text>
      ) : helper ? (
        <Text variant="helper" tone="muted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.label },
  box: {
    minHeight: size.field,
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: 12, minHeight: 104 },
  ring: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: radius.control, borderWidth: 1 },
  prefix: { fontSize: 15 },
  input: { flex: 1, fontSize: 15, minHeight: size.field - 2, paddingVertical: 0 },
  money: { fontSize: 18, fontVariant: ['tabular-nums'] },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
});
