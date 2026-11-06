import { useState } from 'react';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  Moon,
  Music,
  Palette,
  Sun,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, IconButton, LoadingRows, Screen, Text } from '@/components/ui';
import { usePreferences, useSavePreferences } from '@/data/RepositoryProvider';
import type { Preferences } from '@/data/types';
import { toggleValue } from '@/features/explore/filters';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { canContinue, continueLabel, PREFERENCE_STEPS } from './steps';

const TILE_ICONS: Record<string, LucideIcon> = {
  Nightlife: Moon,
  Concerts: Music,
  Dinners: Utensils,
  'Day parties': Sun,
  Networking: Users,
  Art: Palette,
  Workshops: BookOpen,
  Wellness: Heart,
};

const EMPTY: Preferences = { eventTypes: [], genres: [], vibes: [], themes: [] };

function Tile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useTheme();
  const Icon = TILE_ICONS[label] ?? Heart;
  const fg = selected ? c.brandText : c.foreground;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? c.tint : pressed ? c.muted : c.card,
          borderColor: selected ? c.brandLine : c.border,
        },
      ]}>
      <View style={styles.tileTop}>
        <Icon size={22} color={fg} strokeWidth={2} />
        {selected ? (
          <View style={[styles.check, { backgroundColor: c.brand }]}>
            <Check size={14} color={c.onBrand} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <Text variant="bodyStrong" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Preferences, steps 1 to 4. During onboarding it ends on Permissions and
 * Skip is always there; from Me → Preferences it opens with saved picks and
 * ends with Save.
 */
export function PreferencesView({ editing = false }: { editing?: boolean }) {
  const c = useTheme();
  const saved = usePreferences();
  const save = useSavePreferences();
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const step = PREFERENCE_STEPS[stepIndex];
  // Until the member changes something, the saved picks are the draft (a new member's are empty).
  const current = draft ?? saved.data ?? EMPTY;
  const picked = current[step.key];
  const last = stepIndex === PREFERENCE_STEPS.length - 1;

  const finish = async () => {
    await save.mutateAsync(current);
    if (editing) router.back();
    else router.push('/permissions');
  };

  const back = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else if (router.canGoBack()) router.back();
  };

  const toggle = (value: string) => setDraft({ ...current, [step.key]: toggleValue(picked, value) });

  return (
    <Screen
      testID="preferences"
      footer={
        <>
          <Button
            label={continueLabel(stepIndex, picked.length, { last, editing })}
            disabled={!canContinue(stepIndex, picked.length) || !saved.isSuccess}
            loading={save.isPending}
            trailingIcon={canContinue(stepIndex, picked.length) ? <ArrowRight size={18} color={c.onBrand} strokeWidth={2} /> : undefined}
            onPress={() => (last ? finish() : setStepIndex(stepIndex + 1))}
          />
          {stepIndex === 0 && !editing ? (
            <Text variant="helper" tone="muted" align="center">
              Music genres, vibes and themes come next. You can change these any time in Me.
            </Text>
          ) : null}
        </>
      }>
      <View style={styles.top}>
        {stepIndex > 0 || editing ? (
          <IconButton accessibilityLabel="Back" icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />} onPress={back} />
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={styles.progress} accessible accessibilityLabel={`Step ${stepIndex + 1} of ${PREFERENCE_STEPS.length}`}>
          {PREFERENCE_STEPS.map((s, i) => (
            <View key={s.key} style={[styles.segment, { backgroundColor: i <= stepIndex ? c.brand : c.muted }]} />
          ))}
        </View>
        {editing ? (
          <View style={styles.spacer} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            onPress={() => finish()}
            hitSlop={8}
            style={styles.skip}>
            <Text variant="secondaryStrong" tone="muted">
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.head}>
        <Text variant="display" accessibilityRole="header">
          {step.title}
        </Text>
        <Text tone="muted">{step.subtitle}</Text>
      </View>

      {saved.isPending ? <LoadingRows count={2} label="Loading your preferences" /> : null}

      {saved.isSuccess && step.layout === 'tiles' ? (
        <View style={styles.grid}>
          {step.options.map((o) => (
            <Tile key={o} label={o} selected={picked.includes(o)} onPress={() => toggle(o)} />
          ))}
        </View>
      ) : null}

      {saved.isSuccess && step.layout === 'chips' ? (
        <View style={styles.chips}>
          {step.options.map((o) => (
            <Chip key={o} label={o} selected={picked.includes(o)} onPress={() => toggle(o)} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  spacer: { width: size.minTarget, height: size.minTarget },
  progress: { flex: 1, flexDirection: 'row', gap: space.label },
  segment: { flex: 1, height: 4, borderRadius: radius.pill },
  skip: { minHeight: size.minTarget, minWidth: size.minTarget, alignItems: 'flex-end', justifyContent: 'center' },
  head: { gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.stack },
  tile: {
    width: '47%',
    flexGrow: 1,
    height: 88,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.card,
    justifyContent: 'space-between',
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  check: { width: 22, height: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
