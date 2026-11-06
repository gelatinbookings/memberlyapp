import { useLocalSearchParams } from 'expo-router';

import type { CodeIntent } from '@/data/types';
import { VerifyCodeView } from '@/features/auth/VerifyCodeView';

export default function VerifyScreen() {
  const { email = '', intent = 'sign-in', resend } = useLocalSearchParams<{ email?: string; intent?: CodeIntent; resend?: string }>();
  return <VerifyCodeView email={email} intent={intent} resendAfter={Number(resend) || 24} />;
}
