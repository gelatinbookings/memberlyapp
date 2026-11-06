import { useState } from 'react';
import { router } from 'expo-router';

import { Button, Notice, TextField } from '@/components/ui';
import { AuthSheet, OrRule } from '@/features/auth/components/AuthSheet';
import { LegalLine, LinkLine, ProviderButtons } from '@/features/auth/components/ProviderButtons';
import { isValidEmail } from '@/features/auth/email';
import { useSendCode } from '@/features/auth/useSendCode';
import { useOnline } from '@/lib/network';

/** Sign in: email and a code, or Google / Apple. No password anywhere. */
export default function SignInSheet() {
  const online = useOnline();
  const [email, setEmail] = useState('');
  const { send, sending, error } = useSendCode('sign-in');
  const valid = isValidEmail(email);

  return (
    <AuthSheet
      testID="sign-in-sheet"
      title="Enter your email"
      subtitle="Sign in to your account. We’ll send you a code, no password needed.">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={() => valid && online && send(email)}
      />
      {!online ? <Notice>You’re offline. We’ll send the code when you’re back.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button label="Send verification code" disabled={!valid || !online} loading={sending} onPress={() => send(email)} />
      <OrRule />
      <ProviderButtons disabled={!online} />
      <LinkLine lead="Don’t have an account?" action="Sign up here" onPress={() => router.replace('/create-account')} />
      <LegalLine />
    </AuthSheet>
  );
}

