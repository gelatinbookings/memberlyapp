import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OnEventPage, Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { EventBadges } from './EventPageParts';

const meta = {
  title: 'Molecules/EventBadges',
  component: EventBadges,
  tags: ['autodocs'],
  argTypes: { category: { control: 'text' }, details: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The row of pills above an event’s title: its category in the purple tint, who can come (“Members only” or “Free for members”) in green, and a grey “Sales ended” once passes stop selling. Exported from `features/events/EventPageParts.tsx`.',
          use: 'at the top of the event page, above the title, with the category and the page details the server sends.',
          avoid: 'for a booking’s state (`StatusPill`), a DJ’s tier (`TierPill`) or the member’s own pass (`PassPill`). Don’t use it in lists; `EventRow` carries its own pills.',
          usage: `{details ? <EventBadges category={event.category} details={details} /> : null}`,
          a11y: [
            'Each pill is read as its label, in order; none is a control.',
            'The label type is the 10px uppercase pill type, the only uppercase text in the app.',
          ],
          do: [
            'Pass the access and sales state exactly as the server sends them.',
            'Leave the row out while the page details are still loading.',
          ],
          dont: ['Add a price or a count of passes left.', 'Type the access wording by hand: it comes from `details.access`.'],
        }),
      },
    },
  },
} satisfies Meta<typeof EventBadges>;

export default meta;
/** The page details come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof EventBadges>;

const onPage = (eventId: string, doc: string): Story => ({
  render: () => <OnEventPage eventId={eventId}>{({ event, details }) => <EventBadges category={event.category} details={details} />}</OnEventPage>,
  parameters: storyDoc(doc),
});

export const FreeForMembers = { ...onPage('e_rooftop_hours', 'An event with a members-free pass and a guest pass: the category, then “Free for members” (Rooftop Hours).'), name: 'Free for members' };

export const OpenToEveryone = { ...onPage('e_daylight', 'An event anyone can get a pass for: only the category shows (Daylight).'), name: 'Open to everyone' };

export const MembersOnly = { ...onPage('e_night_service', 'No guest pass on sale: “Members only” after the category (Night Service).'), name: 'Members only' };

export const SalesEnded = { ...onPage('e_clay_and_wine', 'Passes have stopped selling: a grey “Sales ended” joins the row (Clay & Wine).'), name: 'Sales ended' };

export const NoCategory: Story = {
  name: 'No category',
  render: () => <OnEventPage eventId="e_rooftop_hours">{({ details }) => <EventBadges details={details} />}</OnEventPage>,
  parameters: storyDoc('An event saved without a category: the access pill stands alone.'),
};

export const EveryCase: Story = {
  name: 'Every case',
  render: () => (
    <Stack>
      {['e_rooftop_hours', 'e_daylight', 'e_night_service', 'e_clay_and_wine'].map((id) => (
        <OnEventPage key={id} eventId={id}>
          {({ event, details }) => <EventBadges category={event.category} details={details} />}
        </OnEventPage>
      ))}
    </Stack>
  ),
  parameters: storyDoc('The four rows stacked: free for members, open, members only, sales ended.'),
};
