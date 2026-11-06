import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PassPill, Pill, Text } from '@/components/ui';
import type { EventRelation, MemberEvent } from '@/data/types';
import { formatEventDate, formatEventTime } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

export type EventRowProps = {
  event: MemberEvent;
  /** Show the date in the meta line (lists spanning days). */
  showDate?: boolean;
  showDistance?: boolean;
  /** Plain row (inside a sheet) or bordered card row (in a list). */
  framed?: boolean;
  /** On the Events tab: a Pass (green), Going (tint) or Saved (grey) pill instead of the price. */
  relation?: EventRelation;
  /** Defaults to the event page. Home's pass row opens the Memberly Card instead. */
  onPress?: () => void;
};

const RELATION_PILL: Record<EventRelation, { label: string; tone: 'success' | 'held' | 'neutral' }> = {
  pass: { label: 'Pass', tone: 'success' },
  going: { label: 'Going', tone: 'held' },
  saved: { label: 'Saved', tone: 'neutral' },
};

export function EventRow({ event, showDate = false, showDistance = false, framed = false, relation, onPress }: EventRowProps) {
  const c = useTheme();
  const meta = [
    showDate ? formatEventDate(event.startsAt, event.timeZone) : null,
    event.communityName,
    formatEventTime(event.startsAt, event.timeZone),
    showDistance && event.distanceMiles != null ? `${event.distanceMiles} mi` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      testID={`event-row-${event.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${meta}${
        relation ? `, ${RELATION_PILL[relation].label}` : event.viewerHasPass ? ', you have a pass' : `, ${event.priceLabel}`
      }`}
      onPress={onPress ?? (() => router.push({ pathname: '/event/[id]', params: { id: event.id } }))}
      style={({ pressed }) => [
        styles.row,
        framed ? [styles.framed, { borderColor: c.border, backgroundColor: c.card }] : null,
        pressed ? { opacity: 0.8 } : null,
      ]}>
      <Image source={event.cover} style={styles.thumb} contentFit="cover" />
      <View style={styles.text}>
        <Text variant="cardTitle" numberOfLines={1}>
          {event.name}
        </Text>
        {/* With a date the line runs long; two lines keep the time visible. */}
        <Text variant="secondary" tone="muted" numberOfLines={showDate ? 2 : 1}>
          {meta}
        </Text>
      </View>
      {relation ? (
        <Pill label={RELATION_PILL[relation].label} tone={RELATION_PILL[relation].tone} />
      ) : event.viewerHasPass ? (
        <PassPill />
      ) : (
        <Text variant="secondaryStrong" tone="brand">
          {event.priceLabel}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, minHeight: size.minTarget },
  framed: { borderWidth: 1, borderRadius: radius.card, padding: 10 },
  thumb: { width: size.rowThumb, height: size.rowThumb, borderRadius: radius.notice },
  text: { flex: 1, gap: 2 },
});
