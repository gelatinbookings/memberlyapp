import type { Booking, DraftOffer, EventFields } from '@/data/types';
import { lineupSummary } from '@/features/booking/lineupSummary';
import { formatIsoDate, formatIsoDateShort, formatWallTime } from '@/lib/dates';

/**
 * Create New Event: which sections are complete, what each card says in one
 * line, and what (if anything) stops Create & publish. Lineup and Access &
 * passes never block publishing.
 */
export type SectionId = 'details' | 'when' | 'location' | 'lineup' | 'access';

export const SECTION_ORDER: SectionId[] = ['details', 'when', 'location', 'lineup', 'access'];

export const SECTION_TITLES: Record<SectionId, string> = {
  details: 'Event details',
  when: 'Date & time',
  location: 'Location',
  lineup: 'Lineup',
  access: 'Access & passes',
};

export function detailsComplete(f: EventFields): boolean {
  return f.name.trim().length > 0;
}

export function whenComplete(f: EventFields): boolean {
  return !!(f.date && f.startTime && f.endTime);
}

export function locationComplete(f: EventFields): boolean {
  return f.venue.trim().length > 0 && !!f.city;
}

/** Browse talent needs the night and the city; the venue name is not required for it. */
export function lineupUnlocked(f: Pick<EventFields, 'date' | 'city'>): boolean {
  return !!f.date && !!f.city;
}

const MISSING_LABEL: Record<'details' | 'when' | 'location', string> = {
  details: 'a name',
  when: 'a date',
  location: 'a location',
};

/** Required sections that are not done yet, in screen order. */
export function missingForPublish(f: EventFields): ('details' | 'when' | 'location')[] {
  const missing: ('details' | 'when' | 'location')[] = [];
  if (!detailsComplete(f)) missing.push('details');
  if (!whenComplete(f)) missing.push('when');
  if (!locationComplete(f)) missing.push('location');
  return missing;
}

/**
 * The publish button's label when something is missing, e.g. "Add a date to publish".
 * Names the first gap only, so it fits on the button. Null when the event can publish.
 */
export function publishBlocker(f: EventFields): string | null {
  const [first] = missingForPublish(f);
  if (!first) return null;
  if (first === 'when' && f.date) return 'Add times to publish';
  return `Add ${MISSING_LABEL[first]} to publish`;
}

export function whenSummary(f: EventFields): string {
  if (!f.date) return 'Pick the night and the times';
  if (!f.startTime || !f.endTime) return `${formatIsoDate(f.date)} · add times`;
  return `${formatIsoDate(f.date)} · ${formatWallTime(f.startTime)} – ${formatWallTime(f.endTime)}`;
}

export function locationSummary(f: EventFields): string {
  const city = f.city ? `${f.city.name}, ${f.city.region}` : null;
  const venue = f.venue.trim() || null;
  if (venue && city) return `${venue} · ${city}`;
  if (city) return `${city} · add a venue`;
  if (venue) return `${venue} · add a city`;
  return 'Venue and city';
}

export function detailsSummary(f: EventFields): string {
  const name = f.name.trim();
  if (!name) return 'Name, cover and description';
  return f.cover ? `${name} · cover added` : name;
}

/** "2 DJs added · offers not sent" */
export function addedSummary(count: number): string {
  return `${count} DJ${count === 1 ? '' : 's'} added · offers not sent`;
}

/** The Lineup card's one line inside Create New Event (collapsed). */
export function lineupCardSummary(
  f: Pick<EventFields, 'date' | 'city'>,
  bookings: Pick<Booking, 'status'>[],
  added: Pick<DraftOffer, 'dj'>[],
): string {
  if (bookings.length > 0) return lineupSummary(bookings);
  if (added.length > 0) return addedSummary(added.length);
  if (!lineupUnlocked(f)) return 'Add a date and city first';
  return `Book DJs open on ${formatIsoDateShort(f.date!)} in ${f.city!.name}`;
}

export const EMPTY_FIELDS: EventFields = {
  name: '',
  tagline: '',
  description: '',
  cover: null,
  date: null,
  startTime: null,
  endTime: null,
  venue: '',
  city: null,
};
