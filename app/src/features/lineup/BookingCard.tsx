import { ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, PillButton, StatusPill, Text } from '@/components/ui';
import type { Booking } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { statusUi } from '@/features/booking/status';
import { statusLine } from '@/features/booking/statusLine';
import { openLater } from '@/features/navigation/later';
import { PAYMENT_FAILED_TITLE, paymentFailedBody } from '@/features/offers/copy';
import { useTheme } from '@/theme/theme';
import { space, size } from '@/theme/tokens';

/**
 * A booking in motion: status pill, one money line, one action (F8 status table).
 * Pay now runs the card hold; after a refused payment the card says so and
 * offers Try again, still under "Payment needed".
 */
export function BookingCard({
  booking,
  onPay,
  paying = false,
  paymentFailed = false,
}: {
  booking: Booking;
  /** Hold the card for this request. */
  onPay?: () => void;
  paying?: boolean;
  /** The last payment for this request was refused. */
  paymentFailed?: boolean;
}) {
  const c = useTheme();
  const ui = statusUi(booking.status);
  const parts = statusLine(booking);
  const dj = booking.dj;
  const done = ui.tone === 'neutral';

  return (
    <Card testID={`booking-${dj.id}`}>
      <View style={styles.head}>
        <Avatar source={dj.photo} initials={dj.initials} muted={done} accessibilityLabel={dj.name} />
        <View style={styles.flex}>
          <Text variant="cardTitle" numberOfLines={1}>
            {dj.name}
          </Text>
          <Text variant="secondary" tone="muted" numberOfLines={1}>
            {[`Offer ${formatRate(booking.offerCents)}`, booking.setTime].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
      <StatusPill status={booking.status} />
      {ui.action === 'pay_now' && paymentFailed ? (
        <Text variant="secondary" tone="muted" testID={`payment-failed-${dj.id}`}>
          <Text variant="secondaryStrong">{PAYMENT_FAILED_TITLE}. </Text>
          {paymentFailedBody(dj.name)}
        </Text>
      ) : (
        <Text variant="secondary" tone="muted">
          {parts.map((p, i) =>
            p.strong ? (
              <Text key={i} variant="secondaryStrong">
                {p.text}
              </Text>
            ) : (
              p.text
            ),
          )}
        </Text>
      )}
      {ui.action === 'pay_now' ? (
        <Button testID={`pay-${dj.id}`} label={paymentFailed ? 'Try again' : 'Pay now'} loading={paying} onPress={onPay} />
      ) : null}
      {ui.action === 'manage_in_gelatin' || ui.action === 'review_new_offer' ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={ui.actionLabel ?? undefined}
          onPress={() => openLater(ui.actionLabel ?? 'Manage in Gelatin', 'status')}
          style={styles.link}>
          <Text variant="secondaryStrong" tone="brand">
            {ui.actionLabel}
          </Text>
          <ArrowUpRight size={16} color={c.brandText} strokeWidth={2} />
        </Pressable>
      ) : null}
      {ui.action === 'other_djs' ? (
        <PillButton
          label={ui.actionLabel ?? ''}
          style={styles.alt}
          onPress={() => openLater('Other DJs open that night', 'status')}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  link: { minHeight: size.minTarget, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  alt: { alignSelf: 'flex-start' },
});
