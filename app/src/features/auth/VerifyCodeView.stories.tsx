import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { screen, userEvent } from 'storybook/test';

import { FAKE_CODES, RESEND_SECONDS } from '@/data/fakeRepository';
import { TEST_ACCOUNTS } from '@/data/testAccounts';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { VerifyCodeView } from './VerifyCodeView';

/** A test account's email on the reserved .test domain. */
const EMAIL = TEST_ACCOUNTS[0].email;
/** Any four digits that are neither the fake's sign-in code nor its expired one. */
const WRONG = '9876';

/** Types into the hidden one-time-code field, as the number pad or autofill would. */
const enter = (code: string) => async () => {
  await userEvent.type(await screen.findByTestId('code-input'), code);
};

const meta = {
  title: 'Organisms/VerifyCodeView',
  component: VerifyCodeView,
  tags: ['autodocs'],
  args: { email: EMAIL, intent: 'sign-in', resendAfter: RESEND_SECONDS },
  argTypes: {
    intent: { control: 'inline-radio', options: ['sign-in', 'sign-up'] },
    resendAfter: { control: { type: 'number', min: 0, max: 60 } },
    email: { control: 'text' },
  },
  parameters: {
    frame: 'screen',
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'Enter the code: four boxes filled from the number pad, the next box taking focus, a hidden field that takes the one-time code from autofill. A wrong code turns the boxes red and shakes them; an expired one says a new code was sent; the right one draws a check and “You’re in” before the app moves on. Resend counts down, then becomes a link. It is a whole screen with a pinned Verify.',
          use: 'after Send verification code on Sign in or Create account. There are no passwords anywhere.',
          avoid: 'for any other code or PIN. To try the sample accounts without a code, use Test accounts on Sign in.',
          usage: `// src/app/(auth)/verify.tsx
<VerifyCodeView email={email} intent={intent} resendAfter={Number(resend) || 24} />`,
          a11y: [
            'The four boxes are one control, “Verification code”; the hidden field carries the same name and the one-time-code content type.',
            'The error is a notice read after the boxes, not only a colour change.',
            'Digits pop in, a wrong code shakes, success draws a check; under Reduce Motion there is no pop or shake and the check shows briefly.',
            'Resend is spoken as “Resend in 0:24” while it counts, then as the button “Resend code”.',
          ],
          do: ['Verify by itself as the fourth digit lands.', 'Say what to do next in the error: check the latest email, or resend.'],
          dont: ['Clear the code on a wrong entry before the person has seen it.', 'Ask for a password.'],
        }),
      },
    },
  },
} satisfies Meta<typeof VerifyCodeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rest: Story = {
  parameters: storyDoc('The code was just sent: the first box is active and Resend counts down.'),
};

export const WrongCode: Story = {
  name: 'Wrong code',
  play: enter(WRONG),
  parameters: storyDoc('Four digits that don’t match: the boxes turn red and shake, and the notice says what to do.'),
};

export const Expired: Story = {
  play: enter(FAKE_CODES.expired),
  parameters: storyDoc('The code had expired: the boxes clear, a new code is on its way, and Resend counts down again.'),
};

export const Success: Story = {
  play: enter(FAKE_CODES.success),
  parameters: storyDoc('The right code: a check draws in with “You’re in”, then the app moves on (logged to Actions).'),
};

export const CouldntCheck: Story = {
  name: 'Couldn’t check the code',
  play: enter(FAKE_CODES.success),
  parameters: {
    memberly: { signedIn: false, failing: ['verifyCode'] },
    ...storyDoc('The server couldn’t check the code: an error notice says to try again, and the digits stay.'),
  },
};

export const ResendReady: Story = {
  name: 'Resend ready',
  args: { resendAfter: 0 },
  parameters: storyDoc('The countdown has run out: Resend code is a link.'),
};
