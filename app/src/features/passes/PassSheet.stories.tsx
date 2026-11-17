import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';

import { PassSheet } from './PassSheet';

const meta = {
  title: 'Organisms/PassSheet',
  component: PassSheet,
  tags: ['autodocs'],
  args: { eventId: SAMPLE_EVENT.passes },
  argTypes: {
    eventId: { control: 'select', options: ['e_rooftop_hours', 'e_long_table', 'e_warehouse_friday', 'e_daylight', 'e_night_service'] },
    confirmTimeoutMs: { control: false },
    pollMs: { control: false },
  },
  render: (args) => (
    <>
      <ScreenBehind title="Event" />
      <PassSheet {...args} />
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Get a pass: a sheet over the event page listing the event’s pass types, each a card with its name, price (or “Free for members”, or a Sold out pill), what’s included and Get or Claim. A paid pass goes through the shared payment sheet with the server’s total; a members-free pass is claimed in one tap. It ends on “Your pass is on your Memberly Card” with Show my pass, or, if confirming takes long, says it will land on the card.',
          use: 'from Get a pass on a member-facing event page (the `event/[id]/pass` route renders it).',
          avoid: 'for setting up passes as an organizer (`PassFormScreen`, `PassListScreen`) or for membership tiers (Create community). It never shows a booker or other buyers.',
          usage: `// src/app/event/[id]/pass.tsx
<PassSheet eventId={id} />`,
          a11y: [
            'The sheet is spoken as “Get a pass”; the title is a header.',
            'Get and Claim are 44pt round pills spoken with the pass and its price, “Claim Member pass, Free for members”.',
            'While a pass is being got the row shows a busy spinner; the others are disabled.',
            'While the payment sheet is up, this sheet is `covered` and out of VoiceOver’s reach.',
            'The finished state draws a check; under Reduce Motion it appears whole.',
          ],
          do: ['Show the server’s price and total only.', 'Say where the pass goes: on the Memberly Card, shown at the door.'],
          dont: ['Hide a sold-out pass; show it dimmed with the pill.', 'Ask for card details in the sheet.'],
        }),
      },
    },
  },
} satisfies Meta<typeof PassSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChooseAPass: Story = {
  name: 'Choose a pass',
  parameters: storyDoc('An event with a paid pass, a members-free pass you can claim, and a sold-out table.'),
};

export const OnePaidPass: Story = {
  name: 'One paid pass',
  args: { eventId: 'e_long_table' },
  parameters: storyDoc('A single paid pass. Get opens the test payment sheet with the server’s total; pay to see the finished state.'),
};

export const AlreadyOnYourCard: Story = {
  name: 'Already on your card',
  args: { eventId: 'e_warehouse_friday' },
  parameters: storyDoc('You already hold a pass for this event: the sheet opens on the finished state with Show my pass.'),
};

export const SlowToConfirm: Story = {
  name: 'Slow to confirm',
  args: { eventId: 'e_long_table' },
  parameters: {
    memberly: { simulation: { slowPassOrder: true } },
    ...storyDoc('Get, then pay: confirming takes longer than ten seconds, so the sheet says the pass will land on your card.'),
  },
};

export const CouldNotLoad: Story = {
  name: 'Couldn’t load',
  parameters: {
    memberly: { simulation: { offline: true } },
    ...storyDoc('The passes can’t be read: nothing was charged, and Try again reads them once more.'),
  },
};
