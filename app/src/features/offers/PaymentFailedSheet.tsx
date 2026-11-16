import { CreditCard } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, OverlaySheet, StatusPill, Text } from '@/components/ui';
import type { Booking } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { offerAndTotal, PAYMENT_FAILED_TITLE, paymentFailedBody } from './copy';

/**
 * Payment didn't go through (GEL-1020; the board was drawn as "That checkout
 * expired"). The payment sheet has already shown the provider's message; this
 * says what it means for the offer and offers Try again with a fresh session.
 */
export function PaymentFailedSheet({
  booking,
  retrying,
  onRetry,
  onClose,
}: {
  booking: Booking;
  retrying: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const dj = booking.dj;
  return (
    <OverlaySheet visible onClose={onClose} testID="payment-failed" accessibilityLabel={PAYMENT_FAILED_TITLE}>
      <View style={[styles.badge, { backgroundColor: c.warningBg }]}>
        <CreditCard size={26} color={c.warningText} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Text variant="headline" accessibilityRole="header" style={styles.title}>
          {PAYMENT_FAILED_TITLE}
        </Text>
        <Text tone="muted">{paymentFailedBody(dj.name)}</Text>
      </View>
      <View style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
        <Avatar source={dj.photo} initials={dj.initials} />
        <View style={styles.flex}>
          {/* The pill shares the name's line, so the offer and total below have the full width. */}
          <View style={styles.nameRow}>
            <Text variant="cardTitle" numberOfLines={1} style={styles.flex}>
              {dj.name}
            </Text>
            <StatusPill status={booking.status} style={styles.pill} />
          </View>
          <Text variant="secondary" tone="muted">
            {offerAndTotal(booking)}
          </Text>
        </View>
      </View>
      <Button testID="payment-retry" label="Try again" loading={retrying} onPress={onRetry} />
      <Pressable accessibilityRole="button" accessibilityLabel="Not now" onPress={onClose} style={styles.later}>
        <Text variant="bodyStrong" tone="brand">
          Not now
        </Text>
      </Pressable>
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  badge: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  text: { gap: space.sm },
  title: { fontSize: 22, lineHeight: 26 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.row,
    paddingHorizontal: space.card,
  },
  flex: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: { alignSelf: 'center' },
  later: { minHeight: size.minTarget, alignItems: 'center', justifyContent: 'center' },
});
