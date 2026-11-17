import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, MoneySummary, Notice, OverlaySheet, Skeleton, Text } from '@/components/ui';
import { isRepositoryError } from '@/data/errors';
import { useOfferQuote } from '@/data/RepositoryProvider';
import type { DraftOffer } from '@/data/types';
import { formatSetTime } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { holdAndSendLabel, QUOTE_FAILED, reviewLines, SECURE_LINE } from './copy';

/**
 * The offer review sheet (GEL-1018, the Offer board): one DJ at a time. The
 * fee, the Gelatin service fee and the total to hold all come from the
 * server's quote; this sheet adds nothing up.
 */
export function OfferReviewSheet({
  eventId,
  context,
  offer,
  error,
  sending,
  onConfirm,
  onEdit,
  onOffline,
}: {
  eventId: string;
  /** "Late Service · Sat, Nov 28" */
  context: string;
  /** The unsent offer: the DJ, the fee and the note. */
  offer: DraftOffer;
  /** Why the last send did not go through, if it did not. */
  error: string | null;
  /** Hold and send is working: the button shows it is busy. */
  sending: boolean;
  /** Hold and send: opens the payment sheet for the server’s total. */
  onConfirm: () => void;
  /** Close and go back to the offer fields. */
  onEdit: () => void;
  /** The quote could not be read because there is no connection. */
  onOffline: () => void;
}) {
  const c = useTheme();
  const dj = offer.dj;
  const quote = useOfferQuote(eventId, dj.id, offer.offerCents);
  const q = quote.data;
  const offline = isRepositoryError(quote.error, 'offline');

  useEffect(() => {
    if (offline) onOffline();
    // Only the change to offline matters; the handler is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  return (
    <OverlaySheet visible onClose={onEdit} testID="offer-review" accessibilityLabel={`Your offer to ${dj.name}`}>
      <View style={styles.head}>
        <Avatar source={dj.photo} initials={dj.initials} size={52} />
        <View style={styles.flex}>
          <Text variant="headline" accessibilityRole="header">
            Your offer to {dj.name}
          </Text>
          <Text variant="secondary" tone="muted" numberOfLines={1}>
            {context}
          </Text>
        </View>
      </View>

      {q ? (
        <MoneySummary
          lines={[
            { label: `${dj.name}’s fee`, cents: q.offerCents },
            { label: 'Gelatin service fee', cents: q.serviceFeeCents },
          ]}
          total={{ label: 'Held on your card', cents: q.totalCents }}
        />
      ) : quote.isError && !offline ? (
        <Notice tone="error">{QUOTE_FAILED}</Notice>
      ) : (
        <View accessibilityLabel="Getting your total" accessibilityState={{ busy: true }} style={styles.loading}>
          <Skeleton height={16} round />
          <Skeleton height={16} round />
          <Skeleton height={32} width="50%" />
        </View>
      )}

      {q ? (
        <View style={[styles.steps, { backgroundColor: c.muted }]}>
          {reviewLines(dj.name, q.totalCents).map((line, i) => (
            <View key={line} style={styles.step}>
              <Text variant="secondaryStrong" tone="brand" style={styles.number}>
                {i + 1}
              </Text>
              <Text variant="secondary" tone="muted" style={styles.flex}>
                {line}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.noteRow}>
        <Text variant="secondary" tone="muted" style={styles.flex}>
          {offer.setStart && offer.setEnd ? (
            <>
              Set: <Text variant="secondary" testID="review-set">{formatSetTime(offer.setStart, offer.setEnd)}</Text>
              {'\n'}
            </>
          ) : null}
          {offer.note.trim() ? (
            <>
              Note sent with the offer: <Text variant="secondary">“{offer.note.trim()}”</Text>
            </>
          ) : (
            'No note with this offer.'
          )}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit offer" onPress={onEdit} hitSlop={12} style={styles.edit}>
          <Text variant="secondaryStrong" tone="brand">
            Edit
          </Text>
        </Pressable>
      </View>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {q ? (
        <Button testID="offer-confirm" label={holdAndSendLabel(q.totalCents)} loading={sending} onPress={onConfirm} />
      ) : quote.isError && !offline ? (
        <Button label="Try again" onPress={() => quote.refetch()} />
      ) : (
        <Button testID="offer-confirm" label="Getting your total" disabled />
      )}
      <Text variant="helper" tone="muted" align="center">
        {SECURE_LINE}
      </Text>
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  loading: { gap: space.row, paddingVertical: space.sm },
  steps: { borderRadius: radius.notice, paddingHorizontal: 14, paddingVertical: 12, gap: space.label },
  step: { flexDirection: 'row', gap: space.sm },
  number: { width: 10 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  edit: { minHeight: size.minTarget, justifyContent: 'center' },
});
