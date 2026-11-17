import { COMMUNITY_TYPES, EVENT_THEMES, EVENT_TYPES, EVENT_VIBES, MUSIC_GENRES } from '@/data/taxonomy';

/**
 * Discovery tags for a community: one list, typed or picked. Known tags come
 * from the Explore taxonomy so they line up with its filters; anything else a
 * person types is kept as their own tag.
 */

export const TAG_LIMIT = 10;
export const TAG_LENGTH_MAX = 24;
/** Matches shown while typing. */
export const MATCH_COUNT = 5;

/** Every known tag once, in the order the taxonomy lists them. */
export const KNOWN_TAGS: readonly string[] = [
  ...new Set<string>([...COMMUNITY_TYPES, ...MUSIC_GENRES, ...EVENT_VIBES, ...EVENT_TYPES, ...EVENT_THEMES]),
];

/** The few offered before anything is typed: a spread across type, sound and vibe. */
export const STARTER_TAGS: readonly string[] = ['Nightlife', 'House', 'Afrobeats', 'Upscale', 'Rooftop', 'Day party'];

const key = (tag: string) => tag.trim().toLowerCase();

/** Letters, numbers, spaces, &, - and ' only; spaces collapsed; capped. */
export function cleanTag(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}&'\- ]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, TAG_LENGTH_MAX);
}

/** A known tag in its own spelling ("house" → "House"), or the typed tag tidied. */
export function canonicalTag(text: string): string {
  const tidy = cleanTag(text).trim();
  return KNOWN_TAGS.find((t) => key(t) === key(tidy)) ?? tidy;
}

export const hasTag = (tags: readonly string[], tag: string) => tags.some((t) => key(t) === key(tag));

/** Add one tag: tidied, never twice, at most TAG_LIMIT. */
export function addTag(tags: string[], text: string): string[] {
  const tag = canonicalTag(text);
  if (!tag || hasTag(tags, tag) || tags.length >= TAG_LIMIT) return tags;
  return [...tags, tag];
}

export const removeTag = (tags: string[], tag: string) => tags.filter((t) => key(t) !== key(tag));

/**
 * What to offer under the field. Nothing typed: the starters not yet added.
 * Typing: known tags that start with the text, then ones that contain it.
 */
export function suggestTags(query: string, chosen: readonly string[]): string[] {
  const q = key(query);
  const open = (list: readonly string[]) => list.filter((t) => !hasTag(chosen, t));
  if (!q) return open(STARTER_TAGS);
  const pool = open(KNOWN_TAGS);
  const starts = pool.filter((t) => key(t).startsWith(q) || key(t).split(/[\s&-]+/).some((w) => w.startsWith(q)));
  const contains = pool.filter((t) => !starts.includes(t) && key(t).includes(q));
  return [...starts, ...contains].slice(0, MATCH_COUNT);
}

/** The typed text can be added as a tag of its own: something typed, not already a match or chosen. */
export function canAddTyped(query: string, chosen: readonly string[]): boolean {
  const tag = canonicalTag(query);
  return tag.length > 0 && !hasTag(chosen, tag) && chosen.length < TAG_LIMIT;
}
