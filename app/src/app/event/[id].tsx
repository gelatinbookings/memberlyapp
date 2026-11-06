import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarDays, Clock, MapPin, Music, Share as ShareIcon } from 'lucide-react-native';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, ErrorState, IconButton, LoadingRows, Text, TierPill } from '@/components/ui';
import { useEvent } from '@/data/RepositoryProvider';
import type { LineupSlot } from '@/data/types';
import { formatEventDate, formatEventRange } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

const COVER = 300;

function InfoTag({ icon, label }: { icon: React.ReactNode; label: string }) {
  const c = useTheme();
  return (
    <View style={[styles.tag, { borderColor: c.border }]} accessible accessibilityLabel={label}>
      {icon}
      <Text variant="secondaryStrong" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Public lineup: confirmed DJs, or TBA where the organizer allows it. Never fees or offers. */
function LineupRow({ slot }: { slot: LineupSlot }) {
  const c = useTheme();
  if (!slot.djName) {
    return (
      <View style={[styles.lineupRow, { borderColor: c.border, backgroundColor: c.card }]}>
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
  return (
    <View style={[styles.lineupRow, { borderColor: c.border, backgroundColor: c.card }]}>
      <Avatar source={slot.djPhoto} initials={slot.djName.slice(0, 2)} size={56} accessibilityLabel={slot.djName} />
      <View style={styles.flex}>
        <Text variant="cardTitle">{slot.djName}</Text>
        <Text variant="secondary" tone="muted" numberOfLines={2}>
          {[slot.genres, slot.setTime].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {slot.tier ? <TierPill tier={slot.tier} /> : null}
    </View>
  );
}

export default function EventScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const e = event.data;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {e ? <Image source={e.cover} style={styles.cover} contentFit="cover" accessibilityLabel={`${e.name} cover`} /> : <View style={[styles.cover, { backgroundColor: c.muted }]} />}
        <View style={[styles.body, { backgroundColor: c.background }]}>
          {event.isPending ? <LoadingRows count={2} label="Loading event" /> : null}
          {event.isError ? <ErrorState title="Couldn’t load this event" onRetry={() => event.refetch()} /> : null}
          {event.isSuccess && !e ? (
            <ErrorState title="This event isn’t available" detail="It may have ended or been removed by the organizer." />
          ) : null}
          {e ? (
            <>
              <View style={styles.titleBlock}>
                <Text variant="display" accessibilityRole="header" style={styles.title}>
                  {e.name}
                </Text>
                <Text variant="bodyStrong" tone="brand">
                  {e.communityName} · {e.city}
                </Text>
              </View>
              <View style={styles.tags}>
                <InfoTag icon={<CalendarDays size={15} color={c.foreground} strokeWidth={2} />} label={formatEventDate(e.startsAt, e.timeZone)} />
                <InfoTag icon={<Clock size={15} color={c.foreground} strokeWidth={2} />} label={formatEventRange(e.startsAt, e.endsAt, e.timeZone)} />
                <InfoTag icon={<MapPin size={15} color={c.foreground} strokeWidth={2} />} label={e.neighborhood} />
              </View>
              <Text tone="muted">{e.description}</Text>
              {e.publicLineup.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.lineupHead}>
                    <Text variant="title" accessibilityRole="header">
                      Lineup
                    </Text>
                    <Text variant="helper" tone="muted">
                      via Gelatin
                    </Text>
                  </View>
                  {e.publicLineup.map((slot, i) => (
                    <LineupRow key={`${slot.djName ?? 'tba'}-${i}`} slot={slot} />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + space.sm }]}>
        <IconButton accessibilityLabel="Back" variant="scrim" icon={<ArrowLeft size={18} color="#FFFFFF" strokeWidth={2} />} onPress={back} />
        {e ? (
          <IconButton
            accessibilityLabel={`Share ${e.name}`}
            variant="scrim"
            icon={<ShareIcon size={18} color="#FFFFFF" strokeWidth={2} />}
            onPress={() => Share.share({ message: `${e.name} on Memberly: memberly://event/${e.id}` })}
          />
        ) : null}
      </View>

      {e ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: c.background, borderColor: c.border }]}>
          <View style={styles.flex}>
            {e.viewerHasPass ? (
              <>
                <Text variant="title">You have a pass</Text>
                <Text variant="helper" tone="muted">
                  Show your Memberly Card at the door
                </Text>
              </>
            ) : (
              <>
                <Text variant="headline">{e.priceLabel.replace('From ', '')}</Text>
                <Text variant="helper" tone="muted">
                  {e.priceLabel.startsWith('From') ? 'General pass · members free' : 'Members only'}
                </Text>
              </>
            )}
          </View>
          <Button
            label={e.viewerHasPass ? 'Show card' : 'Get a pass'}
            onPress={() =>
              e.viewerHasPass
                ? router.push('/card')
                : router.push({ pathname: '/later', params: { title: 'Get a pass', milestone: '4' } })
            }
            style={styles.cta}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  cover: { width: '100%', height: COVER },
  body: {
    marginTop: -radius.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.gutter,
    paddingTop: 22,
    gap: 18,
  },
  titleBlock: { gap: 4 },
  title: { fontSize: 30, lineHeight: 33 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: { gap: space.stack },
  lineupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  lineupRow: { flexDirection: 'row', alignItems: 'center', gap: space.row, borderWidth: 1, borderRadius: radius.card, padding: 10 },
  tba: { width: 56, height: 56, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: space.row,
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
  },
  cta: { paddingHorizontal: 24 },
});
