import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Notice, OverlaySheet, PillButton, Skeleton, StatusPill, Text } from '@/components/ui';
import { useAlternates, useDraftOffers } from '@/data/RepositoryProvider';
import type { Booking, Dj } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { statusLine } from '@/features/booking/statusLine';
import { useTheme } from '@/theme/theme';
import { font, radius, size, space } from '@/theme/tokens';

export const ALTERNATES_TITLE = 'Other DJs open that night';
export const ALTERNATES_EMPTY_TITLE = 'Nobody at this budget?';
export const SEARCH_ANOTHER_DATE = 'Search another date';
export const ALTERNATES_UNAVAILABLE = 'We couldn’t reach Gelatin. Your lineup is safe and nothing was sent.';
export const ATTRIBUTION = 'DJs, availability and rates from Gelatin';

/** "See everyone open on Nov 20" */
export function seeEveryoneLabel(shortDay: string): string {
  return shortDay ? `See everyone open on ${shortDay}` : 'See everyone open that night';
}

const MAX_ALTERNATES = 3;

/** Keeps a range on one line: a word joiner on each side of the dash. */
const RANGE_DASH = '\u2060–\u2060';

/** "Baile funk · Jersey club · draws 150–205" */
function alternateLine(dj: Dj): string {
  return [...dj.genres, dj.draw ? `draws ${dj.draw.min}${RANGE_DASH}${dj.draw.max}` : 'draw not yet established'].join(' · ');
}

/**
 * Other DJs open that night (GEL-1023, the Alternates board), for a booking
 * that passed, expired or was cancelled. The DJ it was with sits greyed at
 * the top with the one line about the hold; below, up to three DJs who are
 * open, each with Offer. It never says why a DJ passed, shows no message from
 * them and no history: the app is never sent any.
 */
export function AlternatesSheet({
  eventId,
  booking,
  shortDay,
  onOffer,
  onSeeEveryone,
  onSearchDate,
  onClose,
}: {
  eventId: string;
  /** The booking that is over. */
  booking: Booking;
  /** The event's night without the weekday, "Nov 20". */
  shortDay: string;
  /** Add this DJ to the lineup as an unsent offer. */
  onOffer: (dj: Dj) => void;
  /** Open Browse talent. */
  onSeeEveryone: () => void;
  /** Open Date & time. */
  onSearchDate: () => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const alternates = useAlternates(booking.requestId);
  const added = useDraftOffers(eventId);
  const dj = booking.dj;
  const taken = new Set([dj.id, ...(added.data ?? []).map((o) => o.dj.id)]);
  const open = (alternates.data ?? []).filter((d) => !taken.has(d.id)).slice(0, MAX_ALTERNATES);
  const line = statusLine(booking)
    .map((p) => p.text)
    .join('');
  const empty = alternates.isSuccess && open.length === 0;
  const seeEveryone = (
    <Pressable testID="alternates-see-everyone" accessibilityRole="link" onPress={onSeeEveryone} style={[styles.link, empty ? styles.centered : null]}>
      <Text variant="bodyStrong" tone="brand" style={styles.linkText}>
        {seeEveryoneLabel(shortDay)}
      </Text>
      <ChevronRight size={14} color={c.brandText} strokeWidth={2} />
    </Pressable>
  );

  return (
    <OverlaySheet visible onClose={onClose} testID="alternates" accessibilityLabel={ALTERNATES_TITLE}>
      <Card testID="alternates-passed" style={styles.passed}>
        <View style={styles.row}>
          <Avatar source={dj.photo} initials={dj.initials} muted accessibilityLabel={dj.name} />
          <View style={styles.flex}>
            <Text variant="cardTitle" numberOfLines={1}>
              {dj.name}
            </Text>
            {booking.setTime ? (
              <Text variant="secondary" tone="muted" numberOfLines={1}>
                {booking.setTime}
              </Text>
            ) : null}
          </View>
          <StatusPill status={booking.status} style={styles.pill} />
        </View>
        {line ? (
          <Text variant="secondary" tone="muted">
            {line}
          </Text>
        ) : null}
      </Card>

      {empty ? null : (
        <View style={styles.list}>
          <Text variant="title" accessibilityRole="header">
            {ALTERNATES_TITLE}
          </Text>
          {alternates.isPending ? (
            <View accessibilityLabel="Finding DJs open that night" accessibilityState={{ busy: true }} style={styles.list}>
              <Skeleton height={68} />
              <Skeleton height={68} />
            </View>
          ) : null}
          {alternates.isError ? <Notice tone="error">{ALTERNATES_UNAVAILABLE}</Notice> : null}
          {open.map((alt) => (
            <Card key={alt.id} padding={space.row} testID={`alternate-${alt.id}`}>
              <View style={styles.row}>
                <Avatar source={alt.photo} initials={alt.initials} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {alt.name}
                  </Text>
                  <Text variant="helper" tone="muted" numberOfLines={2}>
                    {alternateLine(alt)}
                  </Text>
                </View>
                <Text variant="secondaryStrong" tone={alt.publishedRateCents == null ? 'muted' : 'default'} style={styles.rate}>
                  {alt.publishedRateCents == null ? 'Private' : formatRate(alt.publishedRateCents)}
                </Text>
                <PillButton label="Offer" accessibilityLabel={`Offer to ${alt.name}`} onPress={() => onOffer(alt)} />
              </View>
            </Card>
          ))}
          {alternates.isError ? (
            <PillButton testID="alternates-retry" label="Try again" style={styles.start} onPress={() => alternates.refetch()} />
          ) : (
            seeEveryone
          )}
        </View>
      )}

      <View style={[styles.another, { borderColor: c.border }]} testID="alternates-another-date">
        <Text variant="bodyStrong" align="center" style={styles.anotherTitle}>
          {ALTERNATES_EMPTY_TITLE}
        </Text>
        <Pressable accessibilityRole="link" onPress={onSearchDate} style={styles.anotherLink}>
          <Text variant="secondaryStrong" tone="brand">
            {SEARCH_ANOTHER_DATE}
          </Text>
        </Pressable>
      </View>
      {/* With nobody open there is no list to head: the question and the two ways on stand alone. */}
      {empty ? seeEveryone : null}
      <Text variant="helper" tone="muted" align="center">
        {ATTRIBUTION}
      </Text>
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  passed: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  pill: { alignSelf: 'center' },
  list: { gap: space.stack },
  rate: { fontVariant: ['tabular-nums'] },
  start: { alignSelf: 'flex-start' },
  link: { minHeight: size.minTarget, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  centered: { alignSelf: 'center' },
  linkText: { fontSize: 14 },
  another: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.xs, alignItems: 'center' },
  anotherTitle: { fontFamily: font.semibold },
  anotherLink: { minHeight: size.minTarget, justifyContent: 'center', paddingHorizontal: space.md },
});
