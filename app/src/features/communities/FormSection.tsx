import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/**
 * A section of a long form, as the web's Create New Community cards: an icon
 * tile, a title and one line. An optional section starts folded so the form
 * stays short; it opens on a tap, or by itself once something is in it.
 */
export function FormSection({
  icon: Icon,
  title,
  line,
  optional = false,
  filled = false,
  testID,
  children,
}: {
  icon: LucideIcon;
  title: string;
  line: string;
  /** Folded until opened. */
  optional?: boolean;
  /** Something is in it already: an optional section shows open. */
  filled?: boolean;
  testID?: string;
  children: ReactNode;
}) {
  const c = useTheme();
  const [opened, setOpened] = useState(false);
  const open = !optional || opened || filled;
  const head = (
    <View style={styles.head}>
      <View style={[styles.tile, { backgroundColor: c.muted }]}>
        <Icon size={18} color={c.foreground} strokeWidth={2} />
      </View>
      <View style={styles.flex}>
        <Text variant="cardTitle" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="secondary" tone="muted">
          {optional ? `Optional. ${line}` : line}
        </Text>
      </View>
      {optional ? (
        <ChevronDown size={18} color={c.mutedText} strokeWidth={2} style={open ? styles.flip : null} />
      ) : null}
    </View>
  );
  return (
    <View testID={testID} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {optional ? (
        <Pressable
          testID={testID ? `${testID}-toggle` : undefined}
          accessibilityRole="button"
          accessibilityLabel={`${title}, optional`}
          accessibilityState={{ expanded: open }}
          disabled={filled}
          onPress={() => setOpened((o) => !o)}>
          {head}
        </Pressable>
      ) : (
        head
      )}
      {open ? <View style={[styles.body, { borderTopColor: c.border }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.row, minHeight: 44 },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  flip: { transform: [{ rotate: '180deg' }] },
  body: { marginTop: space.card, paddingTop: space.card, borderTopWidth: StyleSheet.hairlineWidth, gap: space.md },
});
