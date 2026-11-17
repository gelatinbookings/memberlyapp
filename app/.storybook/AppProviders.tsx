import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeRepository, createMemoryStorage, type FakeSimulation, type TalentSimulation } from '@/data/fakeRepository';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { TestAccountId } from '@/data/testAccounts';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { CreateSheetProvider } from '@/features/create/CreateSheet';
import { EventDraftProvider, type EventDraft } from '@/features/events/EventDraftProvider';
import { LaunchProvider } from '@/features/launch/AnimatedSplash';
import { PaymentsProvider } from '@/lib/payments';
import { PortalProvider } from '@/lib/portal';
import { ThemeProvider } from '@/theme/theme';
import { darkPalette, size, space } from '@/theme/tokens';

/** An iPhone at 390 wide: the frame DESIGN.md lays screens out on. */
export const PHONE = { width: 390, height: 844, insets: { top: 47, left: 0, right: 0, bottom: 34 } } as const;

/**
 * How a story sits on the canvas.
 * - `padded` (default): a 390-wide phone column with the 20px screen gutter.
 * - `bare`: the full 390 column, no gutter (the tab bar, a sheet frame).
 * - `screen`: a whole 390×844 phone screen, for screens, overlay sheets and dialogs.
 */
export type StoryFrame = 'padded' | 'bare' | 'screen';

/**
 * What a story can ask of the sample world, under `parameters.memberly`.
 * Everything runs on the fake repository with no delay; nothing leaves the browser.
 */
export type MemberlyParameters = {
  /** Sign in as one of the four test accounts (testAccounts.ts). Default: the existing organizer. */
  account?: TestAccountId;
  /** False: nobody is signed in (Welcome, Sign in, Verify code). */
  signedIn?: boolean;
  /** Edge states the fake starts in (offline, failed reads, no alternates…). */
  simulation?: Partial<FakeSimulation>;
  /** How talent reads answer: `ok`, `unavailable` or `loading`. */
  talentMode?: TalentSimulation;
  /** The event open in Create New Event, for Date & time and Event details. */
  draft?: EventDraft;
  /** Route params and pathname the expo-router mock hands to the screen. */
  route?: { params?: Record<string, string | undefined>; pathname?: string };
};

/**
 * What every screen gets in the app: the dark theme, a fresh TanStack Query
 * client, the fake repository on memory storage (no delay), the session, the
 * test payment sheet and test portal, the event draft, the Create sheet and
 * safe-area insets. One fresh world per story.
 */
export function AppProviders({ memberly = {}, children }: { memberly?: MemberlyParameters; children: ReactNode }) {
  const { account, signedIn = true, simulation, talentMode, draft } = memberly;
  const [services] = useState(() => {
    const storage = createMemoryStorage();
    return {
      storage,
      repository: createFakeRepository({
        delayMs: 0,
        storage,
        // A named account signs in below, before anything reads.
        signedIn: signedIn && !account,
        simulation,
        talentMode: talentMode ? () => talentMode : undefined,
      }),
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity }, mutations: { gcTime: Infinity } },
      }),
    };
  });
  const [ready, setReady] = useState(!account);
  useEffect(() => {
    if (!account) return;
    let live = true;
    services.repository.fake.signInAs(account).then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [account, services]);

  return (
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: PHONE.width, height: PHONE.height }, insets: PHONE.insets }}>
      <QueryClientProvider client={services.queryClient}>
        {ready ? (
          <RepositoryProvider repository={services.repository} storage={services.storage}>
            <AuthProvider>
              <ThemeProvider appearance="dark">
                <PaymentsProvider>
                  <PortalProvider>
                    <EventDraftProvider initial={draft ?? null}>
                      <CreateSheetProvider>
                        <LaunchProvider value>{children}</LaunchProvider>
                      </CreateSheetProvider>
                    </EventDraftProvider>
                  </PortalProvider>
                </PaymentsProvider>
              </ThemeProvider>
            </AuthProvider>
          </RepositoryProvider>
        ) : null}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** The phone column every story renders in: black ground, 390 wide. */
export function PhoneFrame({ frame = 'padded', children }: { frame?: StoryFrame; children: ReactNode }) {
  return (
    <View style={[styles.column, frame === 'padded' ? styles.padded : null, frame === 'screen' ? styles.screen : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: PHONE.width, backgroundColor: darkPalette.background, gap: space.stack },
  padded: { padding: space.gutter, minHeight: size.minTarget },
  // Position relative and clipped, so an overlay sheet sits inside the phone and not the page.
  screen: { height: PHONE.height, overflow: 'hidden', position: 'relative', gap: 0 },
});
