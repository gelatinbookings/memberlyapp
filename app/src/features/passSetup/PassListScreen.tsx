import { router } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, ErrorState, LoadingRows, Notice, Pill, PillButton, Screen, ScreenHeader, Text } from '@/components/ui';
import { useCommunityPasses, useOrganizedCommunities, useOrganizerEvent, useOrganizerEventPasses } from '@/data/RepositoryProvider';
import type { OrganizerPass } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { STRIPE_NOTICE, passHolders, passPriceText, passesSummary, type PassScope } from './passForm';
import { editPassHref, newPassHref } from './routes';

export const NO_PASSES_TITLE = 'No passes yet';
export const NO_COMMUNITY_PASSES_LINE = 'Add a membership so people can join. It can be free or monthly.';
export const NO_EVENT_PASSES_LINE = 'Add a pass so people can get in. It can be free or paid.';
export const WAITING_ON_STRIPE = 'Not on sale until Stripe is connected';
export const STRIPE_LIST_DETAIL = 'Your paid passes are saved and go on sale once it’s connected.';

/** Connect Stripe is on the web until it has its own issue. */
/** Stripe onboarding for the community's payouts (Stripe Connect, Express). */
export function openConnectStripe(communityId: string | undefined) {
  if (!communityId) return;
  router.push({ pathname: '/organizer/communities/[id]/stripe', params: { id: communityId } });
}

function PassRow({ pass, onPress }: { pass: OrganizerPass; onPress: () => void }) {
  const c = useTheme();
  const price = passPriceText(pass);
  const holders = passHolders(pass);
  const waiting = pass.active && !pass.sellable;
  return (
    <Pressable
      testID={`pass-row-${pass.id}`}
      accessibilityRole="button"
      accessibilityLabel={[pass.name, price, holders, pass.active ? null : 'Off', waiting ? WAITING_ON_STRIPE : null].filter(Boolean).join(', ')}
      accessibilityHint="Edit this pass"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: c.border, backgroundColor: pressed ? c.muted : c.card }]}>
      <View style={styles.rowText}>
        <View style={styles.titleLine}>
          <Text variant="cardTitle" numberOfLines={1} style={styles.shrink}>
            {pass.name}
          </Text>
          {pass.active ? null : <Pill label="Off" tone="neutral" />}
        </View>
        <Text variant="secondary" tone="muted" numberOfLines={1}>
          {price} · {holders}
        </Text>
        {pass.included ? (
          <Text variant="helper" tone="muted" numberOfLines={1}>
            {pass.included}
          </Text>
        ) : null}
        {waiting ? (
          <Text variant="helper" tone="warning" numberOfLines={1}>
            {WAITING_ON_STRIPE}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />
    </Pressable>
  );
}

/**
 * A community's passes (Manage → Tiers) or an event's (Create New Event →
 * Access & passes): each pass with its price and who holds it, and Add pass.
 */
export function PassListScreen({ scope, parentId }: { scope: PassScope; parentId: string }) {
  const c = useTheme();
  const community = scope === 'community';
  const organized = useOrganizedCommunities();
  const event = useOrganizerEvent(community ? undefined : parentId);
  const communityPasses = useCommunityPasses(community ? parentId : undefined);
  const eventPasses = useOrganizerEventPasses(community ? undefined : parentId);
  const list = community ? communityPasses : eventPasses;
  const parentName = community ? organized.data?.find((x) => x.id === parentId)?.name : event.data?.name;
  const passes = list.data ?? [];
  const summary = passesSummary(passes);
  const waiting = passes.some((p) => p.active && !p.sellable);
  const add = () => router.push(newPassHref(scope, parentId));

  return (
    <Screen
      header={
        <ScreenHeader
          title={community ? 'Tiers' : 'Access & passes'}
          subtitle={parentName}
          right={
            passes.length > 0 ? (
              <PillButton testID="passes-add" label="Add pass" filled icon={<Plus size={14} color={c.onBrand} strokeWidth={2.5} />} onPress={add} />
            ) : undefined
          }
        />
      }
      testID={community ? 'community-passes' : 'event-passes'}>
      {/* An event's passes in one line, as Create New Event shows them: "2 passes · from $30". */}
      {!community && summary ? (
        <Text variant="secondary" tone="muted" testID="passes-summary">
          {summary}
        </Text>
      ) : null}
      {list.isPending ? <LoadingRows count={2} label="Loading passes" /> : null}
      {list.isError ? <ErrorState title="Couldn’t load passes" onRetry={() => list.refetch()} /> : null}

      {waiting ? (
        <View style={styles.block} testID="passes-stripe">
          <Notice tone="warning" title={STRIPE_NOTICE}>
            {STRIPE_LIST_DETAIL}
          </Notice>
          <PillButton
            testID="passes-connect-stripe"
            label="Connect Stripe"
            onPress={() => openConnectStripe(community ? parentId : event.data?.communityId)}
            style={styles.start}
          />
        </View>
      ) : null}

      {list.isSuccess && passes.length === 0 ? (
        <Card testID="passes-empty" style={styles.empty}>
          <View style={styles.emptyText}>
            <Text variant="cardTitle" align="center">
              {NO_PASSES_TITLE}
            </Text>
            <Text variant="secondary" tone="muted" align="center">
              {community ? NO_COMMUNITY_PASSES_LINE : NO_EVENT_PASSES_LINE}
            </Text>
          </View>
          <Button testID="passes-add-first" label="Add pass" icon={<Plus size={18} color={c.onBrand} strokeWidth={2} />} onPress={add} />
        </Card>
      ) : null}

      {passes.length > 0 ? (
        <View style={styles.list}>
          {passes.map((p) => (
            <PassRow key={p.id} pass={p} onPress={() => router.push(editPassHref(scope, parentId, p.id))} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  start: { alignSelf: 'flex-start' },
  list: { gap: space.stack },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, borderWidth: 1, borderRadius: radius.card, padding: space.card },
  rowText: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  shrink: { flexShrink: 1 },
  empty: { gap: space.card, paddingVertical: space.gutter },
  emptyText: { gap: space.xs, paddingHorizontal: space.sm },
});
