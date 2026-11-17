import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OnEventPage } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { MemberPerks } from './EventPageParts';

const meta = {
  title: 'Molecules/MemberPerks',
  component: MemberPerks,
  tags: ['autodocs'],
  argTypes: { perks: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'What a membership gets you at this event: one row per perk, each with a gift icon tile, the perk’s title, its kind as a purple pill (“Event access”, “Guest”) and a muted line. Exported from `features/events/EventPageParts.tsx`.',
          use: 'in the “Member perks” section of the event page, under the line “Included with a [community] membership.”',
          avoid: 'for what a pass includes (that is on each pass in `PassSheet`) or for a community’s tiers (`TierEditor`).',
          usage: `{details.memberPerks.length > 0 ? (
  <Section title="Member perks" line={\`Included with a \${details.host.name} membership.\`}>
    <MemberPerks perks={details.memberPerks} />
  </Section>
) : null}`,
          a11y: [
            'Each perk is one element: “Free before midnight. Event access. Members walk in free until 12.”',
            'The icon is decoration. Rows aren’t tappable.',
          ],
          do: ['Show the perks the server sends, in its order.', 'Leave the section out when there are none.'],
          dont: ['Put a price or a saving in a perk.', 'Use a perk row as a button to join.'],
        }),
      },
    },
  },
} satisfies Meta<typeof MemberPerks>;

export default meta;
/** The perks come from the sample world inside each story's render, so they aren't required here. */
type Story = StoryObj<typeof MemberPerks>;

export const SeveralPerks: Story = {
  name: 'Several perks',
  render: () => <OnEventPage eventId="e_warehouse_friday">{({ details }) => <MemberPerks perks={details.memberPerks} />}</OnEventPage>,
  parameters: storyDoc('Three perks of two kinds for Second Sundays members (Warehouse Friday).'),
};

export const OnePerk: Story = {
  name: 'One perk',
  render: () => <OnEventPage eventId="e_night_service">{({ details }) => <MemberPerks perks={details.memberPerks} />}</OnEventPage>,
  parameters: storyDoc('A members-only night with a single perk: entry all night (Night Service).'),
};

export const NoPerks: Story = {
  name: 'No perks',
  render: () => <OnEventPage eventId="e_daylight">{({ details }) => <MemberPerks perks={details.memberPerks} />}</OnEventPage>,
  parameters: storyDoc('The event has no member perks: the list is empty, and the page leaves out the whole section.'),
};
