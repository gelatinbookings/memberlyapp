import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** One of a few either-or choices: a title, one line, and a radio mark. Selected: tint and the purple line. */
export function ChoiceCard({
  title,
  line,
  selected,
  onPress,
  testID,
}: {
  title: string;
  line: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${line}`}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: selected ? c.tint : pressed ? c.muted : c.card, borderColor: selected ? c.brandLine : c.border },
      ]}>
      <View style={styles.text}>
        <Text variant="cardTitle">{title}</Text>
        <Text variant="secondary" tone="muted">
          {line}
        </Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? c.brand : c.border }]}>
        {selected ? <View style={[styles.dot, { backgroundColor: c.brand }]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 68, borderWidth: 1, borderRadius: radius.card, padding: space.card, flexDirection: 'row', alignItems: 'center', gap: space.row },
  text: { flex: 1, gap: 2 },
  radio: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
});
