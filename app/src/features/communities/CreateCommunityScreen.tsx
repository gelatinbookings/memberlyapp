import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, Notice, PillButton, Screen, ScreenHeader, SelectField, Text, TextField } from '@/components/ui';
import { refreshAfterCommunity, useRepository } from '@/data/RepositoryProvider';
import { sanitizeDollars } from '@/features/booking/offers';
import { newClientId } from '@/lib/clientId';
import { pickCoverPhoto } from '@/lib/photos';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { ChoiceCard } from './ChoiceCard';
import { CitySheet } from './CitySheet';
import {
  COMMUNITY_DESCRIPTION_MAX,
  COMMUNITY_NAME_MAX,
  COMMUNITY_TYPE_OPTIONS,
  COVER_FAILED,
  CREATE_FAILED,
  DESCRIPTION_COUNTER_FROM,
  detailsBlocker,
  EMPTY_COMMUNITY,
  hasEntries,
  pricingBlocker,
  STEP_TITLES,
  STRIPE_HELPER,
  toCreateInput,
  type CommunityDraft,
} from './communityForm';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/me'));

/** The two steps under the header, each a bar with its name; the current one and the one done are purple. */
function StepBar({ step }: { step: 0 | 1 }) {
  const c = useTheme();
  return (
    <View style={styles.steps} accessible accessibilityLabel={`Step ${step + 1} of 2, ${STEP_TITLES[step]}`}>
      {STEP_TITLES.map((title, i) => (
        <View key={title} style={styles.step}>
          <View style={[styles.stepBar, { backgroundColor: i <= step ? c.brand : c.muted }]} />
          <Text variant="helper" tone={i === step ? 'brand' : 'muted'} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Create community (GEL-1056): Community details, then Membership pricing.
 * One screen holds both steps, so going back keeps what was entered. Creating
 * carries a key made here, so a retry after a lost answer makes one community.
 */
export function CreateCommunityScreen() {
  const c = useTheme();
  const repo = useRepository();
  const qc = useQueryClient();
  const [step, setStep] = useState<0 | 1>(0);
  const [draft, setDraft] = useState<CommunityDraft>(EMPTY_COMMUNITY);
  const [citySheet, setCitySheet] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  // One key for this visit: trying again is the same request.
  const [key] = useState(() => newClientId('community'));
  const set = (patch: Partial<CommunityDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const create = useMutation({
    mutationFn: () => repo.createCommunity(toCreateInput(draft, key)),
    onSuccess: async ({ community }) => {
      // The viewer runs a community now: who they are and what they run are read again before Manage opens.
      await refreshAfterCommunity(qc);
      router.dismissTo({ pathname: '/manage', params: { community: community.id } });
    },
  });

  const close = () => {
    if (!hasEntries(draft)) return leave();
    Alert.alert('Discard this community?', 'What you’ve entered won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: leave },
    ]);
  };

  const chooseCover = async () => {
    setCoverFailed(false);
    try {
      const photo = await pickCoverPhoto();
      if (photo) set({ cover: photo });
    } catch {
      setCoverFailed(true);
    }
  };

  if (step === 0) {
    const blocker = detailsBlocker(draft);
    const left = COMMUNITY_DESCRIPTION_MAX - draft.description.length;
    return (
      <Screen
        key="details"
        testID="community-details"
        footer={<Button testID="community-continue" label={blocker ?? 'Continue'} disabled={!!blocker} onPress={() => setStep(1)} />}>
        <ScreenHeader title={STEP_TITLES[0]} subtitle="Create community" onBack={close} />
        <StepBar step={0} />

        <View style={styles.block}>
          <Text variant="secondaryStrong">Cover photo</Text>
          <Pressable
            testID="community-cover"
            accessibilityRole="button"
            accessibilityLabel={draft.cover ? 'Cover photo. Change photo' : 'Add a cover photo, optional'}
            onPress={chooseCover}
            style={({ pressed }) => [styles.cover, { backgroundColor: c.muted, borderColor: c.border }, pressed ? { opacity: 0.85 } : null]}>
            {draft.cover ? (
              <Image source={draft.cover} style={StyleSheet.absoluteFill} contentFit="cover" testID="community-cover-image" />
            ) : (
              <>
                <ImagePlus size={22} color={c.mutedText} strokeWidth={2} />
                <Text variant="secondary" tone="muted">
                  Add a cover photo
                </Text>
              </>
            )}
          </Pressable>
          {draft.cover ? (
            <View style={styles.coverActions}>
              <PillButton label="Change photo" onPress={chooseCover} />
              <PillButton label="Remove" onPress={() => set({ cover: null })} />
            </View>
          ) : (
            <Text variant="helper" tone={coverFailed ? 'warning' : 'muted'}>
              {coverFailed ? COVER_FAILED : 'Optional. You can add one later.'}
            </Text>
          )}
        </View>

        <TextField
          testID="community-name"
          label="Community name"
          value={draft.name}
          placeholder="What people will call it"
          maxLength={COMMUNITY_NAME_MAX}
          autoCapitalize="words"
          returnKeyType="done"
          onChangeText={(name) => set({ name })}
        />
        <SelectField
          testID="community-city"
          label="City"
          value={draft.city ? `${draft.city.name}, ${draft.city.region}` : null}
          placeholder="Choose a city"
          onPress={() => setCitySheet(true)}
        />
        <View style={styles.block}>
          <Text variant="secondaryStrong">Community type</Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {COMMUNITY_TYPE_OPTIONS.map((type) => (
              <Chip key={type} testID={`community-type-${type}`} label={type} selected={draft.type === type} onPress={() => set({ type })} />
            ))}
          </View>
        </View>
        <TextField
          testID="community-description"
          label="Description"
          value={draft.description}
          placeholder="Who it’s for and what you do together"
          multiline
          maxLength={COMMUNITY_DESCRIPTION_MAX}
          helper={draft.description.length >= DESCRIPTION_COUNTER_FROM ? `${left} ${left === 1 ? 'character' : 'characters'} left` : 'Optional'}
          onChangeText={(description) => set({ description })}
        />

        <CitySheet
          visible={citySheet}
          selected={draft.city}
          onClose={() => setCitySheet(false)}
          onPick={(city) => {
            set({ city });
            setCitySheet(false);
          }}
        />
      </Screen>
    );
  }

  const blocker = pricingBlocker(draft);
  const paid = draft.membership === 'paid';
  return (
    <Screen
      key="pricing"
      testID="community-pricing"
      footer={
        <>
          {create.isError ? <Notice tone="error">{CREATE_FAILED}</Notice> : null}
          <Button
            testID="community-create"
            label={blocker ?? (create.isError ? 'Try again' : 'Create community')}
            disabled={!!blocker}
            loading={create.isPending}
            onPress={() => create.mutate()}
          />
        </>
      }>
      <ScreenHeader title={STEP_TITLES[1]} subtitle="Create community" onBack={() => (create.isPending ? undefined : setStep(0))} />
      <StepBar step={1} />

      <View style={styles.choices} accessibilityRole="radiogroup">
        <ChoiceCard
          testID="membership-free"
          title="Free to join"
          line="Anyone can join at no cost."
          selected={!paid}
          onPress={() => set({ membership: 'free' })}
        />
        <ChoiceCard
          testID="membership-paid"
          title="Paid membership"
          line="Members pay each month to belong."
          selected={paid}
          onPress={() => set({ membership: 'paid' })}
        />
      </View>

      {paid ? (
        <>
          <TextField
            testID="membership-name"
            label="Membership name"
            value={draft.membershipName}
            placeholder="Member"
            maxLength={COMMUNITY_NAME_MAX}
            autoCapitalize="words"
            returnKeyType="done"
            onChangeText={(membershipName) => set({ membershipName })}
          />
          <TextField
            testID="membership-price"
            label="Monthly price"
            value={draft.price}
            prefix="$"
            money
            placeholder="0"
            keyboardType="number-pad"
            helper={STRIPE_HELPER}
            onChangeText={(price) => set({ price: sanitizeDollars(price) })}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: space.label },
  step: { flex: 1, gap: space.label },
  stepBar: { height: 4, borderRadius: radius.pill },
  block: { gap: space.sm },
  cover: {
    height: 150,
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  coverActions: { flexDirection: 'row', gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  choices: { gap: space.stack },
});
