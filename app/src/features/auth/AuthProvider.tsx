import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getFakeControls } from '@/data/fakeRepository';
import { useRepository, useStorage } from '@/data/RepositoryProvider';
import { TEST_ACCOUNTS, type TestAccount, type TestAccountId } from '@/data/testAccounts';
import type { AuthProviderName, SendCodeInput, Session, VerifyCodeResult } from '@/data/types';

import { claimDevice } from './deviceOwner';
import type { AuthStatus } from './gate';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  sendCode: (input: SendCodeInput) => Promise<{ resendAfterSeconds: number }>;
  /** `beforeSignIn` runs after a correct code and before the gate moves on (the check mark draws in). */
  verifyCode: (email: string, code: string, options?: { beforeSignIn?: () => Promise<void> }) => Promise<VerifyCodeResult>;
  signInWithProvider: (provider: AuthProviderName) => Promise<Session>;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * The test accounts, only while the app runs on the sample (fake)
   * repository, in any build. Null with a real repository: there is nothing
   * to pick and no way to sign in without a code.
   */
  testAccounts: readonly TestAccount[] | null;
  signInAsTestAccount: (id: TestAccountId) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The member's session for the whole app. Reads the stored session once at
 * launch; sign in, onboarding and sign out update it, and the root layout's
 * gate routes from it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const repo = useRepository();
  const storage = useStorage();
  const queryClient = useQueryClient();
  const fake = getFakeControls(repo);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let live = true;
    repo
      .getSession()
      .catch(() => null)
      .then((s) => {
        if (!live) return;
        if (s) void claimDevice(storage, s.viewerId, { atLaunch: true });
        setSession(s);
        setStatus(s ? 'signedIn' : 'signedOut');
      });
    return () => {
      live = false;
    };
  }, [repo, storage]);

  const signedIn = useCallback(
    async (s: Session) => {
      // Whoever was signed in before, nothing of theirs stays: not in the cache, not on the phone.
      await claimDevice(storage, s.viewerId);
      queryClient.clear();
      setSession(s);
      setStatus('signedIn');
    },
    [queryClient, storage],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      sendCode: (input) => repo.sendCode(input),
      verifyCode: async (email, code, options) => {
        const result = await repo.verifyCode(email, code);
        if (result.ok) {
          await options?.beforeSignIn?.();
          await signedIn(result.session);
        }
        return result;
      },
      signInWithProvider: async (provider) => {
        const s = await repo.signInWithProvider(provider);
        await signedIn(s);
        return s;
      },
      completeOnboarding: async () => {
        setSession(await repo.completeOnboarding());
      },
      signOut: async () => {
        await repo.signOut();
        queryClient.clear();
        setSession(null);
        setStatus('signedOut');
      },
      testAccounts: fake ? TEST_ACCOUNTS : null,
      signInAsTestAccount: async (id) => {
        if (!fake) throw new Error('Test accounts exist only on the sample repository');
        await signedIn(await fake.signInAs(id));
      },
    }),
    [status, session, repo, signedIn, queryClient, fake],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
