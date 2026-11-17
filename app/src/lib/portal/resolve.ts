import type { Portal } from './types';

/**
 * Which portal the app opens.
 *  - An implementation passed in, when there is one.
 *  - The test portal, only when the repository is the fake one: its launches
 *    point nowhere real, so there is nothing a browser could open.
 *  - Otherwise the real one: Gelatin's page in the in-app browser.
 */
export function resolvePortal({
  implementation,
  testPortal,
  real,
}: {
  implementation?: Portal;
  /** Null unless the repository is the fake one. */
  testPortal: Portal | null;
  real: () => Portal;
}): Portal {
  return implementation ?? testPortal ?? real();
}
