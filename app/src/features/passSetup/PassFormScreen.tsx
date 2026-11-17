import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ErrorState, LoadingRows, Notice, Screen, ScreenHeader, Text, TextField, Toggle } from '@/components/ui';
import { isRepositoryError } from '@/data/errors';
import {
  refreshAfterPassSetup,
  useCommunityPasses,
  useOrganizedCommunities,
  useOrganizerEvent,
  useOrganizerEventPasses,
  useRepository,
} from '@/data/RepositoryProvider';
import type { OrganizerPass } from '@/data/types';
import { sanitizeDollars } from '@/features/booking/offers';
import { newClientId } from '@/lib/clientId';
import { space } from '@/theme/tokens';

import {
  DELETE_FAILED,
  draftOf,
  EMPTY_PASS,
  heldLine,
  limitOf,
  PASS_INCLUDED_MAX,
  PASS_NAME_MAX,
  passBlocker,
  priceOf,
  PARENT_UNAVAILABLE_DETAIL,
  PARENT_UNAVAILABLE_TITLE,
  SAVE_FAILED,
  STRIPE_NOTICE,
  type PassDraft,
  type PassScope,
} from './passForm';
import { QuantityStepper } from './QuantityStepper';
import { passListHref } from './routes';

export const STRIPE_NOTICE_DETAIL = 'It’s saved, and goes on sale once Stripe is connected.';

const goBack = (scope: PassScope, parentId: string) => (router.canGoBack() ? router.back() : router.replace(passListHref(scope, parentId)));

function SwitchRow({
  title,
  line,
  value,
  onValueChange,
  testID,
}: {
  title: string;
  line: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  testID?: string;
}) {
  return (
    <Card style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text variant="cardTitle">{title}</Text>
        <Text variant="secondary" tone="muted">
          {line}
        </Text>
      </View>
      <Toggle testID={testID} accessibilityLabel={title} value={value} onValueChange={onValueChange} />
    </Card>
  );
}

function PassForm({
  scope,
  parentId,
  parentName,
  pass,
  onBack,
}: {
  scope: PassScope;
  parentId: string;
  parentName: string | undefined;
  /** The pass being edited; none for a new one. */
  pass?: OrganizerPass;
  onBack?: () => void;
}) {
  const repo = useRepository();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<PassDraft>(() => (pass ? draftOf(pass) : EMPTY_PASS));
  const [active, setActive] = useState(pass?.active ?? true);
  // One key for this visit: saving again after a lost answer is the same pass.
  const [key] = useState(() => newClientId('pass'));
  const set = (patch: Partial<PassDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const community = scope === 'community';
  const back = onBack ?? (() => goBack(scope, parentId));

  const save = useMutation({
    mutationFn: () => {
      const name = draft.name.trim();
      const included = draft.included.trim();
      const price = priceOf(draft);
      const limit = limitOf(draft);
      if (pass) return repo.updatePass(pass.id, { name, priceCents: price, included, limit, freeForMembers: draft.freeForMembers, active });
      return community
        ? repo.createCommunityPass(parentId, { name, monthlyPriceCents: price, included, memberLimit: limit, idempotencyKey: key })
        : repo.createEventPass(parentId, { name, priceCents: price, included, quantity: limit, freeForMembers: draft.freeForMembers, idempotencyKey: key });
    },
    onSuccess: async (saved) => {
      await refreshAfterPassSetup(qc, saved);
      if (pass) goBack(scope, parentId);
      // A new pass lands on its list, where it now is.
      else router.dismissTo(passListHref(scope, parentId));
    },
  });

  const remove = useMutation({
    mutationFn: () => repo.deletePass(pass?.id ?? ''),
    onSuccess: async () => {
      await refreshAfterPassSetup(qc, { communityId: pass?.communityId ?? '', eventId: pass?.eventId ?? null });
      goBack(scope, parentId);
    },
    // Someone got the pass since this screen loaded: read it again, so the screen says it is held.
    onError: () => refreshAfterPassSetup(qc, { communityId: pass?.communityId ?? '', eventId: pass?.eventId ?? null }),
  });

  const confirmDelete = () =>
    Alert.alert(`Delete ${pass?.name ?? 'this pass'}?`, 'No one holds it, so nothing is lost. This can’t be undone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
    ]);

  const blocker = passBlocker(draft, scope);
  const busy = save.isPending || remove.isPending;
  // The server doesn't know the event or community for this account: saving again won't help.
  const gone = isRepositoryError(save.error, 'not_found');
  const held = (pass?.heldCount ?? 0) > 0 || isRepositoryError(remove.error, 'pass_held');
  const waitingOnStripe = !!pass && !pass.sellable && draft.paid;

  return (
    <Screen
      header={<ScreenHeader title={pass ? 'Edit pass' : community ? 'Community pass' : 'Event pass'} subtitle={parentName} onBack={busy ? () => undefined : back} />}
      testID="pass-form"
      footer={
        <>
          {save.isError ? <Notice tone="error">{gone ? PARENT_UNAVAILABLE_DETAIL[scope] : SAVE_FAILED}</Notice> : null}
          <Button
            testID="pass-save"
            label={blocker ?? (save.isError && !gone ? 'Try again' : 'Save')}
            disabled={!!blocker || remove.isPending || gone}
            loading={save.isPending}
            onPress={() => save.mutate()}
          />
        </>
      }>
      {waitingOnStripe ? (
        <Notice tone="warning" title={STRIPE_NOTICE}>
          {STRIPE_NOTICE_DETAIL}
        </Notice>
      ) : null}

      <TextField
        testID="pass-name"
        label="Pass name"
        value={draft.name}
        placeholder={community ? 'Member' : 'General admission'}
        maxLength={PASS_NAME_MAX}
        autoCapitalize="sentences"
        returnKeyType="done"
        onChangeText={(name) => set({ name })}
      />

      <View style={styles.block}>
        <Text variant="secondaryStrong">Price</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          <Chip testID="pass-free" label="Free" selected={!draft.paid} onPress={() => set({ paid: false })} style={styles.chip} />
          <Chip testID="pass-paid" label={community ? 'Monthly' : 'Paid'} selected={draft.paid} onPress={() => set({ paid: true })} style={styles.chip} />
        </View>
        {draft.paid ? (
          <TextField
            testID="pass-price"
            label={community ? 'Monthly price' : 'Pass price'}
            hideLabel
            value={draft.price}
            prefix="$"
            money
            placeholder="0"
            keyboardType="number-pad"
            helper={community ? 'Whole dollars, each month.' : 'Whole dollars.'}
            onChangeText={(price) => set({ price: sanitizeDollars(price) })}
          />
        ) : null}
      </View>

      <TextField
        testID="pass-included"
        label="What’s included"
        value={draft.included}
        placeholder={community ? 'One line, like priority entry' : 'One line, like entry all night'}
        maxLength={PASS_INCLUDED_MAX}
        returnKeyType="done"
        onChangeText={(included) => set({ included })}
      />
      <QuantityStepper
        testID="pass-limit"
        label={community ? 'Member limit' : 'Quantity'}
        value={draft.limit}
        onChange={(limit) => set({ limit })}
      />

      {community ? null : (
        <SwitchRow
          testID="pass-free-for-members"
          title="Free for members"
          line="Members of your community get this pass at no cost."
          value={draft.freeForMembers}
          onValueChange={(freeForMembers) => set({ freeForMembers })}
        />
      )}

      {pass ? (
        <>
          <SwitchRow
            testID="pass-active"
            title="On sale"
            line={active ? 'Turn off to stop offering this pass.' : 'Off. No one new can get it; people who hold it keep it.'}
            value={active}
            onValueChange={setActive}
          />
          {held ? (
            <Text variant="helper" tone="muted" testID="pass-held">
              {heldLine({ heldCount: Math.max(pass.heldCount, 1), scope })}
            </Text>
          ) : (
            <>
              {remove.isError ? <Notice tone="error">{DELETE_FAILED}</Notice> : null}
              <Button testID="pass-delete" label="Delete pass" variant="secondary" loading={remove.isPending} disabled={save.isPending} onPress={confirmDelete} />
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

/**
 * Add or edit a pass (GEL-1057) for a community (a membership, free or
 * monthly) or an event (free or a price). The price is whole dollars and is
 * sent as integer cents; the app adds nothing to it.
 */
export function PassFormScreen({
  scope,
  parentId,
  passId,
  onBack,
}: {
  scope: PassScope;
  /** The community or the event the pass belongs to. */
  parentId: string;
  /** Edit this pass; leave out for a new one. */
  passId?: string;
  onBack?: () => void;
}) {
  const organized = useOrganizedCommunities();
  const event = useOrganizerEvent(scope === 'event' ? parentId : undefined);
  const communityPasses = useCommunityPasses(scope === 'community' && passId ? parentId : undefined);
  const eventPasses = useOrganizerEventPasses(scope === 'event' && passId ? parentId : undefined);
  const list = scope === 'community' ? communityPasses : eventPasses;
  const parentName = scope === 'community' ? organized.data?.find((c) => c.id === parentId)?.name : event.data?.name;

  // Only someone who runs the event or community can add to it: check before showing a form that can't save.
  const parent = scope === 'community' ? organized : event;
  const parentMissing = scope === 'community' ? organized.isSuccess && !parentName : event.isSuccess && !event.data;
  if (parent.isPending || parent.isError || parentMissing) {
    return (
      <Screen header={<ScreenHeader title={passId ? 'Edit pass' : scope === 'community' ? 'Community pass' : 'Event pass'} onBack={onBack} />}>
        {parent.isPending ? <LoadingRows count={3} label="Loading" /> : null}
        {parent.isError ? <ErrorState title="Couldn’t load this pass" onRetry={() => parent.refetch()} /> : null}
        {parentMissing ? <ErrorState title={PARENT_UNAVAILABLE_TITLE} detail={PARENT_UNAVAILABLE_DETAIL[scope]} /> : null}
      </Screen>
    );
  }

  if (passId) {
    const pass = list.data?.find((p) => p.id === passId);
    if (!pass) {
      return (
        <Screen header={<ScreenHeader title="Edit pass" subtitle={parentName} onBack={onBack} />}>
          {list.isPending ? (
            <LoadingRows count={3} label="Loading the pass" />
          ) : list.isError ? (
            <ErrorState title="Couldn’t load this pass" onRetry={() => list.refetch()} />
          ) : (
            <ErrorState title="This pass isn’t available" detail="It may have been deleted." />
          )}
        </Screen>
      );
    }
    return <PassForm key={pass.id} scope={scope} parentId={parentId} parentName={parentName} pass={pass} onBack={onBack} />;
  }
  return <PassForm scope={scope} parentId={parentId} parentName={parentName} onBack={onBack} />;
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  chips: { flexDirection: 'row', gap: space.sm },
  chip: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  switchText: { flex: 1, gap: 2 },
});
