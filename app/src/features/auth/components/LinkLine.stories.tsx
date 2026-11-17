import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { LinkLine } from './ProviderButtons';

const meta = {
  title: 'Molecules/LinkLine',
  component: LinkLine,
  tags: ['autodocs'],
  args: { lead: 'Don’t have an account?', action: 'Sign up here', onPress: fn() },
  parameters: {
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'A centred muted line with one brand-coloured action at its end. The whole line is one 44pt link. Exported from `ProviderButtons.tsx`.',
          use: 'at the foot of Sign in and Create account to switch between them, or for a quiet way out such as resending a code.',
          avoid: 'for a main action (use `Button`) or for a link inside a paragraph of body text.',
          usage: `<LinkLine lead="Don’t have an account?" action="Sign up here" onPress={() => router.replace('/create-account')} />`,
          a11y: [
            'Role `link`, spoken as the whole line: “Don’t have an account? Sign up here”.',
            'The whole row is the target, at least 44pt tall.',
          ],
          do: ['Keep the action to two or three words that say where it goes.'],
          dont: ['Underline it or set it in another colour than `brand-text`.', 'Put two actions on one line.'],
        }),
      },
    },
  },
} satisfies Meta<typeof LinkLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToCreateAccount: Story = {
  name: 'To Create account',
  parameters: storyDoc('At the foot of Sign in, for someone who is new.'),
};

export const ToSignIn: Story = {
  name: 'To Sign in',
  args: { lead: 'Already have an account?', action: 'Sign in' },
  parameters: storyDoc('At the foot of Create account, for someone who already has one.'),
};
