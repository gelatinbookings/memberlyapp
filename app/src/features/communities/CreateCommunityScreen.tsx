import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { AtSign, Gift } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, GroupedList, Notice, PillButton, Screen, ScreenHeader, SelectField, Text, TextField } from '@/components/ui';
import { refreshAfterCommunity, useRepository } from '@/data/RepositoryProvider';
import { newClientId } from '@/lib/clientId';
import { pickPhoto, pickPhotos, type LibraryPhoto } from '@/lib/photos';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { ChoiceCard } from './ChoiceCard';
import { CityField } from './CityField';
import { CountrySheet } from './CitySheet';
import {
  COMMUNITY_DESCRIPTION_MAX,
  COMMUNITY_NAME_MAX,
  CREATE_FAILED,
  effectiveSlug,
  EMPTY_COMMUNITY,
  GALLERY_MAX,
  hasEntries,
  LAST_STEP,
  linkProblem,
  PHOTO_LIMITS,
  PHOTOS_FAILED,
  REFERRAL_MAX,
  sanitizeReferral,
  SLUG_HOST,
  SLUG_MAX,
  slugify,
  SOCIAL_FIELDS,
  STEP_SHORT,
  STEP_TITLES,
  stepBlocker,
  TAGLINE_MAX,
  toCreateInput,
  tooLarge,
  type CommunityDraft,
  type Step,
} from './communityForm';
import { FormSection } from './FormSection';
import { GalleryField } from './GalleryField';
import { HeaderPreview } from './HeaderPreview';
import { TagInput } from './TagInput';
import { TierEditor } from './TierEditor';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/me'));

/** A count shown once the end is near, so a short entry stays quiet. */
const countdown = (value: string, max: number) => (value.length >= max * 0.8 ? `${value.length}/${max}` : null);

/** The four steps under the header: a bar each, purple up to the current one, its short name under it. */
function StepBar({ step }: { step: Step }) {
  const c = useTheme();
  return (
    <View style={styles.steps} accessible accessibilityLabel={`Step ${step + 1} of 4, ${STEP_TITLES[step]}`}>
      {STEP_SHORT.map((title, i) => (
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

/** A titled group of fields inside a step: the title, one line, then the fields. */
function Group({ title, line, children }: { title: string; line?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
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

/** One required photo in the list under the preview: what it is, what fits, and Add or Replace. */
function AssetRow({ label, hint, warning, photo, onPick, testID }: { label: string; hint: string; warning: string | null; photo: LibraryPhoto | null; onPick: () => void; testID: string }) {
  return (
    <View style={styles.assetRow}>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="helper" tone={warning ? 'warning' : 'muted'}>
          {warning ?? hint}
        </Text>
      </View>
      <PillButton testID={testID} label={photo ? 'Replace' : 'Add'} accessibilityLabel={`${photo ? 'Replace' : 'Add'} ${label.toLowerCase()}`} onPress={onPick} />
    </View>
  );
}

/**
 * Create community (GEL-1056). Everything the web's Create New Community and
 * community Settings ask for at the start, in four short steps: the story, the
 * look (with the public header previewed as it's built), how people find it,
 * and membership pricing. One screen holds every step, so going back keeps
 * what was entered. Creating carries a key made here, so a retry after a lost
 * answer makes one community.
 */
export function CreateCommunityScreen() {
  const repo = useRepository();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<CommunityDraft>(EMPTY_COMMUNITY);
  const [sheet, setSheet] = useState<'country' | null>(null);
  const [photoNote, setPhotoNote] = useState<{ logo?: string; banner?: string; gallery?: string }>({});
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
  const back = () => {
    if (create.isPending) return;
    if (step === 0) close();
    else setStep((step - 1) as Step);
  };

  const pickOne = async (slot: 'logo' | 'banner') => {
    setPhotoNote((n) => ({ ...n, [slot]: undefined }));
    try {
      const photo = await pickPhoto({ square: slot === 'logo' });
      if (!photo) return;
      if (tooLarge(photo, PHOTO_LIMITS[slot])) {
        const mb = PHOTO_LIMITS[slot] / (1024 * 1024);
        setPhotoNote((n) => ({ ...n, [slot]: `That ${slot} is over ${mb} MB. Choose a smaller one.` }));
        return;
      }
      set({ [slot]: photo });
    } catch {
      setPhotoNote((n) => ({ ...n, [slot]: PHOTOS_FAILED }));
    }
  };

  const addToGallery = async () => {
    setPhotoNote((n) => ({ ...n, gallery: undefined }));
    try {
      const picked = await pickPhotos(GALLERY_MAX - draft.gallery.length);
      const fits = picked.filter((p) => !tooLarge(p, PHOTO_LIMITS.gallery));
      const dropped = picked.length - fits.length;
      if (dropped > 0) {
        setPhotoNote((n) => ({ ...n, gallery: `${dropped === 1 ? 'One photo was' : `${dropped} photos were`} over 10 MB and ${dropped === 1 ? 'wasn’t' : 'weren’t'} added.` }));
      }
      if (fits.length) setDraft((d) => ({ ...d, gallery: [...d.gallery, ...fits].slice(0, GALLERY_MAX) }));
    } catch {
      setPhotoNote((n) => ({ ...n, gallery: PHOTOS_FAILED }));
    }
  };

  const blocker = stepBlocker(step, draft);
  const last = step === LAST_STEP;
  const footer = (
    <>
      {last && create.isError ? <Notice tone="error">{CREATE_FAILED}</Notice> : null}
      <Button
        testID={last ? 'community-create' : 'community-continue'}
        label={blocker ?? (last ? (create.isError ? 'Try again' : 'Create community') : 'Continue')}
        disabled={!!blocker}
        loading={last && create.isPending}
        onPress={() => (last ? create.mutate() : setStep((step + 1) as Step))}
      />
    </>
  );

  const slug = effectiveSlug(draft);
  const linksFilled = SOCIAL_FIELDS.some((f) => draft.links[f.key].trim());

  return (
    <Screen
      key={`step-${step}`}
      testID={`community-step-${step}`}
      header={<ScreenHeader title={STEP_TITLES[step]} subtitle="Create community" onBack={back} />}
      footer={footer}>
      <StepBar step={step} />

      {step === 0 ? (
        <>
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
          <TextField
            testID="community-tagline"
            label="Tagline"
            value={draft.tagline}
            placeholder="Bringing live upscale events to you."
            maxLength={TAGLINE_MAX}
            returnKeyType="done"
            helper={countdown(draft.tagline, TAGLINE_MAX) ?? 'One line, shown under your name everywhere.'}
            onChangeText={(tagline) => set({ tagline })}
          />
          <TextField
            testID="community-description"
            label="Description"
            value={draft.description}
            placeholder="Who it’s for, what a night with you feels like, and how often you meet."
            multiline
            maxLength={COMMUNITY_DESCRIPTION_MAX}
            helper={`${draft.description.length}/${COMMUNITY_DESCRIPTION_MAX}`}
            onChangeText={(description) => set({ description })}
          />
          <TextField
            testID="community-slug"
            label="Link (optional)"
            value={draft.slug}
            placeholder={slugify(draft.name) || 'your-community'}
            maxLength={SLUG_MAX}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            helper={`${SLUG_HOST}${slug || 'your-community'}`}
            onChangeText={(text) => set({ slug: slugify(text) })}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <View style={styles.previewWrap}>
            <HeaderPreview
              name={draft.name}
              tagline={draft.tagline}
              logo={draft.logo}
              banner={draft.banner}
              onPickLogo={() => pickOne('logo')}
              onPickBanner={() => pickOne('banner')}
            />
            <Text variant="helper" tone="muted">
              The top of your public page, as people will see it.
            </Text>
          </View>
          <GroupedList>
            <AssetRow
              testID="community-logo"
              label="Logo"
              hint="Square, at least 400×400. Up to 2 MB."
              warning={photoNote.logo ?? null}
              photo={draft.logo}
              onPick={() => pickOne('logo')}
            />
            <AssetRow
              testID="community-banner"
              label="Banner"
              hint="4:1, like 1920×480. Up to 5 MB."
              warning={photoNote.banner ?? null}
              photo={draft.banner}
              onPick={() => pickOne('banner')}
            />
          </GroupedList>
          <Group title="Gallery" line="Optional. Up to 10 photos from past nights.">
            <GalleryField
              photos={draft.gallery}
              warning={photoNote.gallery ?? null}
              onAdd={addToGallery}
              onRemove={(i) => setDraft((d) => ({ ...d, gallery: d.gallery.filter((_, j) => j !== i) }))}
            />
          </Group>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Group title="Where you meet" line="Puts your events in front of people searching that city.">
            <SelectField testID="community-country" label="Country" value={draft.country} placeholder="Choose a country" onPress={() => setSheet('country')} />
            <CityField country={draft.country} city={draft.city} region={draft.region} onChange={(patch) => set(patch)} />
          </Group>
          <Group title="Tags" line="How people find you in Explore. Pick a few that truly describe your nights, or add your own.">
            <TagInput tags={draft.tags} onChange={(tags) => set({ tags })} />
          </Group>
          <FormSection testID="community-links" icon={AtSign} title="Social links" line="Shown as icons on your public page." optional filled={linksFilled}>
            {SOCIAL_FIELDS.map((f) => (
              <TextField
                key={f.key}
                testID={`link-${f.key}`}
                label={f.label}
                value={draft.links[f.key]}
                placeholder={f.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                warning={linkProblem(draft.links[f.key]) ?? undefined}
                onChangeText={(v) => set({ links: { ...draft.links, [f.key]: v } })}
              />
            ))}
          </FormSection>
          <FormSection testID="community-referral" icon={Gift} title="Referral code" line="Did someone refer you to Memberly?" optional filled={draft.referralCode.length > 0}>
            <TextField
              testID="community-referral-code"
              label="Referral code"
              hideLabel
              value={draft.referralCode}
              placeholder="e.g. JORDANREESE"
              maxLength={REFERRAL_MAX}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onChangeText={(v) => set({ referralCode: sanitizeReferral(v) })}
            />
          </FormSection>

          <CountrySheet
            visible={sheet === 'country'}
            selected={draft.country}
            onClose={() => setSheet(null)}
            onPick={(country) => {
              set({ country });
              setSheet(null);
            }}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <View style={styles.choices} accessibilityRole="radiogroup">
            <ChoiceCard testID="membership-free" title="Free to join" line="Anyone can join at no cost." selected={draft.membership === 'free'} onPress={() => set({ membership: 'free' })} />
            <ChoiceCard testID="membership-paid" title="Paid membership" line="Members pay monthly, per tier." selected={draft.membership === 'paid'} onPress={() => set({ membership: 'paid' })} />
          </View>
          {draft.membership === 'paid' ? <TierEditor tiers={draft.tiers} onChange={(tiers) => set({ tiers })} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: space.label },
  step: { flex: 1, gap: space.label },
  stepBar: { height: 4, borderRadius: radius.pill },
  flex: { flex: 1, gap: 2 },
  group: { gap: space.md },
  groupHead: { gap: space.xs },
  previewWrap: { gap: space.sm },
  assetRow: { minHeight: 64, paddingHorizontal: space.card, paddingVertical: space.row, flexDirection: 'row', alignItems: 'center', gap: space.row },
  tagGroup: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  choices: { gap: space.stack },
});
