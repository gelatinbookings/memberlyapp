import { router } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { DrawnCheck } from '@/components/motion/DrawnCheck';
import { Button, ErrorState, Notice, OverlaySheet, Pill, PillButton, Skeleton, Spinner, Text } from '@/components/ui';
import { useEvent, usePassTypes } from '@/data/RepositoryProvider';
import type { PassType } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { formatEventDate } from '@/lib/dates';
import { PaymentSheetOutlet, usePaymentSheetOpen } from '@/lib/payments';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { PASS_CONFIRMING, PASS_ON_CARD, usePassPurchase } from './usePassPurchase';

export const FREE_FOR_MEMBERS = 'Free for members';

/** The price as the row shows it: "$30", or "Free for members". */
export function passPriceLabel(type: Pick<PassType, 'priceCents' | 'freeForMembers'>): string {
  return type.freeForMembers ? FREE_FOR_MEMBERS : formatRate(type.priceCents);
}

function PassRow({ type, busy, disabled, onGet }: { type: PassType; busy: boolean; disabled: boolean; onGet: () => void }) {
  const c = useTheme();
  const price = passPriceLabel(type);
  const action = type.freeForMembers ? 'Claim' : 'Get';
  return (
    <View
      testID={`pass-${type.id}`}
      style={[styles.row, { borderColor: c.border, backgroundColor: c.card }, type.soldOut ? styles.soldOut : null]}>
      <View style={styles.rowTop}>
        <Text variant="cardTitle" numberOfLines={1} style={styles.flex}>
          {type.name}
        </Text>
        {type.soldOut ? (
          <Pill label="Sold out" tone="neutral" style={styles.pill} />
        ) : (
          <Text variant="cardTitle" tone={type.freeForMembers ? 'brand' : 'default'} style={styles.price}>
            {price}
          </Text>
        )}
      </View>
      <View style={[styles.rowBottom, type.soldOut ? null : styles.withAction]}>
        <Text variant="secondary" tone="muted" numberOfLines={2} style={styles.flex}>
          {type.included}
        </Text>
        {type.soldOut ? null : busy ? (
          <View style={styles.busy} accessibilityLabel={`Getting ${type.name}`} accessibilityState={{ busy: true }}>
            <Spinner />
          </View>
        ) : (
          <PillButton
            testID={`pass-get-${type.id}`}
            label={action}
            accessibilityLabel={`${action} ${type.name}, ${price}`}
            disabled={disabled}
            onPress={onGet}
          />
        )}
      </View>
    </View>
  );
}

/**
 * Get a pass (GEL-1036): a bottom sheet over the event page listing the
 * event's pass types. A paid pass goes through the shared payment sheet with
 * the server's total; a members-free pass is claimed in one tap.
 */
export function PassSheet({
  eventId,
  confirmTimeoutMs,
  pollMs,
}: {
  eventId: string;
  /** Tests shorten the wait for `paid`. */
  confirmTimeoutMs?: number;
  pollMs?: number;
}) {
  const c = useTheme();
  const event = useEvent(eventId);
  const types = usePassTypes(eventId);
  const e = event.data;
  const purchase = usePassPurchase({ eventId, eventName: e?.name ?? '', confirmTimeoutMs, pollMs });
  const paying = usePaymentSheetOpen();

  const close = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/event/[id]', params: { id: eventId } }));
  const showPass = () => router.replace('/card');

  // The server is the one that says there is a pass: a slow order turns into "on your card" when it lands.
  const phase = purchase.phase !== 'confirming' && e?.viewerHasPass ? 'paid' : purchase.phase;
  const subtitle = e ? [e.name, formatEventDate(e.startsAt, e.timeZone)].join(' · ') : '';

  return (
    <View style={styles.root}>
      <OverlaySheet visible onClose={close} testID="pass-sheet" accessibilityLabel="Get a pass" covered={paying}>
        {phase === 'choose' ? (
          <>
            <View style={styles.head}>
              <Text variant="headline" accessibilityRole="header">
                Get a pass
              </Text>
              {subtitle ? (
                <Text variant="secondary" tone="muted" numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {purchase.notice ? <Notice tone={purchase.notice.tone}>{purchase.notice.text}</Notice> : null}
            {types.isPending ? (
              <View accessibilityLabel="Loading passes" accessibilityState={{ busy: true }} style={styles.list}>
                <Skeleton height={84} />
                <Skeleton height={84} />
              </View>
            ) : types.isError ? (
              <ErrorState title="Couldn’t load passes" detail="Nothing was charged." onRetry={() => types.refetch()} />
            ) : types.data.length === 0 ? (
              <Notice>No passes are on sale for this event yet.</Notice>
            ) : (
              <View style={styles.list}>
                {types.data.map((type) => (
                  <PassRow
                    key={type.id}
                    type={type}
                    busy={purchase.busyId === type.id}
                    disabled={purchase.busyId != null}
                    onGet={() => purchase.get(type)}
                  />
                ))}
              </View>
            )}
            <Text variant="helper" tone="muted" align="center">
              Your pass goes on your Memberly Card. Show it at the door.
            </Text>
          </>
        ) : null}

        {phase === 'confirming' ? (
          <View style={styles.state} testID="pass-confirming" accessibilityState={{ busy: true }}>
            <Spinner />
            <Text variant="title" align="center">
              Confirming your pass
            </Text>
          </View>
        ) : null}

        {phase === 'paid' ? (
          <View style={styles.state} testID="pass-paid">
            <DrawnCheck size={64} label="Done" />
            <View style={styles.stateText}>
              <Text variant="headline" align="center" accessibilityRole="header" style={styles.big}>
                {PASS_ON_CARD}
              </Text>
              {subtitle ? (
                <Text tone="muted" align="center">
                  {[purchase.passName, subtitle].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <Button testID="pass-show" label="Show my pass" onPress={showPass} style={styles.full} />
            <Button label="Done" variant="secondary" onPress={close} style={styles.full} />
          </View>
        ) : null}

        {phase === 'slow' ? (
          <View style={styles.state} testID="pass-slow">
            <View style={[styles.badge, { backgroundColor: c.muted }]}>
              <Clock size={26} color={c.mutedText} strokeWidth={2} />
            </View>
            <Text align="center">{PASS_CONFIRMING}</Text>
            <Button label="Done" onPress={close} style={styles.full} />
          </View>
        ) : null}
      </OverlaySheet>
      <PaymentSheetOutlet />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  head: { gap: space.xs },
  list: { gap: space.stack },
  row: { borderWidth: 1, borderRadius: radius.card, padding: space.card, gap: space.sm },
  soldOut: { opacity: 0.6 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  withAction: { minHeight: size.minTarget },
  price: { fontVariant: ['tabular-nums'] },
  pill: { alignSelf: 'center' },
  busy: { width: 64, minHeight: size.minTarget, alignItems: 'center', justifyContent: 'center' },
  state: { alignItems: 'center', gap: space.md, paddingTop: space.sm },
  stateText: { gap: space.sm },
  big: { fontSize: 22, lineHeight: 26 },
  badge: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
});
