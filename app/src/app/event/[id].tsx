import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarDays, Clock, DollarSign, MapPin, Share as ShareIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorState, IconButton, LoadingRows, Text } from '@/components/ui';
import { useEvent, usePassTypes } from '@/data/RepositoryProvider';
import type { EventPageDetails, MemberEvent } from '@/data/types';
import { DetailRow, EventBadges, GoingRow, HostCard, HostedBy, MemberPerks, RichText } from '@/features/events/EventPageParts';
import { PublicLineup } from '@/features/events/PublicLineup';
import { openLater } from '@/features/navigation/later';
import { formatEventDate, formatEventRange } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** A section heading on the page, with an optional line under it. */
function Section({ title, line, children, testID }: { title: string; line?: string; children: React.ReactNode; testID?: string }) {
  const c = useTheme();
  return (
    <View testID={testID} style={[styles.section, { borderTopColor: c.border }]}>
      <View style={styles.sectionHead}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {line ? (
          <Text variant="secondary" tone="muted">
            {line}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** The price as the server words it: "Free for members" in the success tone, then the rest. */
function PriceValue({ details }: { details: EventPageDetails }) {
  const [lead, ...rest] = details.price.line.split(' · ');
  const membersFirst = details.access !== 'open';
  return (
    <Text variant="bodyStrong">
      <Text variant="bodyStrong" tone={membersFirst || details.price.free ? 'success' : 'default'}>
        {lead}
      </Text>
      {rest.length ? <Text tone="muted">{` · ${rest.join(' · ')}`}</Text> : null}
    </Text>
  );
}

/** What the pinned bar offers, in order of what the viewer can do. */
function footerOf(e: MemberEvent, d: EventPageDetails | undefined, soldOut: boolean) {
  if (e.viewerHasPass) return { primary: 'Show my pass', disabled: false, join: false } as const;
  if (!d) return { primary: soldOut ? 'Sold out' : 'Get a pass', disabled: soldOut, join: false } as const;
  if (d.sales === 'ended') return { primary: 'Sales ended', disabled: true, join: false } as const;
  // Members only, and not a member yet: joining is the way in.
  if (d.access === 'members-only' && !d.viewerIsMember) return { primary: 'Become a member', disabled: false, join: false } as const;
  if (soldOut) return { primary: 'Sold out', disabled: true, join: !d.viewerIsMember && d.access !== 'open' } as const;
  return { primary: 'Get a pass', disabled: false, join: !d.viewerIsMember && d.access === 'free-for-members' } as const;
}

/**
 * An event's page (GET /app/events/:id): the web's event page carried to the
 * phone. Cover, badges, title and host; the details; the Gelatin lineup;
 * who's going; About; member perks; the host community. The price and the
 * way in sit in a bar pinned to the bottom.
 */
export default function EventScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Past the cover, the back and share buttons get a solid bar with the event's name, so they never sit on text.
  const barHeight = insets.top + space.sm + 44 + space.sm;
  const [pastCover, setPastCover] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const e = event.data;
  const d = e?.details;
  // Sold out only when every pass type is; one left is still "Get a pass".
  const passTypes = usePassTypes(e && !e.viewerHasPass ? e.id : undefined);
  const soldOut = !!passTypes.data && passTypes.data.length > 0 && passTypes.data.every((t) => t.soldOut);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const visitCommunity = () => d && router.push({ pathname: '/community/[id]', params: { id: d.host.communityId } });
  // Joining is on the web for now: the labelled stop for it.
  const join = () => d && openLater(`Join ${d.host.name}`, 'web');
  const getPass = () => e && router.push({ pathname: '/event/[id]/pass', params: { id: e.id } });
  const footer = e ? footerOf(e, d, soldOut) : null;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 180 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(ev) => {
          const past = ev.nativeEvent.contentOffset.y > width - barHeight;
          if (past !== pastCover) setPastCover(past);
        }}>
        {e ? (
          <Image source={e.cover} style={styles.cover} contentFit="cover" accessibilityLabel={`${e.name} cover`} />
        ) : (
          <View style={[styles.cover, { backgroundColor: c.muted }]} />
        )}
        <View style={[styles.body, { backgroundColor: c.background }]}>
          {event.isPending ? <LoadingRows count={2} label="Loading event" /> : null}
          {event.isError ? <ErrorState title="Couldn’t load this event" onRetry={() => event.refetch()} /> : null}
          {event.isSuccess && !e ? (
            <ErrorState title="This event isn’t available" detail="It may have ended or been removed by the organizer." />
          ) : null}
          {e ? (
            <>
              <View style={styles.titleBlock}>
                {d ? <EventBadges category={e.category} details={d} /> : null}
                <Text variant="display" accessibilityRole="header" style={styles.title}>
                  {e.name}
                </Text>
                {d ? (
                  <HostedBy host={d.host} onOpen={visitCommunity} />
                ) : (
                  <Text variant="bodyStrong" tone="brand">
                    {e.communityName} · {e.city}
                  </Text>
                )}
              </View>

              <Section title="Event details" testID="event-details">
                <View>
                  <DetailRow icon={<CalendarDays size={18} color={c.foreground} strokeWidth={2} />} label="Date" value={formatEventDate(e.startsAt, e.timeZone)} />
                  <DetailRow icon={<Clock size={18} color={c.foreground} strokeWidth={2} />} label="Time" value={formatEventRange(e.startsAt, e.endsAt, e.timeZone)} />
                  <DetailRow
                    icon={<MapPin size={18} color={c.foreground} strokeWidth={2} />}
                    label="Location"
                    value={d?.venue.name ?? e.neighborhood}
                    detail={d?.venue.address ?? e.city}
                    onPress={d ? () => Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(`${d.venue.name}, ${d.venue.address}`)}`) : undefined}
                  />
                  {d ? <DetailRow icon={<DollarSign size={18} color={c.foreground} strokeWidth={2} />} label="Price" value={<PriceValue details={d} />} /> : null}
                </View>
              </Section>

              <View style={[styles.lineup, { borderTopColor: c.border }]}>
                <PublicLineup slots={e.publicLineup} testID="event-lineup" />
              </View>

              {d && (d.going.people.length > 0 || d.going.othersCount > 0) ? (
                <Section title="Who’s going">
                  <GoingRow going={d.going} />
                </Section>
              ) : null}

              <Section title="About this event">
                {d ? <RichText paragraphs={d.about} /> : <Text tone="muted">{e.description}</Text>}
              </Section>

              {d && d.memberPerks.length > 0 ? (
                <Section title="Member perks" line={`Included with a ${d.host.name} membership.`} testID="event-perks">
                  <MemberPerks perks={d.memberPerks} />
                </Section>
              ) : null}

              {d ? <HostCard host={d.host} onVisit={visitCommunity} /> : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {pastCover && e ? (
        <View testID="event-top-bar" style={[styles.solidBar, { height: barHeight, paddingTop: insets.top, backgroundColor: c.background, borderBottomColor: c.border }]}>
          <Text variant="cardTitle" numberOfLines={1} style={styles.barTitle}>
            {e.name}
          </Text>
        </View>
      ) : null}
      <View style={[styles.topBar, { top: insets.top + space.sm }]}>
        <IconButton accessibilityLabel="Back" variant="scrim" icon={<ArrowLeft size={18} color={c.onBrand} strokeWidth={2} />} onPress={back} />
        {e ? (
          <IconButton
            accessibilityLabel={`Share ${e.name}`}
            variant="scrim"
            icon={<ShareIcon size={18} color={c.onBrand} strokeWidth={2} />}
            onPress={() => Share.share({ message: `${e.name} on Memberly: memberly://event/${e.id}` })}
          />
        ) : null}
      </View>

      {e && footer ? (
        <View testID="event-footer" style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: c.background, borderColor: c.border }]}>
          <View style={styles.priceRow}>
            {e.viewerHasPass ? (
              <View style={styles.flex}>
                <Text variant="title">You have a pass</Text>
                <Text variant="helper" tone="muted">
                  It’s on your Memberly Card
                </Text>
              </View>
            ) : (
              <View style={styles.flex}>
                <Text variant="headline" tone={d?.price.free ? 'success' : 'default'}>
                  {d?.price.headline ?? e.priceLabel.replace('From ', '')}
                </Text>
                <Text variant="helper" tone="muted" numberOfLines={1}>
                  {d?.price.line ?? (e.priceLabel.startsWith('From') ? 'General pass · members free' : 'Members only')}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.actions}>
            {footer.join ? <Button testID="event-join" label="Become a member" variant="secondary" onPress={join} style={styles.action} /> : null}
            <Button
              testID="event-cta"
              label={footer.primary}
              disabled={footer.disabled}
              onPress={() =>
                e.viewerHasPass ? router.push('/card') : footer.primary === 'Become a member' ? join() : getPass()
              }
              style={styles.action}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: 2 },
  cover: { width: '100%', aspectRatio: 1 },
  body: {
    marginTop: -radius.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.gutter,
    paddingTop: 22,
    gap: space.section,
  },
  titleBlock: { gap: space.stack },
  title: { fontSize: 30, lineHeight: 34 },
  section: { gap: space.row, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.section },
  sectionHead: { gap: space.xs },
  lineup: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.section },
  solidBar: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'center', paddingHorizontal: 72 },
  barTitle: { textAlign: 'center' },
  topBar: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', justifyContent: 'space-between' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: space.row,
    paddingHorizontal: space.gutter,
    gap: space.stack,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
});
