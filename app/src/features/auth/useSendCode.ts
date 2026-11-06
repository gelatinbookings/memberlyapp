import { useState } from 'react';
import { router } from 'expo-router';

import type { CodeIntent } from '@/data/types';

import { useAuth } from './AuthProvider';

/** Ask for a code, then open Verification code with what it needs. */
export function useSendCode(intent: CodeIntent) {
  const auth = useAuth();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (email: string, name?: string) => {
    setSending(true);
    setError(null);
    try {
      const { resendAfterSeconds } = await auth.sendCode({ email: email.trim(), intent, name: name?.trim() });
      router.push({
        pathname: '/verify',
        params: { email: email.trim(), intent, resend: String(resendAfterSeconds) },
      });
    } catch {
      setError('We couldn’t send a code. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return { send, sending, error };
}
