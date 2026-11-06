import type { Preferences } from '@/data/types';
import { EVENT_THEMES, EVENT_TYPES, EVENT_VIBES, MUSIC_GENRES } from '@/data/taxonomy';

export type PreferenceKey = keyof Preferences;

export type PreferenceStep = {
  key: PreferenceKey;
  title: string;
  subtitle: string;
  options: readonly string[];
  /** Step 1 shows tiles with icons; the rest use chips. */
  layout: 'tiles' | 'chips';
};

/** Picks needed on step 1 before Continue turns on. */
export const MIN_EVENT_TYPES = 3;

export const PREFERENCE_STEPS: PreferenceStep[] = [
  {
    key: 'eventTypes',
    title: 'What do you go out for?',
    subtitle: 'Pick at least three. We use these to match you with communities and events.',
    options: EVENT_TYPES,
    layout: 'tiles',
  },
  {
    key: 'genres',
    title: 'What do you want to hear?',
    subtitle: 'Pick any. We look for nights with your sound.',
    options: MUSIC_GENRES,
    layout: 'chips',
  },
  {
    key: 'vibes',
    title: 'What’s your kind of night?',
    subtitle: 'Pick any. Upscale or underground, we’ll find the room.',
    options: EVENT_VIBES,
    layout: 'chips',
  },
  {
    key: 'themes',
    title: 'Anything else you’re into?',
    subtitle: 'Pick any themes you’d go out for.',
    options: EVENT_THEMES,
    layout: 'chips',
  },
];

/** Only step 1 has a minimum: at least three event types. */
export function canContinue(stepIndex: number, picked: number): boolean {
  return stepIndex !== 0 || picked >= MIN_EVENT_TYPES;
}

/** "Pick at least three" until step 1 has three, then "Continue · 3 selected". */
export function continueLabel(stepIndex: number, picked: number, { last = false, editing = false } = {}): string {
  if (!canContinue(stepIndex, picked)) return 'Pick at least three';
  const verb = last && editing ? 'Save' : 'Continue';
  return picked > 0 ? `${verb} · ${picked} selected` : verb;
}

export function countPicked(p: Preferences): number {
  return p.eventTypes.length + p.genres.length + p.vibes.length + p.themes.length;
}
