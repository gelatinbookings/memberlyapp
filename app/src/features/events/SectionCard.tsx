import type { LucideIcon } from 'lucide-react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Pill, Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

export type SectionCardState = 'done' | 'todo' | 'new';

/** One section of Create New Event: icon tile, title, one-line summary, and a tick, New pill or chevron. */
export function SectionCard({
  title,
  summary,
  Icon,
  state,
  onPress,
  testID,
}: {
  title: string;
  summary: string;
  Icon: LucideIcon;
  state: SectionCardState;
  onPress: () => void;
  testID?: string;
}) {
  const c = useTheme();
  const isNew = state === 'new';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}${state === 'done' ? ', complete' : isNew ? ', new' : ''}. ${summary}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? c.muted : c.card, borderColor: isNew ? c.brandLine : c.border },
      ]}>
      <View style={[styles.tile, { backgroundColor: isNew ? c.brand : c.tint }]}>
        <Icon size={20} color={isNew ? c.onBrand : c.brandText} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Text variant="cardTitle">{title}</Text>
        <Text variant="secondary" tone={isNew ? 'brand' : 'muted'} numberOfLines={2}>
          {summary}
        </Text>
      </View>
      {state === 'done' ? (
        <View style={[styles.tick, { backgroundColor: c.successBg }]} testID={testID ? `${testID}-done` : undefined}>
          <Check size={14} color={c.successText} strokeWidth={2.5} />
        </View>
      ) : null}
      {isNew ? <Pill label="New" tone="brand" style={styles.pill} /> : null}
      {state === 'todo' ? <ChevronRight size={16} color={c.mutedText} strokeWidth={2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
  },
  tile: { width: 44, height: 44, borderRadius: radius.notice, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  tick: { width: 24, height: 24, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pill: { alignSelf: 'center' },
});
