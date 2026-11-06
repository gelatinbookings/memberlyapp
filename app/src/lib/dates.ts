/**
 * Event times always render in the event's own time zone (the IANA zone
 * Memberly sends), never the phone's.
 */
function parts(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone, ...options }).format(new Date(iso));
}

/** "Fri, Nov 20" */
export function formatEventDate(iso: string, timeZone: string): string {
  return parts(iso, timeZone, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "10 PM" or "7:30 PM": minutes only when they are not zero. */
export function formatEventTime(iso: string, timeZone: string): string {
  const minutes = parts(iso, timeZone, { minute: 'numeric' });
  const withMinutes = Number(minutes) !== 0;
  return parts(iso, timeZone, {
    hour: 'numeric',
    minute: withMinutes ? '2-digit' : undefined,
  });
}

/** "10 PM – 2 AM" */
export function formatEventRange(startIso: string, endIso: string, timeZone: string): string {
  return `${formatEventTime(startIso, timeZone)} – ${formatEventTime(endIso, timeZone)}`;
}

/** "FRI" and "20" for a date tile. */
export function dateTile(iso: string, timeZone: string): { weekday: string; day: string } {
  return {
    weekday: parts(iso, timeZone, { weekday: 'short' }).toUpperCase(),
    day: parts(iso, timeZone, { day: 'numeric' }),
  };
}

/*
 * Wall-clock helpers for Create New Event. The organizer picks a night
 * ("2026-11-20") and times ("22:00") that mean the venue's local time. They are
 * kept as plain strings and turned into an instant only with the venue's IANA
 * zone, so the phone's own time zone never shifts them.
 */

/** "2026-11-20" */
export type IsoDate = string;
/** "22:00", 24-hour */
export type WallTime = string;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function splitDate(date: IsoDate): [number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d];
}

function minutesOf(time: WallTime): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "Fri, Nov 20". Calendar arithmetic in UTC, so no zone can move the day. */
export function formatIsoDate(date: IsoDate): string {
  const [y, m, d] = splitDate(date);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAYS[weekday]}, ${MONTHS[m - 1]} ${d}`;
}

/** "Nov 20" */
export function formatIsoDateShort(date: IsoDate): string {
  const [, m, d] = splitDate(date);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "November 2026" */
export function formatMonth(year: number, month: number): string {
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

/** "22:00" → "10:00 PM" */
export function formatWallTime(time: WallTime): string {
  const total = minutesOf(time);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** An end at or before the start means the event runs past midnight. */
export function endsNextMorning(start: WallTime, end: WallTime): boolean {
  return minutesOf(end) <= minutesOf(start);
}

/** Every half hour of the day, "00:00" to "23:30". */
export function halfHourSlots(): WallTime[] {
  return Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`);
}

/** The next calendar day. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = splitDate(date);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return toIsoDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/** The calendar day an instant falls on in a zone: today at the venue. */
export function isoDateInZone(instant: Date, timeZone: string): IsoDate {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(instant);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return toIsoDate(get('year'), get('month'), get('day'));
}

/** Minutes the zone is ahead of UTC at an instant (New York in November: -300). */
function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(instant);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/**
 * A wall-clock time at the venue as ISO 8601 with the venue's offset:
 * ("2026-11-20", "22:00", "America/New_York") → "2026-11-20T22:00:00-05:00".
 */
export function zonedIso(date: IsoDate, time: WallTime, timeZone: string): string {
  const [y, mo, d] = splitDate(date);
  const [h, mi] = time.split(':').map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes settle the offset on either side of a daylight-saving change.
  let offset = zoneOffsetMinutes(new Date(wallAsUtc), timeZone);
  offset = zoneOffsetMinutes(new Date(wallAsUtc - offset * 60000), timeZone);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  return `${date}T${pad(h)}:${pad(mi)}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

const ZONE_NAMES: Record<string, string> = {
  'America/New_York': 'Eastern Time',
  'America/Detroit': 'Eastern Time',
  'America/Chicago': 'Central Time',
  'America/Denver': 'Mountain Time',
  'America/Phoenix': 'Mountain Time',
  'America/Los_Angeles': 'Pacific Time',
  'America/Anchorage': 'Alaska Time',
  'Pacific/Honolulu': 'Hawaii Time',
  'Europe/London': 'UK Time',
};

/** "America/New_York" → "Eastern Time". Unknown zones fall back to the city in the name. */
export function timeZoneName(timeZone: string): string {
  if (ZONE_NAMES[timeZone]) return ZONE_NAMES[timeZone];
  const city = timeZone.split('/').pop() ?? timeZone;
  return `${city.replace(/_/g, ' ')} time`;
}

/**
 * The helper under Starts / Ends: "Eastern Time, from the venue. Ends the next morning."
 * Without a venue there is no zone yet, and the line says so.
 */
export function timeHelper(timeZone: string | null, start: WallTime | null, end: WallTime | null): string {
  const zone = timeZone ? `${timeZoneName(timeZone)}, from the venue.` : 'Times use the venue’s time zone once you add a location.';
  const nextMorning = start && end && endsNextMorning(start, end) ? ' Ends the next morning.' : '';
  return zone + nextMorning;
}

/** Weeks of a month for a calendar grid, Sunday first; null pads the edges. */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
