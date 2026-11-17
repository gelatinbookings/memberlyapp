import { ArrowUpRight } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, PillButton, Text } from '@/components/ui';
import type { Booking } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { isBookingStatus, statusUi } from '@/features/booking/status';
import { statusLine } from '@/features/booking/statusLine';
import { PAYMENT_FAILED_TITLE, paymentFailedBody } from '@/features/offers/copy';
import { logEvent } from '@/lib/analytics';
import { useTheme } from '@/theme/theme';
import { space, size } from '@/theme/tokens';

import { LiveStatusPill } from './LiveStatusPill';

/**
 * A booking in motion: status pill, one money line, one action (F8 status table).
 * Pay now runs the card hold; after a refused payment the card says so and
 * offers Try again, still under "Payment needed". Everything after the first
 * payment is a hand-off: Manage in Gelatin and Review the new offer in Gelatin
 * open the Continue in Gelatin sheet, never a screen of the app's own. A
 * booking that is over offers other DJs open that night. A status the app
 * does not know reads "Checking status" and offers nothing.
 */
export function BookingCard({
  booking,
  onPay,
  paying = false,
  paymentFailed = false,
  onManage,
  onAlternates,
}: {
  booking: Booking;
  /** Hold the card for this request. */
  onPay?: () => void;
  paying?: boolean;
  /** The last payment for this request was refused. */
  paymentFailed?: boolean;
  /** Manage in Gelatin, or Review the new offer in Gelatin. Only ever offered once a hold exists. */
  onManage?: () => void;
  /** Other DJs open that night. */
  onAlternates?: () => void;
}) {
  const c = useTheme();
  const { status } = booking;
  const ui = statusUi(status);
  const parts = statusLine(booking);
  const dj = booking.dj;
  const done = ui.action === 'other_djs';
  const newOffer = ui.action === 'review_new_offer';

  // A status this build has never heard of: worth knowing about, once per status.
  const unknown = !isBookingStatus(status);
  useEffect(() => {
    if (unknown) logEvent({ name: 'booking_status_unknown', props: { status } });
  }, [unknown, status]);

  return (
    <Card testID={`booking-${dj.id}`} attention={newOffer}>
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
      <LiveStatusPill djName={dj.name} status={status} />
      {ui.action === 'pay_now' && paymentFailed ? (
        <Text variant="secondary" tone="muted" testID={`payment-failed-${dj.id}`}>
          <Text variant="secondaryStrong">{PAYMENT_FAILED_TITLE}. </Text>
          {paymentFailedBody(dj.name)}
        </Text>
      ) : parts.length > 0 ? (
        <Text variant="secondary" tone="muted" testID={`status-line-${dj.id}`}>
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
      ) : null}
      {ui.action === 'pay_now' ? (
        <Button testID={`pay-${dj.id}`} label={paymentFailed ? 'Try again' : 'Pay now'} loading={paying} onPress={onPay} />
      ) : null}
      {newOffer ? (
        // The one card that needs the organizer: a filled action, as on the "Back from Gelatin" board.
        <Button
          testID={`review-${dj.id}`}
          label={ui.actionLabel ?? ''}
          trailingIcon={<ArrowUpRight size={16} color={c.onBrand} strokeWidth={2} />}
          onPress={onManage}
        />
      ) : null}
      {ui.action === 'manage_in_gelatin' ? (
        <Pressable
          testID={`manage-${dj.id}`}
          accessibilityRole="link"
          accessibilityLabel={ui.actionLabel ?? undefined}
          onPress={onManage}
          style={styles.link}>
          <Text variant="secondaryStrong" tone="brand">
            {ui.actionLabel}
          </Text>
          <ArrowUpRight size={16} color={c.brandText} strokeWidth={2} />
        </Pressable>
      ) : null}
      {ui.action === 'other_djs' ? (
        <PillButton testID={`alternates-${dj.id}`} label={ui.actionLabel ?? ''} style={styles.alt} onPress={onAlternates} />
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
