import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ExternalLink, Link2, Megaphone, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ErrorState, LoadingRows, Notice, PillButton, Screen, ScreenHeader, SectionHeader, Text, TextField } from '@/components/ui';
import { queryKeys, useCommunityMarketing, useCommunityMembers, useOrganizedCommunities, useRepository } from '@/data/RepositoryProvider';
import type { Announcement } from '@/data/types';
import { newClientId } from '@/lib/clientId';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

export const ANNOUNCEMENT_MAX = 500;
export const SENT_NOTICE = 'Sent. Members get it as a notification and an email.';
export const SEND_FAILED = 'Couldn’t send the announcement. Nothing went out; try again.';
export const NO_ANNOUNCEMENTS = 'Nothing sent yet. Announcements show here with who they reached.';
export const NO_MEMBERS_TO_MESSAGE = 'Once people join, you can message them here.';
const count = (n: number) => n.toLocaleString('en-US');
export const sendLabel = (n: number) => `Send to ${count(n)} ${n === 1 ? 'member' : 'members'}`;

function AnnouncementCard({ a }: { a: Announcement }) {
  return (
    <Card style={styles.announcement} testID={`announcement-${a.id}`}>
      <Text variant="body">{a.body}</Text>
      <Text variant="helper" tone="muted">
        {a.audienceLabel} · {a.reachLabel} · {a.sentLabel}
      </Text>
    </Card>
  );
}

/**
 * Manage → Marketing: share the community's page, and send an announcement
 * to every member or one tier (push and email). Past announcements list who
 * they reached.
 */
export function MarketingScreen({ communityId }: { communityId: string }) {
  const c = useTheme();
  const repo = useRepository();
  const qc = useQueryClient();
  const community = useOrganizedCommunities().data?.find((x) => x.id === communityId);
  const marketing = useCommunityMarketing(communityId);
  const members = useCommunityMembers(communityId, '', null);
  const roster = members.data?.pages[0];
  const [tier, setTier] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [key, setKey] = useState(() => newClientId('announcement'));
  const [sent, setSent] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/manage'));

  // Everyone but the organizer, or one tier.
  const reach = roster ? (tier ? (roster.tiers.find((t) => t.name === tier)?.count ?? 0) : Math.max(0, roster.total - 1)) : 0;
  const send = useMutation({
    mutationFn: () => repo.sendAnnouncement(communityId, { body, tier, idempotencyKey: key }),
    onSuccess: async () => {
      setBody('');
      setSent(true);
      setKey(newClientId('announcement'));
      await qc.invalidateQueries({ queryKey: queryKeys.marketing(communityId) });
    },
  });
  const confirmSend = () =>
    Alert.alert(`${sendLabel(reach)}?`, 'They get it as a notification and an email. It can’t be unsent.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => send.mutate() },
    ]);

  const m = marketing.data;
  const share = () => m && Share.share({ message: `Join ${community?.name ?? 'us'} on Memberly: ${m.pageUrl}`, url: m.pageUrl });

  return (
    <Screen testID="marketing" header={<ScreenHeader title="Marketing" subtitle={community?.name} onBack={back} />}>
      {marketing.isPending ? <LoadingRows count={3} label="Loading marketing" /> : null}
      {marketing.isError ? <ErrorState title="Couldn’t load marketing" onRetry={() => marketing.refetch()} /> : null}

      {m ? (
        <>
          <View style={styles.section}>
            <SectionHeader title="Your community page" />
            <Card style={styles.page}>
              <View style={styles.linkRow}>
                <Link2 size={16} color={c.brandText} strokeWidth={2} />
                <Text variant="bodyStrong" numberOfLines={1} style={styles.flex} testID="marketing-link">
                  {m.pageUrl.replace('https://', '')}
                </Text>
              </View>
              <Text variant="secondary" tone="muted">
                Anyone with the link can see your events and tiers and join.
              </Text>
              <View style={styles.actions}>
                <PillButton testID="marketing-share" label="Share link" filled icon={<Share2 size={14} color={c.onBrand} strokeWidth={2} />} onPress={share} style={styles.flex} />
                <PillButton
                  label="View page"
                  icon={<ExternalLink size={14} color={c.foreground} strokeWidth={2} />}
                  onPress={() => router.push({ pathname: '/community/[id]', params: { id: communityId } })}
                  style={styles.flex}
                />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Send an announcement" />
            {roster && roster.total <= 1 ? (
              <Notice icon={<Megaphone size={16} color={c.mutedText} strokeWidth={2} />}>{NO_MEMBERS_TO_MESSAGE}</Notice>
            ) : (
              <Card style={styles.compose}>
                <Text variant="secondaryStrong">To</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="radiogroup">
                  <Chip testID="audience-all" label={`All members${roster ? ` · ${count(Math.max(0, roster.total - 1))}` : ''}`} selected={!tier} onPress={() => setTier(null)} />
                  {roster?.tiers.map((t) => (
                    <Chip key={t.name} testID={`audience-${t.name}`} label={`${t.name} · ${count(t.count)}`} selected={tier === t.name} onPress={() => setTier(t.name)} />
                  ))}
                </ScrollView>
                <TextField
                  testID="announcement-body"
                  label="Message"
                  multiline
                  value={body}
                  placeholder="Lineup news, a guest list opening, a change of venue"
                  maxLength={ANNOUNCEMENT_MAX}
                  onChangeText={(text) => {
                    setBody(text);
                    setSent(false);
                  }}
                  helper={body.length >= ANNOUNCEMENT_MAX - 60 ? `${body.length} of ${ANNOUNCEMENT_MAX} characters` : undefined}
                />
                {send.isError ? <Notice tone="error">{SEND_FAILED}</Notice> : null}
                {sent ? <Notice tone="tint">{SENT_NOTICE}</Notice> : null}
                <Button
                  testID="announcement-send"
                  label={body.trim() ? sendLabel(reach) : 'Write a message to send'}
                  disabled={!body.trim() || reach === 0}
                  loading={send.isPending}
                  onPress={confirmSend}
                />
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Sent" />
            {m.announcements.length === 0 ? (
              <Text variant="secondary" tone="muted" testID="announcements-empty">
                {NO_ANNOUNCEMENTS}
              </Text>
            ) : (
              m.announcements.map((a) => <AnnouncementCard key={a.id} a={a} />)
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  section: { gap: space.stack },
  page: { gap: space.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  compose: { gap: space.stack },
  chips: { gap: space.sm },
  announcement: { gap: space.xs },
});
