import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Chip, ErrorState, LoadingRows, Pill, PillButton, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useCommunityMembers, useOrganizedCommunities } from '@/data/RepositoryProvider';
import type { CommunityMember } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

export const PAST_DUE_LABEL = 'Payment failed';
export const ONLY_YOU_TITLE = 'Just you so far';
export const ONLY_YOU_LINE = 'Share your page or send an announcement from Marketing to bring people in.';
export const noMatchLine = (q: string) => (q ? `No members match “${q}”.` : 'No members on this tier yet.');

const count = (n: number) => n.toLocaleString('en-US');

function useDebounced(value: string, ms = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

function MemberRow({ member }: { member: CommunityMember }) {
  const c = useTheme();
  return (
    <View
      testID={`member-${member.id}`}
      accessible
      accessibilityLabel={[member.name, member.isYou ? 'you' : null, member.tier, member.joinedLabel, member.status === 'past_due' ? PAST_DUE_LABEL : null]
        .filter(Boolean)
        .join(', ')}
      style={[styles.row, { borderBottomColor: c.border }]}>
      <Avatar source={member.photo ?? undefined} initials={member.initials} size={40} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {member.name}
          {member.isYou ? (
            <Text variant="secondary" tone="muted">
              {'  You'}
            </Text>
          ) : null}
        </Text>
        <Text variant="secondary" tone="muted" numberOfLines={1}>
          {member.tier} · {member.joinedLabel}
        </Text>
      </View>
      {member.status === 'past_due' ? <Pill label={PAST_DUE_LABEL} tone="warning" /> : null}
    </View>
  );
}

/**
 * Manage → Members: everyone in the community, newest first, searchable by
 * name and filtered by tier. A failed renewal is flagged on the row.
 */
export function MembersScreen({ communityId }: { communityId: string }) {
  const community = useOrganizedCommunities().data?.find((x) => x.id === communityId);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<string | null>(null);
  const query = useDebounced(search);
  const members = useCommunityMembers(communityId, query, tier);
  const first = members.data?.pages[0];
  const list = members.data?.pages.flatMap((p) => p.members) ?? [];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/manage'));
  const onlyYou = !!first && first.total <= 1 && !query && !tier;

  return (
    <Screen
      testID="members"
      header={
        <ScreenHeader
          title="Members"
          subtitle={first ? `${community?.name ?? 'Your community'} · ${count(first.total)} ${first.total === 1 ? 'member' : 'members'}` : community?.name}
          onBack={back}
        />
      }>
      {members.isPending ? <LoadingRows count={5} label="Loading members" /> : null}
      {members.isError && !first ? <ErrorState title="Couldn’t load members" onRetry={() => members.refetch()} /> : null}

      {onlyYou ? (
        <Card style={styles.empty} testID="members-only-you">
          <Text variant="cardTitle" align="center">
            {ONLY_YOU_TITLE}
          </Text>
          <Text variant="secondary" tone="muted" align="center">
            {ONLY_YOU_LINE}
          </Text>
          <Button label="Open Marketing" variant="secondary" onPress={() => router.push({ pathname: '/organizer/communities/[id]/marketing', params: { id: communityId } })} />
        </Card>
      ) : null}

      {first && !onlyYou ? (
        <>
          <TextField
            testID="members-search"
            label="Search members"
            hideLabel
            value={search}
            placeholder="Search by name"
            autoCorrect={false}
            returnKeyType="search"
            onChangeText={setSearch}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips} accessibilityRole="radiogroup">
            <Chip testID="members-tier-all" label={`All · ${count(first.total)}`} selected={!tier} onPress={() => setTier(null)} />
            {first.tiers.map((t) => (
              <Chip key={t.name} testID={`members-tier-${t.name}`} label={`${t.name} · ${count(t.count)}`} selected={tier === t.name} onPress={() => setTier(t.name)} />
            ))}
          </ScrollView>
          {query || tier ? (
            <Text variant="helper" tone="muted" testID="members-matching">
              {first.matching === 0 ? noMatchLine(query) : `${count(first.matching)} ${first.matching === 1 ? 'match' : 'matches'}`}
            </Text>
          ) : null}
          <View>
            {list.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </View>
          {members.hasNextPage ? (
            <PillButton
              testID="members-more"
              label={members.isFetchingNextPage ? 'Loading…' : 'Show more'}
              onPress={() => members.fetchNextPage()}
              style={styles.more}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingVertical: space.stack, borderBottomWidth: StyleSheet.hairlineWidth },
  empty: { gap: space.sm, paddingVertical: space.gutter },
  bleed: { marginHorizontal: -space.gutter },
  chips: { gap: space.sm, paddingHorizontal: space.gutter },
  more: { alignSelf: 'center' },
});
