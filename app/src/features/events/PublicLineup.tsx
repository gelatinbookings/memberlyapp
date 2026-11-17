import { Music } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar, Text, TierPill } from '@/components/ui';
import type { LineupSlot } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

export const PUBLIC_LINEUP_TITLE = 'Lineup';
export const PUBLIC_LINEUP_LINE = 'DJs booked through Gelatin';
export const LINEUP_SOON_TITLE = 'Lineup coming soon';
export const LINEUP_SOON_BODY = 'The DJs will show here as soon as they’re confirmed.';

/**
 * One slot on a public lineup: a confirmed DJ with photo, sound, set time and
 * tier, or TBA with the set time when the organizer lets pending slots show.
 * Never a fee, an offer or who booked them.
 */
export function PublicLineupRow({ slot }: { slot: LineupSlot }) {
  const c = useTheme();
  if (!slot.djName) {
    return (
      <View style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]} accessible accessibilityLabel={`To be announced, ${slot.setTime}`}>
        <View style={[styles.tba, { backgroundColor: c.muted }]}>
          <Music size={22} color={c.mutedText} strokeWidth={2} />
        </View>
        <View style={styles.flex}>
          <Text variant="cardTitle">TBA</Text>
          <Text variant="secondary" tone="muted">
            {slot.setTime}
          </Text>
        </View>
      </View>
    );
  }
  const meta = [slot.genres, slot.setTime].filter(Boolean).join(' · ');
  return (
    <View
      style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}
      accessible
      accessibilityLabel={[slot.djName, meta, slot.tier].filter(Boolean).join(', ')}>
      <Avatar source={slot.djPhoto} initials={slot.djName.slice(0, 2).toUpperCase()} size={56} />
      <View style={styles.flex}>
        <Text variant="cardTitle">{slot.djName}</Text>
        <Text variant="secondary" tone="muted" numberOfLines={2}>
          {meta}
        </Text>
      </View>
      {slot.tier ? <TierPill tier={slot.tier} /> : null}
    </View>
  );
}

/**
 * The Lineup section of a public event page: the Gelatin integration as
 * members and guests see it. Every event has one. Confirmed DJs, TBA where
 * the organizer allows pending slots, and "Lineup coming soon" before anyone
 * is confirmed. Public, so it never shows fees, offers or booker details.
 */
export function PublicLineup({ slots, testID = 'public-lineup' }: { slots: LineupSlot[]; testID?: string }) {
  const c = useTheme();
  return (
    <View testID={testID} style={styles.wrap}>
      <View style={styles.head}>
        <Text variant="title" accessibilityRole="header">
          {PUBLIC_LINEUP_TITLE}
        </Text>
        <Text variant="secondary" tone="muted">
          {PUBLIC_LINEUP_LINE}
        </Text>
      </View>
      {slots.length > 0 ? (
        slots.map((slot, i) => <PublicLineupRow key={`${slot.djName ?? 'tba'}-${i}`} slot={slot} />)
      ) : (
        <View
          testID={`${testID}-soon`}
          style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}
          accessible
          accessibilityLabel={`${LINEUP_SOON_TITLE}. ${LINEUP_SOON_BODY}`}>
          <View style={[styles.tba, { backgroundColor: c.muted }]}>
            <Music size={22} color={c.mutedText} strokeWidth={2} />
          </View>
          <View style={styles.flex}>
            <Text variant="cardTitle">{LINEUP_SOON_TITLE}</Text>
            <Text variant="secondary" tone="muted">
              {LINEUP_SOON_BODY}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.row },
  head: { gap: space.xs },
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, borderWidth: 1, borderRadius: radius.card, padding: 10 },
  tba: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
