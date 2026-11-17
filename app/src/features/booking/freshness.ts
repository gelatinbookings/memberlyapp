/** Copy for a lineup that may be behind: the backend's last known body, or a refresh that failed (GEL-1022). */

const MINUTE_MS = 60_000;

/**
 * "Last updated 2 min ago", from when a current answer last arrived. Quiet on
 * purpose: the last known lineup stays on screen and this line sits under it.
 */
export function lastUpdatedLabel(since: number | null, now: number): string {
  if (since == null) return 'Showing the last status we have';
  const minutes = Math.floor(Math.max(0, now - since) / MINUTE_MS);
  if (minutes < 1) return 'Last updated just now';
  if (minutes < 60) return `Last updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `Last updated ${hours} hr ago`;
}

/** How often the line is worked out again while it is on screen. */
export const LAST_UPDATED_TICK_MS = 15_000;
