import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Pill, StatusPill, Text } from '@/components/ui';
import type { Booking } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { motion, radius, space } from '@/theme/tokens';

import { heldBody, heldFootnote, heldTitle } from './copy';

/**
 * Card held, offer sent (GEL-1019, the Card held board). Shown only once the
 * server says the request moved on from "Payment needed"; the pill is the
 * server's status. Nothing here says charged.
 */
export function CardHeldScreen({
  booking,
  day,
  nextDj,
  onNext,
  onBack,
  onAddAnother,
}: {
  /** The booking just held, as the server returned it. The total shown is its own. */
  booking: Booking;
  /** The event's night, "Sat, Nov 28". */
  day: string;
  /** The next DJ waiting for review, when several offers are being sent. */
  nextDj?: string;
  /** Next: review the offer to `nextDj`. Offered only when another offer is waiting. */
  onNext: () => void;
  onBack: () => void;
  /** Add another DJ. Offered when no other offer is waiting. */
  onAddAnother: () => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const dj = booking.dj;
  const waiting = booking.status === 'requested';
  return (
    <Animated.View
      entering={FadeIn.duration(motion.base)}
      testID="card-held"
      accessibilityViewIsModal
      style={[
        styles.root,
        { backgroundColor: c.background, paddingTop: insets.top + space.md, paddingBottom: Math.max(insets.bottom, space.md) },
      ]}>
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: c.tint, borderColor: c.brandLine }]}>
          <Check size={36} color={c.brandText} strokeWidth={2} />
        </View>
        <View style={styles.text}>
          <Text variant="display" align="center" accessibilityRole="header" style={styles.title}>
            {heldTitle(dj.name)}
          </Text>
          <Text tone="muted" align="center">
            {heldBody(dj.name, booking.totalCents)}
          </Text>
        </View>
        <View style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
          <Avatar source={dj.photo} initials={dj.initials} />
          <View style={styles.flex}>
            <Text variant="cardTitle" numberOfLines={1}>
              {dj.name}
            </Text>
            <Text variant="secondary" tone="muted" numberOfLines={1}>
              {[day, booking.setTime].filter(Boolean).join(' · ')}
            </Text>
            {waiting ? null : <StatusPill status={booking.status} style={styles.below} />}
          </View>
          {waiting ? <Pill label="Card held" tone="held" style={styles.pill} /> : null}
        </View>
      </View>
      <View style={styles.actions}>
        {nextDj ? (
          <>
            <Button testID="held-next" label={`Next: your offer to ${nextDj}`} onPress={onNext} />
            <Button label="Back to your lineup" variant="secondary" onPress={onBack} style={styles.tall} />
          </>
        ) : (
          <>
            <Button testID="held-back" label="Back to your lineup" onPress={onBack} />
            <Button label="Add another DJ" variant="secondary" onPress={onAddAnother} style={styles.tall} />
          </>
        )}
        <Text variant="helper" tone="muted" align="center">
          {heldFootnote(dj.name)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 9, paddingHorizontal: space.gutter, gap: space.section },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, paddingHorizontal: space.sm },
  badge: { width: 88, height: 88, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  text: { gap: space.stack },
  title: { fontSize: 26, lineHeight: 30 },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.row,
    paddingHorizontal: space.card,
  },
  flex: { flex: 1, minWidth: 0 },
  below: { marginTop: space.label },
  pill: { alignSelf: 'center' },
  actions: { gap: space.stack },
  tall: { height: 52 },
});
