import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { getFakeControls, type FakeControls, type FakePortalBooking } from '@/data/fakeRepository';
import { useRepository } from '@/data/RepositoryProvider';

import { resolvePortal } from './resolve';
import { TestPortalScreen } from './TestPortalScreen';
import type { Portal, PortalResult } from './types';
import { createWebBrowserPortal } from './webBrowserPortal';

/** One visit to the test portal. `booking` is null when the launch had expired or was used before. */
type TestVisit = { booking: FakePortalBooking | null; resolve: (result: PortalResult) => void };

/**
 * The test portal's one open visit, kept outside React so the return link
 * (which arrives from the system, not from a render) can end it.
 */
function createTestPortal(fake: FakeControls) {
  let visit: TestVisit | null = null;
  const listeners = new Set<() => void>();
  const show = (next: TestVisit | null) => {
    visit = next;
    listeners.forEach((listener) => listener());
  };
  const end = (done: TestVisit, result: PortalResult) => {
    done.resolve(result);
    if (visit === done) show(null);
  };
  const portal: Portal = {
    openPortal: (launch) =>
      new Promise<PortalResult>((resolve) => {
        // One portal at a time: one left open gives way to the new one.
        visit?.resolve('dismissed');
        // A launch opens once. Using it here, on the tap, is what makes a second opening fail.
        show({ booking: fake.redeemLaunch(launch.launchUrl), resolve });
      }),
    completeReturn: () => {
      if (!visit) return false;
      end(visit, 'returned');
      return true;
    },
  };
  return {
    portal,
    end,
    current: () => visit,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type TestPortal = ReturnType<typeof createTestPortal>;

const noVisit = () => null;
const noSubscription = () => () => {};

/** Events the organizer came back to before their Lineup was there to say so. */
function createReturns() {
  const events = new Set<string>();
  return { mark: (eventId: string) => void events.add(eventId), take: (eventId: string) => events.delete(eventId) };
}

type PortalContextValue = {
  portal: Portal;
  /** The return link arrived for an event. Closes an open portal, or remembers the return for the Lineup to pick up. */
  completeReturn: (eventId: string | null) => boolean;
  /** Remember that the organizer came back from Gelatin for this event, for the Lineup about to open. */
  markReturn: (eventId: string) => void;
  /** True once after a return for this event that no open Lineup has shown yet. */
  takeReturn: (eventId: string) => boolean;
  /** The test portal, when the repository is the fake one. */
  test: TestPortal | null;
  outlets: string[];
  mount: (id: string) => () => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

/**
 * Supplies the way into Gelatin's portal (GEL-1024), the same shape as
 * PaymentsProvider. With the fake repository the portal is the in-app test
 * portal, clearly labelled, whose buttons play the DJ. With any other
 * repository it is Gelatin's page in the system's in-app browser, unless an
 * `implementation` is passed.
 */
export function PortalProvider({ implementation, children }: { implementation?: Portal; children: ReactNode }) {
  const fake = getFakeControls(useRepository());
  const test = useMemo(() => (fake ? createTestPortal(fake) : null), [fake]);
  const [returns] = useState(createReturns);
  const [outlets, setOutlets] = useState<string[]>([]);

  const portal = useMemo(
    () => resolvePortal({ implementation, testPortal: test?.portal ?? null, real: createWebBrowserPortal }),
    [implementation, test],
  );

  const mount = useCallback((id: string) => {
    setOutlets((ids) => [...ids, id]);
    return () => setOutlets((ids) => ids.filter((x) => x !== id));
  }, []);
  const completeReturn = useCallback(
    (eventId: string | null) => {
      // An open portal hears about it through `openPortal`; with none open, the Lineup picks the return up.
      const wasOpen = portal.completeReturn();
      if (!wasOpen && eventId) returns.mark(eventId);
      return wasOpen;
    },
    [portal, returns],
  );

  const value = useMemo(
    () => ({ portal, completeReturn, markReturn: returns.mark, takeReturn: returns.take, test, outlets, mount }),
    [portal, completeReturn, returns, test, outlets, mount],
  );
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

function usePortalContext(): PortalContextValue {
  const context = useContext(PortalContext);
  if (!context) throw new Error('usePortal must be used inside PortalProvider');
  return context;
}

/** The portal: `openPortal(launch)` resolves `returned` or `dismissed`. */
export function usePortal(): Portal {
  return usePortalContext().portal;
}

/** For the return route and the screens that land the organizer after Gelatin. */
export function usePortalReturn(): Pick<PortalContextValue, 'completeReturn' | 'markReturn' | 'takeReturn'> {
  const { completeReturn, markReturn, takeReturn } = usePortalContext();
  return useMemo(() => ({ completeReturn, markReturn, takeReturn }), [completeReturn, markReturn, takeReturn]);
}

/** The test portal's open visit, or null: with a real portal there is never one. */
function useTestVisit(test: TestPortal | null): TestVisit | null {
  return useSyncExternalStore(test?.subscribe ?? noSubscription, test?.current ?? noVisit, test?.current ?? noVisit);
}

/** True while the test portal is up. */
export function usePortalOpen(): boolean {
  return useTestVisit(usePortalContext().test) != null;
}

/**
 * Where the test portal appears. A screen that hands off to Gelatin renders
 * this last, inside its full-screen container. The real portal presents
 * itself over the app, so with it this renders nothing. When screens are
 * stacked, only the top one shows it.
 */
export function PortalOutlet() {
  const id = useId();
  const { test, outlets, mount } = usePortalContext();
  const fake = getFakeControls(useRepository());
  const visit = useTestVisit(test);
  useEffect(() => mount(id), [mount, id]);
  if (!visit || !test || !fake || outlets[outlets.length - 1] !== id) return null;
  return <TestPortalScreen booking={visit.booking} fake={fake} onDone={(result) => test.end(visit, result)} />;
}
