import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { Button } from './Button';
import { Text } from './Text';

/** Skeleton block for loading content (not a spinner in the middle of content). */
export function Skeleton({ height, width = '100%', round = false }: { height: number; width?: number | `${number}%`; round?: boolean }) {
  const c = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ height, width, borderRadius: round ? radius.pill : radius.notice, backgroundColor: c.muted }}
    />
  );
}

export function LoadingRows({ count = 3, label = 'Loading' }: { count?: number; label?: string }) {
  const c = useTheme();
  return (
    <View accessibilityLabel={label} accessibilityState={{ busy: true }} style={styles.stack}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
          <Skeleton height={64} width={64} />
          <View style={styles.lines}>
            <Skeleton height={14} width="60%" round />
            <Skeleton height={12} width="80%" round />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Error with a way out: names the problem and offers Try again. */
export function ErrorState({ title, detail, onRetry }: { title: string; detail?: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.error}>
      <Text variant="headline" align="center">
        {title}
      </Text>
      {detail ? (
        <Text tone="muted" align="center">
          {detail}
        </Text>
      ) : null}
      {onRetry ? <Button label="Try again" onPress={onRetry} style={styles.retry} /> : null}
    </View>
  );
}

export function Spinner() {
  const c = useTheme();
  return <ActivityIndicator color={c.mutedText} />;
}

const styles = StyleSheet.create({
  stack: { gap: space.stack },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.card, borderWidth: 1 },
  lines: { flex: 1, gap: 8 },
  error: { gap: space.sm, paddingVertical: space.gutter, alignItems: 'stretch' },
  retry: { marginTop: space.sm },
});
