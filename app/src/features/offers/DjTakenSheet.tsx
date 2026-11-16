import { StyleSheet, View } from 'react-native';

import { Avatar, Button, GroupedList, OverlaySheet, PillButton, Text } from '@/components/ui';
import { useDraftOffers, useTalent } from '@/data/RepositoryProvider';
import type { Dj } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { NO_FILTERS } from '@/features/talent/filters';
import { space } from '@/theme/tokens';

import { SEE_EVERYONE, TAKEN_BODY, takenAlternatesLine, takenTitle } from './copy';

export const ATTRIBUTION = 'DJs, availability and rates from Gelatin';
const MAX_ALTERNATES = 3;

/** "Baile funk · Jersey club · draws 150–205" */
function alternateLine(dj: Dj): string {
  return [...dj.genres, dj.draw ? `draws ${dj.draw.min}–${dj.draw.max}` : 'draw not yet established'].join(' · ');
}

/**
 * DJ taken (GEL-1020, the DJ taken board): the offer came back
 * `dj_unavailable`. Nothing was sent or held. The sheet never says why, and
 * offers up to three DJs who are still open that night from the same catalog
 * Browse talent reads.
 */
export function DjTakenSheet({
  eventId,
  dj,
  day,
  onOffer,
  onSeeEveryone,
  onClose,
}: {
  eventId: string;
  dj: Dj;
  day: string;
  /** Add an alternate to the lineup with its own offer fields. */
  onOffer: (dj: Dj) => void;
  onSeeEveryone: () => void;
  onClose: () => void;
}) {
  const talent = useTalent(eventId, NO_FILTERS);
  const added = useDraftOffers(eventId);
  const taken = new Set([dj.id, ...(added.data ?? []).map((o) => o.dj.id)]);
  const open = (talent.data?.pages.flatMap((p) => p.djs) ?? []).filter((d) => !taken.has(d.id)).slice(0, MAX_ALTERNATES);

  return (
    <OverlaySheet visible onClose={onClose} testID="dj-taken" accessibilityLabel={takenTitle(dj.name)}>
      <View style={styles.head}>
        <Avatar source={dj.photo} initials={dj.initials} size={56} muted />
        <View style={styles.flex}>
          <Text variant="headline" accessibilityRole="header" style={styles.title}>
            {takenTitle(dj.name)}
          </Text>
          <Text variant="secondary" tone="muted">
            {day}
          </Text>
        </View>
      </View>
      <Text tone="muted">{open.length > 0 ? `${TAKEN_BODY} ${takenAlternatesLine(day)}` : TAKEN_BODY}</Text>

      {open.length > 0 ? (
        <GroupedList>
          {open.map((alt) => (
            <View key={alt.id} style={styles.row} testID={`alternate-${alt.id}`}>
              <Avatar source={alt.photo} initials={alt.initials} size={40} />
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
              <PillButton label="Offer" onPress={() => onOffer(alt)} />
            </View>
          ))}
        </GroupedList>
      ) : null}

      <Button testID="taken-see-everyone" label={SEE_EVERYONE} onPress={onSeeEveryone} />
      <Text variant="helper" tone="muted" align="center">
        {ATTRIBUTION}
      </Text>
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 22, lineHeight: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingVertical: space.row, paddingHorizontal: space.card },
  rate: { fontVariant: ['tabular-nums'] },
});
