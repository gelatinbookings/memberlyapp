import type { Booking } from '@/data/types';

type Status = Booking['status'];

const GROUPS: { label: string; matches: (s: Status) => boolean }[] = [
  { label: 'confirmed', matches: (s) => s === 'confirmed' },
  { label: 'new offer', matches: (s) => s === 'reauthorization_required' },
  { label: 'waiting', matches: (s) => s === 'requested' || s === 'negotiating' },
  { label: 'to pay', matches: (s) => s === 'authorization_required' },
];

/**
 * One line for an event's lineup, as on the design canvas:
 * "1 confirmed · 1 waiting · 1 to pay". Passed, expired and cancelled
 * bookings are not counted.
 */
export function lineupSummary(bookings: Pick<Booking, 'status'>[]): string {
  const parts = GROUPS.map((g) => ({ label: g.label, n: bookings.filter((b) => g.matches(b.status)).length }))
    .filter((p) => p.n > 0)
    .map((p) => `${p.n} ${p.label}`);
  return parts.length > 0 ? parts.join(' · ') : 'No lineup yet';
}

/** True when any booking needs the organizer to act (pay, or review a new price). */
export function lineupNeedsAction(bookings: Pick<Booking, 'status'>[]): boolean {
  return bookings.some((b) => b.status === 'authorization_required' || b.status === 'reauthorization_required');
}

/**
 * The same line for a narrow space: each part holds together ("1 to pay"
 * never breaks after "to"), so a long summary wraps only between parts.
 */
export function unbrokenParts(summary: string): string {
  return summary
    .split(' · ')
    .map((part) => part.replace(/ /g, '\u00A0'))
    .join(' · ');
}
