import { useEffect, useRef } from 'react';
import { router, useGlobalSearchParams, usePathname, useRootNavigationState, useSegments } from 'expo-router';

import { useAuth } from './AuthProvider';
import { areaFromSegments, gateDecision, resumableHref, type GateDecision } from './gate';

/** Start a fresh history at `href`, so Back never returns to a screen the gate left. */
function resetTo(href: '/' | '/welcome' | '/preferences') {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

/**
 * Signed out → Welcome; signed in without onboarding → Preferences; otherwise
 * the tabs. A deep link opened while signed out is remembered and opened
 * after sign-in.
 */
export function useAuthGate(): GateDecision {
  const { status, session } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ edit?: string }>();
  const navReady = !!useRootNavigationState()?.key;
  const pending = useRef<string | null>(null);
  // Signing out is not a deep link: whatever screen the member left from is not resumed.
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (status === 'signedIn') wasSignedIn.current = true;
  }, [status]);

  const area = areaFromSegments(segments);
  const decision = gateDecision(
    { status, onboardingDone: !!session?.onboardingDone },
    { area, editingPreferences: params.edit === '1' },
  );

  useEffect(() => {
    if (!navReady || decision === 'stay') return;
    if (decision === 'welcome') {
      if (wasSignedIn.current) {
        wasSignedIn.current = false;
        pending.current = null;
      } else {
        pending.current = resumableHref(pathname, area) ?? pending.current;
      }
      resetTo('/welcome');
    } else if (decision === 'onboarding') {
      resetTo('/preferences');
    } else {
      const next = pending.current;
      pending.current = null;
      resetTo('/');
      // Open the remembered link on top of Home so Back lands somewhere sensible.
      if (next) router.push(next as never);
    }
  }, [decision, navReady, pathname, area]);

  return status === 'loading' ? 'stay' : decision;
}
