import { useState } from 'react';
import { router } from 'expo-router';

import { Button, Notice, TextField } from '@/components/ui';
import { AuthSheet, OrRule } from '@/features/auth/components/AuthSheet';
import { LegalLine, LinkLine, ProviderButtons } from '@/features/auth/components/ProviderButtons';
import { isValidEmail } from '@/features/auth/email';
import { useSendCode } from '@/features/auth/useSendCode';
import { useOnline } from '@/lib/network';

/** Create account: name and email, then a code. Or Google / Apple. */
export default function CreateAccountSheet() {
  const online = useOnline();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { send, sending, error } = useSendCode('sign-up');
  const valid = name.trim().length > 0 && isValidEmail(email);

  return (
    <AuthSheet
      testID="create-account-sheet"
      title="Create your account"
      subtitle="We’ll send a code to your email. No password to remember.">
      <TextField
        label="Your name"
        value={name}
        onChangeText={setName}
        placeholder="First and last name"
        textContentType="name"
        autoComplete="name"
        autoCapitalize="words"
        returnKeyType="next"
      />
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
        onSubmitEditing={() => valid && online && send(email, name)}
      />
      {!online ? <Notice>You’re offline. We’ll send the code when you’re back.</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button label="Send verification code" disabled={!valid || !online} loading={sending} onPress={() => send(email, name)} />
      <OrRule />
      <ProviderButtons disabled={!online} />
      <LinkLine lead="Already have an account?" action="Sign in" onPress={() => router.replace('/sign-in')} />
      <LegalLine />
    </AuthSheet>
  );
}
