import type { Recurrence, RecurrenceFrequency } from '@/data/types';
import { formatIsoDate, toIsoDate, type IsoDate } from '@/lib/dates';

const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = ['first', 'second', 'third', 'fourth', 'last'];

export const FREQUENCIES: RecurrenceFrequency[] = ['weekly', 'biweekly', 'monthly'];
/** How many dates a series can have, counting the first; null is no end date. */
export const COUNT_PICKS: (number | null)[] = [4, 8, 12, null];
export const NO_REPEAT = 'Does not repeat';

const parts = (date: IsoDate) => date.split('-').map(Number) as [number, number, number];
const weekdayOf = (date: IsoDate) => {
  const [y, m, d] = parts(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Which of its weekday in the month a date is: 0 first … 3 fourth, 4 last (a fifth counts as last). */
export function weekOfMonth(date: IsoDate): number {
  const [y, m, d] = parts(date);
  if (d + 7 > daysIn(y, m)) return 4;
  return Math.floor((d - 1) / 7);
}

/** "Every week on Friday", "Every 2 weeks on Friday", "Every month on the third Friday". */
export function frequencyLabel(frequency: RecurrenceFrequency, date: IsoDate): string {
  const day = WEEKDAYS_LONG[weekdayOf(date)];
  if (frequency === 'weekly') return `Every week on ${day}`;
  if (frequency === 'biweekly') return `Every 2 weeks on ${day}`;
  return `Every month on the ${ORDINALS[weekOfMonth(date)]} ${day}`;
}

/** The short form for summaries: "Weekly", "Every 2 weeks", "Monthly". */
export function frequencyShort(frequency: RecurrenceFrequency): string {
  return frequency === 'weekly' ? 'Weekly' : frequency === 'biweekly' ? 'Every 2 weeks' : 'Monthly';
}

export function countLabel(count: number | null): string {
  return count == null ? 'No end date' : `${count} dates`;
}

/** The Repeats field's value: "Every week on Friday · 8 dates". */
export function recurrenceLabel(recurrence: Recurrence | null | undefined, date: IsoDate | null): string {
  if (!recurrence || !date) return NO_REPEAT;
  return `${frequencyLabel(recurrence.frequency, date)} · ${countLabel(recurrence.count)}`;
}

function addDaysUtc(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = parts(date);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return toIsoDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/** The same weekday position in a later month: the third Friday, or the last one. */
function sameWeekdayInMonth(date: IsoDate, monthsLater: number): IsoDate {
  const [y, m] = parts(date);
  const weekday = weekdayOf(date);
  const which = weekOfMonth(date);
  const total = y * 12 + (m - 1) + monthsLater;
  const ty = Math.floor(total / 12);
  const tm = (total % 12) + 1;
  if (which === 4) {
    const last = daysIn(ty, tm);
    const lastWeekday = weekdayOf(toIsoDate(ty, tm, last));
    return toIsoDate(ty, tm, last - ((lastWeekday - weekday + 7) % 7));
  }
  const firstWeekday = weekdayOf(toIsoDate(ty, tm, 1));
  return toIsoDate(ty, tm, 1 + ((weekday - firstWeekday + 7) % 7) + which * 7);
}

/** The series' dates from the first, at most `limit` of them. */
export function occurrences(date: IsoDate, recurrence: Recurrence, limit: number): IsoDate[] {
  const n = Math.min(limit, recurrence.count ?? limit);
  return Array.from({ length: n }, (_, i) =>
    recurrence.frequency === 'monthly' ? sameWeekdayInMonth(date, i) : addDaysUtc(date, i * (recurrence.frequency === 'weekly' ? 7 : 14)),
  );
}

/** "Fri, Nov 20, Fri, Nov 27, Fri, Dec 4 and more" as a short preview line. */
export function upcomingLine(date: IsoDate, recurrence: Recurrence): string {
  const shown = occurrences(date, recurrence, 3).map(formatIsoDate);
  const more = recurrence.count == null || recurrence.count > 3;
  return `${shown.join(' · ')}${more ? ' …' : ''}`;
}
