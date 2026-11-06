/**
 * Where the root layout sends someone, from the session and the screen they
 * are on. Pure, so the routing rules are tested without a navigator.
 */

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export type GateState = { status: AuthStatus; onboardingDone: boolean };

/** auth: Welcome, Intro, Sign in, Create account, Verify. onboarding: Preferences, Permissions. */
export type GateArea = 'auth' | 'onboarding' | 'app';

export type GateLocation = {
  area: GateArea;
  /** Me → Preferences reopens the picker in edit mode; that is part of the app, not onboarding. */
  editingPreferences?: boolean;
};

/** `stay` leaves the screen alone; the rest name where to go. */
export type GateDecision = 'stay' | 'welcome' | 'onboarding' | 'app';

export function gateDecision(state: GateState, location: GateLocation): GateDecision {
  if (state.status === 'loading') return 'stay';
  if (state.status === 'signedOut') return location.area === 'auth' ? 'stay' : 'welcome';
  if (!state.onboardingDone) return location.area === 'onboarding' ? 'stay' : 'onboarding';
  if (location.area === 'auth') return 'app';
  if (location.area === 'onboarding' && !location.editingPreferences) return 'app';
  return 'stay';
}

/** The route group a path belongs to, from Expo Router's segments. */
export function areaFromSegments(segments: readonly string[]): GateArea {
  const first = segments[0];
  if (first === '(auth)') return 'auth';
  if (first === 'preferences' || first === 'permissions') return 'onboarding';
  return 'app';
}

/** A link worth resuming after sign-in: anything but the bare Home path. */
export function resumableHref(pathname: string, area: GateArea): string | null {
  if (area !== 'app' || pathname === '/' || pathname === '') return null;
  return pathname;
}
