import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';

/** A 17px section title with an optional "See all" style link on the right. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {actionLabel ? (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={10} style={styles.action}>
          <Text variant="secondaryStrong" tone="brand">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1 },
  action: { minHeight: 44, justifyContent: 'center' },
});
