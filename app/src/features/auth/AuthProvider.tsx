import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useRepository } from '@/data/RepositoryProvider';
import type { AuthProviderName, SendCodeInput, Session, VerifyCodeResult } from '@/data/types';

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
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The member's session for the whole app. Reads the stored session once at
 * launch; sign in, onboarding and sign out update it, and the root layout's
 * gate routes from it.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const repo = useRepository();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let live = true;
    repo
      .getSession()
      .catch(() => null)
      .then((s) => {
        if (!live) return;
        setSession(s);
        setStatus(s ? 'signedIn' : 'signedOut');
      });
    return () => {
      live = false;
    };
  }, [repo]);

  const signedIn = useCallback(
    (s: Session) => {
      // Whoever was signed in before, nothing of theirs stays in the cache.
      queryClient.clear();
      setSession(s);
      setStatus('signedIn');
    },
    [queryClient],
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
          signedIn(result.session);
        }
        return result;
      },
      signInWithProvider: async (provider) => {
        const s = await repo.signInWithProvider(provider);
        signedIn(s);
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
    }),
    [status, session, repo, signedIn, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
