import type { MemberEvent } from '@/data/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Splits upcoming events into "This week" (starts within 7 days of `now`) and
 * "Later". Past events are dropped. Both lists are in start order.
 */
export function groupUpcoming<T extends MemberEvent>(events: T[], now: Date): { thisWeek: T[]; later: T[] } {
  const start = now.getTime();
  const cutoff = start + 7 * DAY_MS;
  const upcoming = events
    .filter((e) => new Date(e.endsAt).getTime() >= start)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return {
    thisWeek: upcoming.filter((e) => new Date(e.startsAt).getTime() < cutoff),
    later: upcoming.filter((e) => new Date(e.startsAt).getTime() >= cutoff),
  };
}

export function pastEvents<T extends MemberEvent>(events: T[], now: Date): T[] {
  return events
    .filter((e) => new Date(e.endsAt).getTime() < now.getTime())
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
}

/** "1 pass · 2 you're going to", from the upcoming scope. */
export function countLine(events: { relation: 'pass' | 'going' | 'saved' }[]): string {
  const passes = events.filter((e) => e.relation === 'pass').length;
  const going = events.filter((e) => e.relation === 'going').length;
  return `${passes} ${passes === 1 ? 'pass' : 'passes'} · ${going} you’re going to`;
}
