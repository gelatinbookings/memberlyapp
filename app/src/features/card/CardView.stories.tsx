import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { CardView } from './CardView';

const meta = {
  title: 'Organisms/CardView',
  component: CardView,
  tags: ['autodocs'],
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'My Memberly Card: the purple card with the Memberly wordmark, a large QR on white for the door, your name and communities; then Your passes and Your memberships as grouped lists, with expired ones faded and marked. Offline it shows the last saved card, marked “Shown offline”, while its code is still valid.',
          use: 'as the Card screen, opened from the pass row on Home and from Me. It is not a tab.',
          avoid: 'to show someone else’s card or a pass for sale (the event page and `PassSheet` do that). Add to Wallet stays hidden until the wallet decision lands.',
          usage: `// src/app/card.tsx
export default function CardScreen() {
  useBrightScreen();
  return <CardView />;
}`,
          a11y: [
            'The title is a header; Back is a 44pt round button.',
            'Each membership row is one element: “Second Sundays, Inner Circle · renews Dec 1, Active”.',
            'The QR stays black on white in every theme so a door scanner can read it.',
            'The Card screen turns the brightness up while open and puts it back on close.',
          ],
          do: ['Keep the QR large and on white.', 'Say “Shown offline” when the card comes from the phone’s cache.'],
          dont: ['Tint the QR purple.', 'Give the Card its own tab.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PassesAndMemberships: Story = {
  name: 'Passes and memberships',
  parameters: storyDoc('The existing organizer: a pass for Friday, three active memberships and one lapsed.'),
};

export const Member: Story = {
  parameters: {
    memberly: { account: 'existing-member' },
    ...storyDoc('A member with two passes and memberships, one of them lapsed.'),
  },
};

export const NoMemberships: Story = {
  name: 'No memberships yet',
  parameters: {
    memberly: { account: 'new-user' },
    ...storyDoc('Someone who has just signed up: the card works at the door, and a link to Explore fills the empty list.'),
  },
};
