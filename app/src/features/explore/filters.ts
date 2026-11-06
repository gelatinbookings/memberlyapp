import type { Community, ExploreFilters, ExploreKind, ExploreQuery, ExploreResult, MemberEvent } from '@/data/types';
import { ANYWHERE, NEAR_ME, NEAR_ME_MILES } from '@/data/taxonomy';

/** Filters a member starts with: communities in their city, nothing else picked. */
export function defaultFilters(city: string): ExploreFilters {
  return { kind: 'communities', location: city, communityTypes: [], genres: [], vibes: [] };
}

/** Reset clears every group back to the member's city. */
export const resetFilters = defaultFilters;

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** True when the sheet changed anything that narrows results (the kind alone does not). */
export function filtersActive(filters: ExploreFilters, city: string): boolean {
  return (
    filters.location !== city ||
    filters.communityTypes.length > 0 ||
    filters.genres.length > 0 ||
    filters.vibes.length > 0
  );
}

/** The small count beside each group title: "2 picked", "Any", or the chosen place. */
export function groupCountLabel(picked: string[]): string {
  return picked.length === 0 ? 'Any' : `${picked.length} picked`;
}

/** "Show 12 communities", "Show 1 event", or a disabled "No communities match". */
export function showButtonLabel(kind: ExploreKind, count: number): string {
  const noun = kind === 'communities' ? (count === 1 ? 'community' : 'communities') : count === 1 ? 'event' : 'events';
  return count === 0 ? `No ${kind} match` : `Show ${count} ${noun}`;
}

const lower = (s: string) => s.toLowerCase();
const overlaps = (wanted: string[], have: string[] | undefined) =>
  wanted.length === 0 || wanted.some((w) => (have ?? []).includes(w));

/** Free text matches names, places and taxonomy, so "rooftop" or "house" both find things. */
function textMatches(text: string, haystack: (string | undefined)[]): boolean {
  const q = lower(text.trim());
  if (!q) return true;
  return haystack.some((h) => !!h && lower(h).includes(q));
}

function communityMatches(c: Community, q: ExploreQuery, viewerCity: string): boolean {
  const f = q.filters;
  // Communities have no distance: "Near me" means the member's city.
  const location =
    f.location === ANYWHERE ? true : f.location === NEAR_ME ? c.city === viewerCity : c.city === f.location;
  return (
    location &&
    (q.category === 'All' || (c.categories ?? []).includes(q.category)) &&
    (f.communityTypes.length === 0 || (!!c.type && f.communityTypes.includes(c.type))) &&
    overlaps(f.genres, c.genres) &&
    overlaps(f.vibes, c.vibes) &&
    textMatches(q.text, [c.name, c.city, c.type, ...(c.genres ?? []), ...(c.vibes ?? []), ...(c.categories ?? [])])
  );
}

function eventMatches(e: MemberEvent, q: ExploreQuery, communities: Community[]): boolean {
  const f = q.filters;
  const location =
    f.location === ANYWHERE
      ? true
      : f.location === NEAR_ME
        ? e.distanceMiles != null && e.distanceMiles <= NEAR_ME_MILES
        : e.city === f.location;
  const host = communities.find((c) => c.id === e.communityId);
  return (
    location &&
    (q.category === 'All' || e.category === q.category) &&
    (f.communityTypes.length === 0 || (!!host?.type && f.communityTypes.includes(host.type))) &&
    overlaps(f.genres, e.genres) &&
    overlaps(f.vibes, e.vibes) &&
    textMatches(q.text, [e.name, e.communityName, e.neighborhood, e.city, e.category, ...(e.genres ?? []), ...(e.vibes ?? [])])
  );
}

/**
 * The Explore search, as Memberly's backend will run it (GET /app/explore).
 * Lives here so the fake repository and the tests share one definition.
 */
export function runExplore(
  data: { communities: Community[]; events: MemberEvent[] },
  q: ExploreQuery,
  viewerCity: string,
): ExploreResult {
  const communities = data.communities
    .filter((c) => communityMatches(c, q, viewerCity))
    .sort((a, b) => b.memberCount - a.memberCount);
  const events = data.events
    .filter((e) => eventMatches(e, q, data.communities))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return { communities, events, count: q.filters.kind === 'communities' ? communities.length : events.length };
}
