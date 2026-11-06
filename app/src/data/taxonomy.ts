/**
 * The preference and filter lists. Event types, the Explore chips and the
 * filter sheet come from the design boards (Onboarding, Explore,
 * ExploreFilters). Genres, vibes and themes mirror the web profile's
 * Preferences tab as far as the boards show it; confirm the full lists
 * against the web taxonomy before M8, where they come from the server.
 */

/** Preferences step 1: "What do you go out for?" */
export const EVENT_TYPES = [
  'Nightlife',
  'Concerts',
  'Dinners',
  'Day parties',
  'Networking',
  'Art',
  'Workshops',
  'Wellness',
] as const;

export const MUSIC_GENRES = [
  'House',
  'Afrobeats',
  'R&B',
  'Techno',
  'Amapiano',
  'Hip-hop',
  'Soul',
  'Jazz',
  'Disco',
  'Dancehall',
] as const;

export const EVENT_VIBES = [
  'Upscale',
  'Underground',
  'Day party',
  'Intimate',
  'Rooftop',
  'Late night',
  'Laid back',
  'High energy',
] as const;

export const EVENT_THEMES = [
  'Food & drink',
  'Art & design',
  'Fashion',
  'Film',
  'Culture',
  'Fitness',
  'Tech',
  'Sports',
] as const;

/** The chip row on Explore. */
export const EXPLORE_CATEGORIES = ['All', 'Nightlife', 'Dinners', 'Day parties', 'Concerts', 'Workshops'] as const;

/** Filter sheet groups (ExploreFilters board). */
export const COMMUNITY_TYPES = ['Nightlife', 'Food & wine', 'Music', 'Networking', 'Art', 'Wellness'] as const;
export const FILTER_GENRES = ['House', 'Afrobeats', 'R&B', 'Techno', 'Amapiano'] as const;
export const FILTER_VIBES = ['Upscale', 'Underground', 'Day party', 'Intimate'] as const;

export const NEAR_ME = 'Near me';
export const ANYWHERE = 'Anywhere';
/** Within this distance an event counts as "Near me". */
export const NEAR_ME_MILES = 3;
