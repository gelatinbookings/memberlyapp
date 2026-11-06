import { areaFromSegments, gateDecision, resumableHref } from '../gate';

describe('auth gate routing decision', () => {
  const signedOut = { status: 'signedOut' as const, onboardingDone: false };
  const needsOnboarding = { status: 'signedIn' as const, onboardingDone: false };
  const ready = { status: 'signedIn' as const, onboardingDone: true };

  it('waits while the stored session loads', () => {
    expect(gateDecision({ status: 'loading', onboardingDone: false }, { area: 'app' })).toBe('stay');
  });

  it('sends a signed-out member to Welcome from anywhere but the sign-in screens', () => {
    expect(gateDecision(signedOut, { area: 'app' })).toBe('welcome');
    expect(gateDecision(signedOut, { area: 'onboarding' })).toBe('welcome');
    expect(gateDecision(signedOut, { area: 'auth' })).toBe('stay');
  });

  it('sends a new member to preferences until onboarding is done', () => {
    expect(gateDecision(needsOnboarding, { area: 'auth' })).toBe('onboarding');
    expect(gateDecision(needsOnboarding, { area: 'app' })).toBe('onboarding');
    expect(gateDecision(needsOnboarding, { area: 'onboarding' })).toBe('stay');
  });

  it('lets a ready member into the app and out of sign-in and onboarding', () => {
    expect(gateDecision(ready, { area: 'app' })).toBe('stay');
    expect(gateDecision(ready, { area: 'auth' })).toBe('app');
    expect(gateDecision(ready, { area: 'onboarding' })).toBe('app');
  });

  it('keeps Me → Preferences open in edit mode', () => {
    expect(gateDecision(ready, { area: 'onboarding', editingPreferences: true })).toBe('stay');
  });

  it('maps route segments to areas', () => {
    expect(areaFromSegments(['(auth)', 'verify'])).toBe('auth');
    expect(areaFromSegments(['preferences'])).toBe('onboarding');
    expect(areaFromSegments(['permissions'])).toBe('onboarding');
    expect(areaFromSegments(['(tabs)', 'explore'])).toBe('app');
    expect(areaFromSegments(['event', '[id]'])).toBe('app');
  });

  it('remembers deep links worth resuming, not Home or sign-in screens', () => {
    expect(resumableHref('/event/e_rooftop_hours', 'app')).toBe('/event/e_rooftop_hours');
    expect(resumableHref('/', 'app')).toBeNull();
    expect(resumableHref('/sign-in', 'auth')).toBeNull();
  });
});
