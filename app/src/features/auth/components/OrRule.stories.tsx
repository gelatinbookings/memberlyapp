import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Button } from '@/components/ui';
import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { OrRule } from './AuthSheet';
import { ProviderButtons } from './ProviderButtons';

const meta = {
  title: 'Molecules/OrRule',
  component: OrRule,
  tags: ['autodocs'],
  parameters: {
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'Two 1px rules with a muted “or” between them. Exported from `AuthSheet.tsx`.',
          use: 'between the email path and the provider buttons on Sign in and Create account.',
          avoid: 'as a general divider: rows inside a card use the card’s 1px rules, and sections are separated by space.',
          usage: `<Button label="Send verification code" onPress={send} />
<OrRule />
<ProviderButtons />`,
          a11y: ['Hidden from VoiceOver: the buttons on either side already say what they do.'],
          do: ['Use it only between two ways to do the same thing.'],
          dont: ['Uppercase the “or”.', 'Stack two rules on one screen.'],
        }),
      },
    },
  },
} satisfies Meta<typeof OrRule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('On its own: a muted “or” between two rules.'),
};

export const BetweenPaths: Story = {
  name: 'Between paths',
  render: () => (
    <Stack gap={16}>
      <Button label="Send verification code" />
      <OrRule />
      <ProviderButtons />
    </Stack>
  ),
  parameters: storyDoc('As on Sign in: the email path above, the providers below.'),
};
