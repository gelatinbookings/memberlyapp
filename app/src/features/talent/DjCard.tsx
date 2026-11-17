import { Check } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, PillButton, Text, TierPill } from '@/components/ui';
import type { Dj } from '@/data/types';
import { formatDraw, formatRate } from '@/features/booking/money';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { djCardLabel } from './djLabel';

/** VoiceOver's extra action on a card; a double tap adds or removes. */
const A11Y_ACTIONS =
  Platform.OS === 'ios'
    ? [{ name: 'profile', label: 'Open profile' }]
    : [{ name: 'activate' }, { name: 'profile', label: 'Open profile' }];

/**
 * A DJ in Browse talent (GEL-1012): photo or initials, name, tier, genres,
 * draw, rate and Add. Tapping the card opens the profile; the pill adds or
 * removes. Rate and draw are shown as the catalog sends them.
 */
export function DjCard({
  dj,
  added,
  onToggle,
  onOpen,
}: {
  dj: Dj;
  /** The DJ is on the lineup: the card turns purple and Add becomes a filled Added. */
  added: boolean;
  /** Add, or remove when already added. */
  onToggle: () => void;
  /** Opens the DJ’s profile sheet. */
  onOpen: () => void;
}) {
  const c = useTheme();
  const priced = dj.publishedRateCents != null;
  return (
    <View
      testID={`dj-${dj.id}`}
      accessible
      accessibilityRole="button"
      accessibilityLabel={djCardLabel(dj, added)}
      accessibilityHint={added ? 'Removes this DJ from your lineup' : 'Adds this DJ to your lineup'}
      accessibilityState={{ selected: added }}
      accessibilityActions={A11Y_ACTIONS}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'profile' ? onOpen() : onToggle())}
      onAccessibilityTap={onToggle}
      style={[styles.card, { backgroundColor: added ? c.tint : c.card, borderColor: added ? c.brandLine : c.border }]}>
      <Pressable
        testID={`dj-open-${dj.id}`}
        accessible={false}
        onPress={onOpen}
        style={({ pressed }) => [styles.body, pressed ? styles.pressed : null]}>
        <View style={styles.top}>
          <Avatar source={dj.photo} initials={dj.initials} size={52} />
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <Text variant="cardTitle" numberOfLines={1} style={styles.name}>
                {dj.name}
              </Text>
              <TierPill tier={dj.tier} />
            </View>
            <Text variant="secondary" tone="muted" numberOfLines={1}>
              {dj.genres.join(' · ')}
            </Text>
            <Text variant="secondary" tone={dj.draw ? 'brand' : 'muted'} numberOfLines={1} style={styles.draw}>
              {formatDraw(dj.draw)}
            </Text>
          </View>
        </View>
        <View style={styles.bottom}>
          {priced ? (
            <Text variant="secondary" tone="muted" numberOfLines={1} style={styles.flex}>
              <Text variant="title" style={styles.tabular}>
                {formatRate(dj.publishedRateCents)}
              </Text>{' '}
              per set
            </Text>
          ) : (
            <Text variant="secondaryStrong" tone="muted" numberOfLines={1} style={styles.flex}>
              {formatRate(dj.publishedRateCents)}
            </Text>
          )}
          <PillButton
            testID={`add-${dj.id}`}
            label={added ? 'Added' : 'Add'}
            filled={added}
            icon={added ? <Check size={14} color={c.onBrand} strokeWidth={2.5} /> : undefined}
            onPress={onToggle}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card },
  body: { padding: space.row, gap: space.stack, borderRadius: radius.card },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flexShrink: 1 },
  draw: { marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.row },
  tabular: { fontVariant: ['tabular-nums'] },
});
