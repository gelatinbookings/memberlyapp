import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';

import { getFakeControls } from '@/data/fakeRepository';
import { useRepository } from '@/data/RepositoryProvider';

import { resolvePaymentSheet } from './resolve';
import { TestPaymentSheet } from './TestPaymentSheet';
import type { PaymentResult, PaymentSheet, PaymentSheetSession } from './types';

type TestRequest = { session: PaymentSheetSession; resolve: (result: PaymentResult) => void };

type Payments = {
  sheet: PaymentSheet;
  /** The test payment sheet's state; unused once a real implementation is configured. */
  request: TestRequest | null;
  finish: (request: TestRequest, result: PaymentResult) => void;
  outlets: string[];
  mount: (id: string) => () => void;
};

const PaymentsContext = createContext<Payments | null>(null);

/**
 * Supplies the payment sheet to card holds and pass checkout.
 *
 * M8 passes the Stripe sheet as `implementation`. Until then the only sheet is
 * the test payment sheet, and it is chosen only when the repository is the
 * fake one. With a real repository and no implementation, a production build
 * throws here and a development build throws when a payment is asked for.
 */
export function PaymentsProvider({ implementation, children }: { implementation?: PaymentSheet; children: ReactNode }) {
  const fake = getFakeControls(useRepository());
  const [request, setRequest] = useState<TestRequest | null>(null);
  const [outlets, setOutlets] = useState<string[]>([]);

  const finish = useCallback((done: TestRequest, result: PaymentResult) => {
    done.resolve(result);
    setRequest((current) => (current === done ? null : current));
  }, []);

  const testSheet = useMemo<PaymentSheet>(
    () => ({
      presentPaymentSheet: (session) =>
        new Promise<PaymentResult>((resolve) => {
          setRequest((open) => {
            // One payment at a time: a sheet left open gives way to the new one.
            open?.resolve({ status: 'cancelled' });
            return { session, resolve };
          });
        }),
    }),
    [],
  );

  const mount = useCallback((id: string) => {
    setOutlets((ids) => [...ids, id]);
    return () => setOutlets((ids) => ids.filter((x) => x !== id));
  }, []);

  const sheet = useMemo(
    () => resolvePaymentSheet({ implementation, testSheet: fake ? testSheet : null, dev: __DEV__ }),
    [implementation, fake, testSheet],
  );
  const value = useMemo(() => ({ sheet, request, finish, outlets, mount }), [sheet, request, finish, outlets, mount]);
  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

function usePaymentsContext(): Payments {
  const payments = useContext(PaymentsContext);
  if (!payments) throw new Error('usePayments must be used inside PaymentsProvider');
  return payments;
}

/** The payment sheet: `presentPaymentSheet(session)` resolves succeeded, cancelled or failed. */
export function usePayments(): PaymentSheet {
  return usePaymentsContext().sheet;
}

/** True while the test payment sheet is up, so a sheet underneath can step out of VoiceOver's way. */
export function usePaymentSheetOpen(): boolean {
  return usePaymentsContext().request != null;
}

/**
 * Where the test payment sheet appears. A screen that takes payments renders
 * this last, inside its full-screen container. The native sheet (M8) presents
 * itself over the app, so with a real implementation this renders nothing.
 * When screens are stacked, only the top one shows the sheet.
 */
export function PaymentSheetOutlet() {
  const id = useId();
  const { request, finish, outlets, mount } = usePaymentsContext();
  const fake = getFakeControls(useRepository());
  useEffect(() => mount(id), [mount, id]);
  if (!request || !fake || outlets[outlets.length - 1] !== id) return null;
  return (
    <TestPaymentSheet
      key={request.session.clientSecret}
      session={request.session}
      fake={fake}
      onResult={(result) => finish(request, result)}
    />
  );
}
