import { ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, PillButton, StatusPill, Text } from '@/components/ui';
import type { Booking } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { statusUi } from '@/features/booking/status';
import { statusLine } from '@/features/booking/statusLine';
import { openLater } from '@/features/navigation/later';
import { useTheme } from '@/theme/theme';
import { space, size } from '@/theme/tokens';

/** A booking in motion: status pill, one money line, one action (F8 status table). */
export function BookingCard({ booking }: { booking: Booking }) {
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
            Offer {formatRate(booking.offerCents)} · {booking.setTime}
          </Text>
        </View>
      </View>
      <StatusPill status={booking.status} />
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
      {ui.action === 'pay_now' ? (
        <Button label="Pay now" onPress={() => openLater(`Pay for ${dj.name}`, 'offer')} />
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
