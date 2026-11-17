import type { PortalLaunch } from '@/data/types';

/**
 * How a visit to Gelatin ended.
 * `returned`: Gelatin sent the organizer back through the return link.
 * `dismissed`: they closed it themselves. Either way the app reads the
 * lineup again; it never assumes what happened over there.
 */
export type PortalResult = 'returned' | 'dismissed';

/**
 * The one way the app opens Gelatin's portal (GEL-1024). The launch is minted
 * the moment the organizer taps, handed straight to `openPortal`, and never
 * kept: it works once, for 60 seconds.
 */
export interface Portal {
  /** Open a launch. Resolves when the organizer is back in the app. */
  openPortal(launch: PortalLaunch): Promise<PortalResult>;
  /**
   * The return link arrived (memberly://return/portal): close whatever is
   * open, so `openPortal` resolves `returned`. True when a portal was open.
   */
  completeReturn(): boolean;
}

/** The route Gelatin's portal sends the organizer back to, with `?event=<id>`. */
export const PORTAL_RETURN_PATH = '/return/portal';

/** True once a launch can no longer be opened and a new one is needed. */
export function launchExpired(launch: Pick<PortalLaunch, 'expiresAt'>, now: number = Date.now()): boolean {
  const at = Date.parse(launch.expiresAt);
  return Number.isNaN(at) || at <= now;
}
