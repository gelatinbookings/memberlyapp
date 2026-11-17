import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { screen, userEvent } from 'storybook/test';

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
          unshown: [
            '“Confirming your pass”, a spinner between paying and the server reading the order as paid. On sample data it lasts a moment; open One paid pass, tap Get and pay to see it pass.',
            '“Payment didn’t go through. You weren’t charged.”, an error notice after a declined card. Open One paid pass, tap Get and tap “Use a declined test card” in the test payment sheet, then close it.',
            '“You’re offline. Try again when you’re back.”, a muted notice when Get can’t reach the server after the list has loaded.',
          ],
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

export const Loading: Story = {
  parameters: {
    memberly: { pending: ['getPassTypes'] },
    ...storyDoc('While the pass types load: two card-sized skeletons, read as “Loading passes”.'),
  },
};

export const NothingOnSale: Story = {
  name: 'Nothing on sale',
  args: { eventId: SAMPLE_EVENT.draftsNotSent },
  parameters: storyDoc('The event has no pass on sale yet: a muted notice says so, and nothing can be got.'),
};

export const SlowToConfirm: Story = {
  name: 'Slow to confirm',
  args: { eventId: 'e_long_table' },
  parameters: {
    memberly: { simulation: { slowPassOrder: true } },
    ...storyDoc('Get, then pay: confirming takes longer than ten seconds, so the sheet says the pass will land on your card.'),
  },
};

/** Taps Get on Long Table's one paid pass, the way a member would. */
const tapGet = async () => {
  await userEvent.click(await screen.findByText('Get'));
};

export const JustSoldOut: Story = {
  name: 'Just sold out',
  args: { eventId: 'e_long_table' },
  play: tapGet,
  parameters: {
    memberly: { simulation: { soldOutNext: true } },
    ...storyDoc('Get is tapped as the last one goes: an error notice says the pass just sold out, nothing is charged, and the list reloads.'),
  },
};

export const PriceChanged: Story = {
  name: 'Price changed',
  args: { eventId: 'e_long_table' },
  play: tapGet,
  parameters: {
    memberly: { simulation: { priceChangeNext: true } },
    ...storyDoc('The organizer changed the price after the list loaded: a warning notice gives the new total from the server and asks you to tap Get again.'),
  },
};

export const CouldNotLoad: Story = {
  name: 'Couldn’t load',
  parameters: {
    memberly: { simulation: { offline: true } },
    ...storyDoc('The passes can’t be read: nothing was charged, and Try again reads them once more.'),
  },
};
