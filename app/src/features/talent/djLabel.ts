import type { Dj } from '@/data/types';
import { formatRate } from '@/features/booking/money';

/** "House and Afrobeats" */
function spokenGenres(genres: string[]): string {
  if (genres.length <= 1) return genres[0] ?? '';
  return `${genres.slice(0, -1).join(', ')} and ${genres[genres.length - 1]}`;
}

/** The rate as VoiceOver should say it: "$450 per set" (read as "450 dollars per set") or "private rate". */
export function spokenRate(dj: Pick<Dj, 'publishedRateCents'>): string {
  return dj.publishedRateCents == null ? 'private rate' : `${formatRate(dj.publishedRateCents)} per set`;
}

/** The draw as VoiceOver should say it: "draws 180 to 260", straight from the data. */
export function spokenDraw(dj: Pick<Dj, 'draw'>): string {
  return dj.draw ? `draws ${dj.draw.min} to ${dj.draw.max}` : 'draw not yet established';
}

/**
 * A DJ card is one VoiceOver element that reads as a sentence and ends on its
 * action: "KOYO, Top performer, House and Afrobeats, $450 per set, draws 180 to 260, Add".
 */
export function djCardLabel(dj: Dj, added: boolean): string {
  return [dj.name, dj.tier, spokenGenres(dj.genres), spokenRate(dj), spokenDraw(dj), added ? 'Added' : 'Add']
    .filter(Boolean)
    .join(', ');
}
