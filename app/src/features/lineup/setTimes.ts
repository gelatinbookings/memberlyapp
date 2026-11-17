import type { DraftOffer, EventFields } from '@/data/types';
import { addMinutes, formatShortTime, minutesBetween, type WallTime } from '@/lib/dates';

/** With no end time, each suggested set is two hours. */
export const DEFAULT_SET_MIN = 120;
/** Quick picks for a set's length in the time sheet. */
export const SET_LENGTH_PICKS = [60, 90, 120, 180, 240];

export type SetTime = { start: WallTime; end: WallTime; suggested: boolean };

/**
 * Back-to-back sets from the event's start, in lineup order. With an end
 * time the night is shared out evenly (on the half hour, the last set ending
 * when the event does); without one, each set is two hours. Null with no
 * start time to go from.
 */
export function suggestedSets(fields: Pick<EventFields, 'startTime' | 'endTime'>, count: number): { start: WallTime; end: WallTime }[] | null {
  const { startTime: start, endTime: end } = fields;
  if (!start || count < 1) return null;
  const total = end ? minutesBetween(start, end) : DEFAULT_SET_MIN * count;
  const each = end ? Math.max(30, Math.round(total / count / 30) * 30) : DEFAULT_SET_MIN;
  return Array.from({ length: count }, (_, i) => {
    const from = addMinutes(start, Math.min(i * each, Math.max(0, total - 30)));
    const last = i === count - 1;
    const to = last && end ? end : addMinutes(start, Math.min((i + 1) * each, total));
    return { start: from, end: to };
  });
}

/** The set each added DJ goes out with: the one the organizer chose, or the suggestion for its place in the lineup. */
export function setTimesFor(offers: DraftOffer[], fields: Pick<EventFields, 'startTime' | 'endTime'>): (SetTime | null)[] {
  const suggestions = suggestedSets(fields, offers.length);
  return offers.map((o, i) => {
    if (o.setStart && o.setEnd) return { start: o.setStart, end: o.setEnd, suggested: false };
    const s = suggestions?.[i];
    return s ? { ...s, suggested: true } : null;
  });
}

/** The offers as they are sent: each with its set filled in. */
export function withSetTimes(offers: DraftOffer[], fields: Pick<EventFields, 'startTime' | 'endTime'>): DraftOffer[] {
  const sets = setTimesFor(offers, fields);
  return offers.map((o, i) => (sets[i] ? { ...o, setStart: sets[i]!.start, setEnd: sets[i]!.end } : o));
}

/** The helper under a suggested set. */
export const suggestedLine = (eventStart: WallTime) => `Suggested from the ${formatShortTime(eventStart)} start. Tap to change.`;
