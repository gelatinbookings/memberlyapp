import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius } from '@/theme/tokens';

import { Text } from './Text';

export type NoticeTone = 'muted' | 'tint' | 'error' | 'warning';

export type NoticeProps = {
  children: ReactNode;
  tone?: NoticeTone;
  /** Optional bold lead-in, e.g. "No lineup right now?" */
  title?: string;
  icon?: ReactNode;
  /** Centred text, for a notice under a centred heading. */
  center?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Inset notice: the hold line, back-from-Gelatin, unavailable. 12px radius. */
export function Notice({ children, tone = 'muted', title, icon, center = false, style }: NoticeProps) {
  const c = useTheme();
  const colors = {
    muted: { bg: c.muted, fg: c.mutedText, border: 'transparent' },
    tint: { bg: c.tint, fg: c.brandText, border: c.brandLine },
    error: { bg: c.errorBg, fg: c.errorText, border: 'transparent' },
    warning: { bg: c.warningBg, fg: c.warningText, border: 'transparent' },
  }[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.notice, { backgroundColor: colors.bg, borderColor: colors.border }, style]}>
      {icon}
      <Text variant="secondary" align={center ? 'center' : undefined} style={[styles.text, { color: colors.fg }]}>
        {title ? (
          <Text variant="secondaryStrong" tone={tone === 'muted' ? 'default' : undefined} style={tone === 'muted' ? null : { color: colors.fg }}>
            {title}{' '}
          </Text>
        ) : null}
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: radius.notice,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  text: { flex: 1 },
});
