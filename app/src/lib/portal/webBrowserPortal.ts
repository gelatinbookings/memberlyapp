import * as WebBrowser from 'expo-web-browser';

import type { Portal } from './types';

/**
 * The real portal: Gelatin's page in the system's in-app browser
 * (SFSafariViewController on iPhone), over the app.
 *
 * Coming back: the portal's last page opens memberly://return/portal?event=…,
 * Expo Router shows `src/app/return/portal.tsx`, and that route calls
 * `completeReturn()`, which closes the browser. `openBrowserAsync` then
 * resolves and the visit counts as `returned`. If the organizer taps Done
 * instead, it resolves without the return link and counts as `dismissed`.
 *
 * iPhone only for now: on Android `openBrowserAsync` resolves as soon as the
 * tab opens and there is nothing to dismiss, so the return route does the
 * whole job there.
 */
export function createWebBrowserPortal(): Portal {
  let open = false;
  let returned = false;
  return {
    async openPortal(launch) {
      open = true;
      returned = false;
      try {
        const result = await WebBrowser.openBrowserAsync(launch.launchUrl, { dismissButtonStyle: 'done' });
        return returned || result.type === 'dismiss' ? 'returned' : 'dismissed';
      } finally {
        open = false;
      }
    },
    completeReturn() {
      if (!open) return false;
      returned = true;
      // Not every platform can dismiss; the return route has already brought the app forward.
      try {
        Promise.resolve(WebBrowser.dismissBrowser()).catch(() => undefined);
      } catch {
        // Nothing to close.
      }
      return true;
    },
  };
}
