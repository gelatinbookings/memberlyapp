import { router } from 'expo-router';
import { Gift, Link2, Share2, UserPlus, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, ErrorState, GroupedList, LoadingRows, Pill, Screen, ScreenHeader, Text } from '@/components/ui';
import { useReferrals } from '@/data/RepositoryProvider';
import type { ReferredPerson } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

export const REFERRALS_EMPTY = 'No one yet. Share your link, and the people who join with it show up here.';

const shortDate = (iso: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`));

/** One step of how referring works: an icon tile and a line. */
function Step({ icon, title, line }: { icon: ReactNode; title: string; line: string }) {
  const c = useTheme();
  return (
    <View style={styles.step} accessible accessibilityLabel={`${title}. ${line}`}>
      <View style={[styles.tile, { backgroundColor: c.muted }]}>{icon}</View>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="secondary" tone="muted">
          {line}
        </Text>
      </View>
    </View>
  );
}

/** Someone who joined with the viewer's code, and how far they've gone. */
function PersonRow({ person }: { person: ReferredPerson }) {
  const started = person.status === 'started-community';
  const line = started && person.communityName ? `Started ${person.communityName}` : `Joined ${shortDate(person.since)}`;
  return (
    <View style={styles.person} testID={`referral-${person.id}`} accessible accessibilityLabel={`${person.name}, ${line}`}>
      <Avatar initials={person.initials} size={40} />
      <View style={styles.flex}>
        <Text variant="bodyStrong">{person.name}</Text>
        <Text variant="secondary" tone="muted" numberOfLines={2}>
          {line}
        </Text>
      </View>
      <Pill label={started ? 'Community' : 'Joined'} tone={started ? 'success' : 'held'} />
    </View>
  );
}

/**
 * Referrals (Me → Referrals): the viewer's code and link to share, how it
 * works, and the people who joined with it. Rewards and amounts aren't shown
 * until the program's terms are settled.
 */
export default function ReferralsScreen() {
  const c = useTheme();
  const referrals = useReferrals();
  const r = referrals.data;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/me'));
  const share = () =>
    r && Share.share({ message: `Join me on Memberly. Use my code ${r.code} when you sign up: ${r.link}`, url: r.link });
  const joined = r?.people.length ?? 0;

  return (
    <Screen header={<ScreenHeader title="Referrals" subtitle="Bring people to Memberly" onBack={back} />} testID="referrals">
      {referrals.isPending ? <LoadingRows count={3} label="Loading referrals" /> : null}
      {referrals.isError ? <ErrorState title="Couldn’t load your referrals" onRetry={() => referrals.refetch()} /> : null}
      {r ? (
        <>
          <Card>
            <View style={styles.codeCard}>
              <Text variant="secondary" tone="muted">
                Your referral code
              </Text>
              <Text variant="display" testID="referral-code" selectable accessibilityLabel={`Your referral code, ${r.code.split('').join(' ')}`}>
                {r.code}
              </Text>
              <View style={styles.linkRow}>
                <Link2 size={15} color={c.mutedText} strokeWidth={2} />
                <Text variant="secondary" tone="brand" numberOfLines={1} selectable style={styles.flex}>
                  {r.link.replace(/^https:\/\//, '')}
                </Text>
              </View>
              <Button
                testID="referral-share"
                label="Share your link"
                icon={<Share2 size={18} color={c.onBrand} strokeWidth={2} />}
                onPress={share}
              />
            </View>
          </Card>

          <View style={styles.block}>
            <Text variant="title" accessibilityRole="header">
              How it works
            </Text>
            <GroupedList>
              <Step icon={<Share2 size={18} color={c.foreground} strokeWidth={2} />} title="Share your link" line="Send it to friends, post it, or put it in your bio." />
              <Step
                icon={<UserPlus size={18} color={c.foreground} strokeWidth={2} />}
                title="They join with your code"
                line="Your code comes with the link, or they can type it when they sign up or create a community."
              />
              <Step icon={<Gift size={18} color={c.foreground} strokeWidth={2} />} title="You see them here" line="Everyone who joins with your code shows up below." />
            </GroupedList>
          </View>

          <View style={styles.block} testID="referrals-people">
            <View style={styles.head}>
              <Text variant="title" accessibilityRole="header">
                Your referrals
              </Text>
              {joined > 0 ? (
                <View style={styles.count}>
                  <Users size={15} color={c.mutedText} strokeWidth={2} />
                  <Text variant="secondary" tone="muted">
                    {`${joined} joined`}
                  </Text>
                </View>
              ) : null}
            </View>
            {joined > 0 ? (
              <GroupedList>
                {r.people.map((p) => (
                  <PersonRow key={p.id} person={p} />
                ))}
              </GroupedList>
            ) : (
              <Text variant="secondary" tone="muted">
                {REFERRALS_EMPTY}
              </Text>
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  codeCard: { gap: space.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: space.label, marginBottom: space.sm },
  block: { gap: space.row },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { flexDirection: 'row', alignItems: 'center', gap: space.label },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingHorizontal: 14, paddingVertical: 13, minHeight: 44 },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingHorizontal: 14, paddingVertical: 12 },
});
