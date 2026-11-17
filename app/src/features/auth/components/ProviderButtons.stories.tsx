import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { ProviderButtons } from './ProviderButtons';

const meta = {
  title: 'Molecules/ProviderButtons',
  component: ProviderButtons,
  tags: ['autodocs'],
  args: { disabled: false },
  argTypes: { disabled: { control: 'boolean' } },
  parameters: {
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'Continue with Google everywhere and Continue with Apple on iPhone, stacked 10px apart. Each is a 52pt card-filled button with a 6px radius, the provider’s mark and a 16px/600 label. While one signs in, it shows a spinner and both are disabled. In this build both sign in the sample member.',
          use: 'on Sign in and Create account, under the email path and the “or” rule.',
          avoid: 'anywhere you’re already signed in, or as the screen’s primary action: the email path leads.',
          usage: `<ProviderButtons disabled={sending} />`,
          a11y: [
            'Each is a `button` spoken by its label, with `disabled` and `busy` states.',
            '52pt tall; the label scales with Dynamic Type.',
            'The marks are hidden from VoiceOver; the label names the provider.',
          ],
          do: [
            'Keep Google’s mark in its own colours and Apple’s in the text colour.',
            'Say what to do if sign-in fails: try again, or use a code sent to your email.',
          ],
          dont: ['Fill a provider button purple: purple is the email path’s primary action.', 'Show Apple on Android.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ProviderButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('On Sign in and Create account. In the browser only Google shows, as on Android; on iPhone Apple sits under it.'),
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: storyDoc('While the email code is sending: both buttons wait at 50% so nothing runs twice.'),
};
