import type { BudgetBand, TalentFilters } from '@/data/types';

/**
 * Browse talent's two filters (GEL-1013): one budget band or any, one genre or
 * any. The night and the city are not filters; they belong to the event.
 */
export const NO_FILTERS: TalentFilters = { budget: null, genre: null };

/** In sheet order. `id` is exactly what the API accepts; `label` is the Filters board's wording. */
export const BUDGET_BANDS: { id: BudgetBand; label: string; phrase: string }[] = [
  { id: 'under_300', label: 'Under $300', phrase: 'under $300' },
  { id: '300_to_600', label: '$300 – $600', phrase: 'at $300 – $600' },
  { id: '600_to_1000', label: '$600 – $1,000', phrase: 'at $600 – $1,000' },
  { id: '1000_plus', label: '$1,000 and up', phrase: 'at $1,000 and up' },
];

export const ANY_BUDGET = 'Any budget';
export const ANY_GENRE = 'Any genre';

const band = (id: BudgetBand) => BUDGET_BANDS.find((b) => b.id === id)!;

/** The Budget chip: the chosen band, or "Any budget". */
export function budgetLabel(budget: BudgetBand | null): string {
  return budget ? band(budget).label : ANY_BUDGET;
}

/** The Genre chip: the chosen genre, or "Any genre". */
export function genreLabel(genre: string | null): string {
  return genre ?? ANY_GENRE;
}

export function filtersActive(f: TalentFilters): boolean {
  return f.budget != null || f.genre != null;
}

/** Single-select: picking the chosen band again goes back to any. */
export function toggleBudget(f: TalentFilters, budget: BudgetBand): TalentFilters {
  return { ...f, budget: f.budget === budget ? null : budget };
}

/** Single-select: picking the chosen genre again goes back to any. */
export function toggleGenre(f: TalentFilters, genre: string): TalentFilters {
  return { ...f, genre: f.genre === genre ? null : genre };
}

/** The sheet's genre pills: what the server offers for the band, plus the chosen one if the band dropped it. */
export function genreOptions(offered: string[], chosen: string | null): string[] {
  return chosen && !offered.includes(chosen) ? [...offered, chosen] : offered;
}

const djs = (n: number) => `${n} DJ${n === 1 ? '' : 's'}`;

/** The sheet's apply button: "Show 3 DJs", or "Show DJs" when the server sends no count. */
export function showDjsLabel(total: number | null | undefined): string {
  return total == null ? 'Show DJs' : `Show ${djs(total)}`;
}

/** Browse's header line with no filters: "5 DJs open on Fri, Nov 20 in Atlanta". */
export function openLine(total: number | null | undefined, day: string, city: string): string {
  return `${total == null ? 'DJs' : djs(total)} open on ${day} in ${city}`;
}

/** Browse's header line with filters: "3 of 10 DJs match". */
export function matchLine(shown: number | null | undefined, all: number | null | undefined): string {
  if (shown == null) return 'DJs that match your filters';
  if (all == null) return `${djs(shown)} match${shown === 1 ? 'es' : ''}`;
  return `${shown} of ${djs(all)} match${all === 1 && shown === 1 ? 'es' : ''}`;
}

/** The bottom bar: "Done · 2 added", or "Done" with nobody added. */
export function doneLabel(added: number): string {
  return added > 0 ? `Done · ${added} added` : 'Done';
}

/** "Techno" → "techno" inside a sentence; "R&B" stays as it is. */
function inSentence(genre: string): string {
  return /^[A-Z][a-z]/.test(genre) ? genre.charAt(0).toLowerCase() + genre.slice(1) : genre;
}

/**
 * Filters too tight: "5 DJs are open on Fri, Nov 20. None play techno under
 * $300. Loosen one filter to see them." Never says why a DJ is not open.
 */
export function tooTightBody(all: number | null | undefined, day: string, f: TalentFilters): string {
  const open = all == null ? `DJs are open on ${day}.` : `${djs(all)} ${all === 1 ? 'is' : 'are'} open on ${day}.`;
  const budget = f.budget ? band(f.budget).phrase : null;
  const none = f.genre
    ? `None play ${inSentence(f.genre)}${budget ? ` ${budget}` : ''}.`
    : budget
      ? `None are ${budget}.`
      : '';
  const both = f.budget != null && f.genre != null;
  return [open, none, both ? 'Loosen one filter to see them.' : 'Clear the filter to see them.'].filter(Boolean).join(' ');
}

/** A one-tap loosening button: "Any budget · 2", or "Any budget" when the server sends no count. */
export function loosenLabel(label: string, count: number | null | undefined): string {
  return count == null ? label : `${label} · ${count}`;
}

/** "Show all 5" */
export function showAllLabel(all: number | null | undefined): string {
  return all == null ? 'Show all' : `Show all ${all}`;
}
