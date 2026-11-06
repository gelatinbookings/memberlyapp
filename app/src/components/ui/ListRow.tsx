import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { size } from '@/theme/tokens';

import { Text, type TextTone } from './Text';

export type ListRowProps = {
  label: string;
  /** An 18px icon; it sits in a 36px muted tile. */
  icon?: ReactNode;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  tone?: TextTone;
  testID?: string;
};

export function ListRow({ label, icon, value, onPress, chevron = !!onPress, tone = 'default', testID }: ListRowProps) {
  const c = useTheme();
  const content = (
    <>
      {icon ? <View style={[styles.tile, { backgroundColor: c.muted }]}>{icon}</View> : null}
      <Text variant="bodyStrong" tone={tone} style={styles.label}>
        {label}
      </Text>
      {value ? (
        <Text variant="secondary" tone="muted">
          {value}
        </Text>
      ) : null}
      {chevron ? <ChevronRight size={16} color={c.mutedText} strokeWidth={2} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View testID={testID} style={styles.row}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: c.muted } : null]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.minTarget + 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
});
