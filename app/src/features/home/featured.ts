import type { MemberEvent, MyEvent } from '@/data/types';
import { formatEventDate, isoDateInZone } from '@/lib/dates';

export type Featured =
  | { kind: 'pass-tonight'; event: MemberEvent }
  | { kind: 'next-pass'; event: MemberEvent }
  | { kind: 'top-tonight'; event: MemberEvent };

/**
 * The big photo card on Home: tonight's pass; with none tonight, the next
 * upcoming pass; with no passes at all, tonight's top event.
 */
export function pickFeatured(tonight: MemberEvent[], upcoming: MyEvent[], now: Date): Featured | null {
  const passTonight = tonight.find((e) => e.viewerHasPass);
  if (passTonight) return { kind: 'pass-tonight', event: passTonight };
  const nextPass = upcoming
    .filter((e) => e.relation === 'pass' && new Date(e.endsAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  if (nextPass) return { kind: 'next-pass', event: nextPass };
  return tonight[0] ? { kind: 'top-tonight', event: tonight[0] } : null;
}

/** The pill on the photo: "Your pass", "Next pass", "Top tonight". */
export function featuredLabel(f: Featured): string {
  return f.kind === 'pass-tonight' ? 'Your pass' : f.kind === 'next-pass' ? 'Next pass' : 'Top tonight';
}

/** "Second Sundays · KOYO on the lineup". Confirmed DJs only; never fees or offers. */
export function lineupLine(event: MemberEvent): string {
  const djs = event.publicLineup.map((s) => s.djName).filter((n): n is string => !!n);
  if (djs.length === 0) return event.communityName;
  const names = djs.length <= 2 ? djs.join(' and ') : `${djs[0]}, ${djs[1]} and ${djs.length - 2} more`;
  return `${event.communityName} · ${names} on the lineup`;
}

/** "Evening", "Afternoon" or "Morning" at the event city's wall clock. */
export function greeting(now: Date, timeZone: string): string {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(now));
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  return 'Evening';
}

/** "Friday, Nov 20" in the given zone. */
export function longDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'short', day: 'numeric' }).format(now);
}

/** The member card's line: "1 pass tonight", "Next pass Sat, Nov 28", "No passes yet". */
export function passLine(tonight: MemberEvent[], featured: Featured | null): string {
  const count = tonight.filter((e) => e.viewerHasPass).length;
  if (count > 0) return `${count} ${count === 1 ? 'pass' : 'passes'} tonight`;
  if (featured?.kind === 'next-pass') return `Next pass ${formatEventDate(featured.event.startsAt, featured.event.timeZone)}`;
  return 'No passes yet';
}

/** True when the event starts on the same calendar day as `now`, in its own zone. */
export function isTonight(event: MemberEvent, now: Date): boolean {
  return isoDateInZone(new Date(event.startsAt), event.timeZone) === isoDateInZone(now, event.timeZone);
}
