import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Button, Text, TextField } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { isValidEmail } from '../email';
import { AuthSheet, OrRule } from './AuthSheet';
import { LegalLine, LinkLine, ProviderButtons } from './ProviderButtons';
import { TestAccountsEntry } from './TestAccountsSheet';
import { WelcomePoster } from './WelcomeBackdrop';

/** The sheet's body as Sign in and Create account fill it: email, the providers, the links. */
function EmailBody({ withName = false, testAccounts = false }: { withName?: boolean; testAccounts?: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  return (
    <>
      {withName ? <TextField label="Your name" value={name} onChangeText={setName} placeholder="First and last name" autoCapitalize="words" /> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button label="Send verification code" disabled={!isValidEmail(email)} onPress={fn()} />
      <OrRule />
      <ProviderButtons />
      <LinkLine lead={withName ? 'Already have an account?' : 'Don’t have an account?'} action={withName ? 'Sign in' : 'Sign up here'} onPress={fn()} />
      <LegalLine />
      {testAccounts ? <TestAccountsEntry /> : null}
    </>
  );
}

const meta = {
  title: 'Organisms/AuthSheet',
  component: AuthSheet,
  subcomponents: { OrRule },
  tags: ['autodocs'],
  args: {
    title: 'Enter your email',
    subtitle: 'Sign in to your account. We’ll send you a code, no password needed.',
    children: null,
  },
  argTypes: { title: { control: 'text' }, subtitle: { control: 'text' }, children: { control: false } },
  render: (args) => (
    <>
      <WelcomePoster />
      <AuthSheet {...args}>
        <EmailBody testAccounts />
      </AuthSheet>
    </>
  ),
  parameters: {
    frame: 'screen',
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'The sheet Sign in and Create account rise in, over Welcome (which keeps playing, dimmed to 35%). The grab handle, the Memberly wordmark, a 24pt Display title and a muted line, then whatever the screen puts in: the email field, Send verification code, “or”, the Google and Apple buttons, the links. `OrRule` is the “or” line between the email path and the providers.',
          use: 'for the two auth sheets, rendered by their routes as transparent modals over Welcome.',
          avoid: 'for any task after sign-in: use `Sheet` or `OverlaySheet`. It has no swipe to close; tapping the dimmed Welcome closes it.',
          usage: `<AuthSheet title="Enter your email" subtitle="Sign in to your account. We’ll send you a code, no password needed.">
  <TextField label="Email" … />
  <Button label="Send verification code" onPress={send} />
  <OrRule />
  <ProviderButtons />
</AuthSheet>`,
          a11y: [
            'The sheet is a modal for VoiceOver; the title is a header and the wordmark is hidden.',
            'The dimmed Welcome behind is a button spoken as “Close”.',
            'It springs up; under Reduce Motion it fades in.',
            'The content scrolls and rises with the keyboard, so Send stays in reach.',
          ],
          do: ['Keep one primary action: Send verification code.', 'Say there is no password, in the subtitle.'],
          dont: ['Ask for a password.', 'Put a gradient over the sheet: the only fade is the black scrim over the Welcome video.'],
        }),
      },
    },
  },
} satisfies Meta<typeof AuthSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {
  name: 'Sign in',
  parameters: storyDoc('Sign in over Welcome: email and a code, or Google and Apple, with Test accounts on sample data.'),
};

export const CreateAccount: Story = {
  name: 'Create account',
  args: { title: 'Create your account', subtitle: 'We’ll send a code to your email. No password to remember.' },
  render: (args) => (
    <>
      <WelcomePoster />
      <AuthSheet {...args}>
        <EmailBody withName />
      </AuthSheet>
    </>
  ),
  parameters: storyDoc('Create account: a name and an email, the same providers, and a link back to Sign in.'),
};

export const Placeholder: Story = {
  render: (args) => (
    <>
      <WelcomePoster />
      <AuthSheet {...args} title="Sheet title" subtitle="One muted line under the title.">
        <Text tone="muted">The screen’s own fields and actions go here.</Text>
      </AuthSheet>
    </>
  ),
  parameters: storyDoc('The frame with placeholder content: handle, wordmark, title, line, body.'),
};
