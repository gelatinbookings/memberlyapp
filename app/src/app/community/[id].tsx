import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, AtSign, BadgeCheck, MapPin, Share as ShareIcon, Users } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorState, IconButton, LoadingRows, Pill, Text } from '@/components/ui';
import { useCommunityPage } from '@/data/RepositoryProvider';
import type { CommunityPage } from '@/data/types';
import { SOCIAL_FIELDS } from '@/features/communities/communityForm';
import { EventRow } from '@/features/events/EventRow';
import { openLater } from '@/features/navigation/later';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

const LOGO = 84;

function members(n: number) {
  return `${n.toLocaleString('en-US')} ${n === 1 ? 'member' : 'members'}`;
}

/** A section of the page: a heading, an optional line, then its content. */
function Section({ title, line, children, testID }: { title: string; line?: string; children: ReactNode; testID?: string }) {
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

/** A tag, read-only: how people find the community in Explore. */
function Tag({ label }: { label: string }) {
  const c = useTheme();
  return (
    <View style={[styles.tag, { borderColor: c.border }]}>
      <Text variant="secondaryStrong">{label}</Text>
    </View>
  );
}

/** One membership tier: its name, the price as the server words it, and what's included. */
function TierCard({ tier, mine }: { tier: CommunityPage['memberships'][number]; mine: boolean }) {
  const c = useTheme();
  return (
    <View
      testID={`community-tier-${tier.id}`}
      style={[styles.tier, { backgroundColor: mine ? c.tint : c.card, borderColor: mine ? c.brandLine : c.border }]}
      accessible
      accessibilityLabel={`${tier.name}, ${tier.price}. ${tier.included}${mine ? '. Your tier' : ''}`}>
      <View style={styles.tierHead}>
        <Text variant="cardTitle" style={styles.flex}>
          {tier.name}
        </Text>
        {mine ? <Pill label="Your tier" tone="success" /> : null}
      </View>
      <Text variant="bodyStrong">{tier.price}</Text>
      {tier.included ? (
        <Text variant="secondary" tone="muted">
          {tier.included}
        </Text>
      ) : null}
    </View>
  );
}

/** A link to the community elsewhere, by network, opening in the browser. */
function LinkRow({ link }: { link: CommunityPage['links'][number] }) {
  const c = useTheme();
  const label = SOCIAL_FIELDS.find((f) => f.key === link.network)?.label ?? link.network;
  const shown = link.url.replace(/^https?:\/\/(www\.)?/, '');
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}, ${shown}`}
      onPress={() => Linking.openURL(link.url)}
      style={({ pressed }) => [styles.linkRow, pressed ? { opacity: 0.7 } : null]}>
      <View style={[styles.tile, { backgroundColor: c.muted }]}>
        <AtSign size={18} color={c.foreground} strokeWidth={2} />
      </View>
      <View style={styles.flex}>
        <Text variant="helper" tone="muted">
          {label}
        </Text>
        <Text variant="bodyStrong" tone="brand" numberOfLines={1}>
          {shown}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * A community's public page (GET /app/communities/:id): what the web's
 * community profile and Settings hold, on the phone. Banner and logo, name,
 * tagline, members and location; About; upcoming events; membership tiers;
 * gallery; tags; links. Joining, or your membership, sits in the bar at the
 * bottom. Reached from an event's "Hosted by" and "Visit community".
 */
export default function CommunityScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const page = useCommunityPage(id);
  const p = page.data;
  const bannerHeight = width / 2;
  const barHeight = insets.top + space.sm + 44 + space.sm;
  const [pastBanner, setPastBanner] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  // Joining is on the web for now: the labelled stop for it.
  const join = () => p && openLater(`Join ${p.community.name}`, 'web');
  const myTier = p?.viewerMembership?.tierLabel.split(' · ')[0];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(ev) => {
          const past = ev.nativeEvent.contentOffset.y > bannerHeight - barHeight;
          if (past !== pastBanner) setPastBanner(past);
        }}>
        {p?.community.cover ? (
          <Image source={p.community.cover} style={{ width, height: bannerHeight }} contentFit="cover" accessibilityLabel={`${p.community.name} banner`} />
        ) : (
          <View style={{ width, height: bannerHeight, backgroundColor: c.muted }} />
        )}
        <View style={[styles.body, { backgroundColor: c.background }]}>
          {page.isPending ? <LoadingRows count={3} label="Loading community" /> : null}
          {page.isError ? <ErrorState title="Couldn’t load this community" onRetry={() => page.refetch()} /> : null}
          {page.isSuccess && !p ? <ErrorState title="This community isn’t available" detail="It may have been removed by its organizer." /> : null}
          {p ? (
            <>
              <View style={styles.identity}>
                <View style={[styles.logo, { backgroundColor: c.muted, borderColor: c.background }]}>
                  {p.community.logo ?? p.community.cover ? (
                    <Image source={(p.community.logo ?? p.community.cover)!} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Text variant="headline">{p.community.name.slice(0, 2).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.nameRow}>
                  <Text variant="display" accessibilityRole="header" style={styles.name}>
                    {p.community.name}
                  </Text>
                  {p.verified ? (
                    <View accessible accessibilityLabel="Verified">
                      <BadgeCheck size={22} color={c.brandText} strokeWidth={2} />
                    </View>
                  ) : null}
                </View>
                {p.community.tagline ? <Text tone="muted">{p.community.tagline}</Text> : null}
                <View style={styles.metaRow}>
                  <View style={styles.meta}>
                    <Users size={15} color={c.mutedText} strokeWidth={2} />
                    <Text variant="secondary" tone="muted">
                      {members(p.community.memberCount)}
                    </Text>
                  </View>
                  <View style={styles.meta}>
                    <MapPin size={15} color={c.mutedText} strokeWidth={2} />
                    <Text variant="secondary" tone="muted">
                      {p.location}
                    </Text>
                  </View>
                </View>
              </View>

              {p.about ? (
                <Section title="About">
                  <Text tone="muted">{p.about}</Text>
                </Section>
              ) : null}

              <Section title="Upcoming events" testID="community-events">
                {p.upcoming.length > 0 ? (
                  p.upcoming.map((e) => (
                    <EventRow key={e.id} event={e} framed showDate onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />
                  ))
                ) : (
                  <Text variant="secondary" tone="muted">
                    No upcoming events yet. New ones show here first.
                  </Text>
                )}
              </Section>

              {p.memberships.length > 0 ? (
                <Section title="Memberships" line={p.joinLine} testID="community-memberships">
                  {p.memberships.map((t) => (
                    <TierCard key={t.id} tier={t} mine={!!myTier && myTier === t.name} />
                  ))}
                </Section>
              ) : null}

              {p.gallery.length > 0 ? (
                <Section title="Gallery" testID="community-gallery">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
                    {p.gallery.map((photo, i) => (
                      <Image key={i} source={photo} style={[styles.photo, { backgroundColor: c.muted }]} contentFit="cover" accessibilityLabel={`Photo ${i + 1} of ${p.gallery.length}`} />
                    ))}
                  </ScrollView>
                </Section>
              ) : null}

              {p.tags.length > 0 ? (
                <Section title="Tags">
                  <View style={styles.tags}>
                    {p.tags.map((t) => (
                      <Tag key={t} label={t} />
                    ))}
                  </View>
                </Section>
              ) : null}

              {p.links.length > 0 ? (
                <Section title="Links" testID="community-links">
                  {p.links.map((l) => (
                    <LinkRow key={l.url} link={l} />
                  ))}
                </Section>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {pastBanner && p ? (
        <View style={[styles.solidBar, { height: barHeight, paddingTop: insets.top, backgroundColor: c.background, borderBottomColor: c.border }]}>
          <Text variant="cardTitle" numberOfLines={1} style={styles.barTitle}>
            {p.community.name}
          </Text>
        </View>
      ) : null}
      <View style={[styles.topBar, { top: insets.top + space.sm }]}>
        <IconButton accessibilityLabel="Back" variant="scrim" icon={<ArrowLeft size={18} color={c.onBrand} strokeWidth={2} />} onPress={back} />
        {p ? (
          <IconButton
            accessibilityLabel={`Share ${p.community.name}`}
            variant="scrim"
            icon={<ShareIcon size={18} color={c.onBrand} strokeWidth={2} />}
            onPress={() => Share.share({ message: `${p.community.name} on Memberly: memberly://community/${p.community.id}` })}
          />
        ) : null}
      </View>

      {p ? (
        <View testID="community-footer" style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: c.background, borderColor: c.border }]}>
          <View style={styles.flex}>
            {p.viewerMembership ? (
              <>
                <Text variant="title">{p.viewerMembership.owner ? 'You run this community' : 'You’re a member'}</Text>
                <Text variant="helper" tone="muted" numberOfLines={1}>
                  {p.viewerMembership.owner ? 'Manage it from Me' : p.viewerMembership.tierLabel}
                </Text>
              </>
            ) : (
              <>
                <Text variant="title">{p.community.name}</Text>
                <Text variant="helper" tone="muted" numberOfLines={1}>
                  {p.joinLine}
                </Text>
              </>
            )}
          </View>
          <Button
            testID="community-cta"
            label={p.viewerMembership ? (p.viewerMembership.owner ? 'Manage' : 'Show my card') : 'Become a member'}
            onPress={() =>
              p.viewerMembership
                ? p.viewerMembership.owner
                  ? router.push({ pathname: '/manage', params: { community: p.community.id } })
                  : router.push('/card')
                : join()
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
  body: {
    marginTop: -radius.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space.gutter,
    paddingTop: 0,
    gap: space.section,
  },
  identity: { gap: space.sm },
  logo: {
    width: LOGO,
    height: LOGO,
    marginTop: -LOGO / 2,
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  name: { flexShrink: 1, fontSize: 30, lineHeight: 34 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: space.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.label },
  section: { gap: space.row, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.section },
  sectionHead: { gap: space.xs },
  tier: { borderWidth: 1, borderRadius: radius.card, padding: space.card, gap: space.xs },
  tierHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  gallery: { gap: space.sm },
  photo: { width: 160, height: 160, borderRadius: radius.notice },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: { minHeight: 36, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.row, minHeight: 52 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
  },
  cta: { paddingHorizontal: 24 },
});
