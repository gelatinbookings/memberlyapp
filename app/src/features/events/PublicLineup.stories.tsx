import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import type { LineupSlot } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { PublicLineup, PublicLineupRow } from './PublicLineup';

/** A sample event's public lineup, exactly as the fake server returns it. */
function EventLineup({ eventId, pick }: { eventId: string; pick?: (slots: LineupSlot[]) => LineupSlot[] }) {
  return (
    <Sample name={`lineup-${eventId}`} load={(repo) => repo.getEvent(eventId)}>
      {(event) => <PublicLineup slots={pick ? pick(event?.publicLineup ?? []) : (event?.publicLineup ?? [])} />}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/PublicLineup',
  component: PublicLineup,
  subcomponents: { PublicLineupRow },
  tags: ['autodocs'],
  args: { slots: [] },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The Lineup section of a public event page, and the Gelatin integration as members and guests see it: a heading with “DJs booked through Gelatin”, then one row per slot. A confirmed DJ shows photo or initials, name, sound and set time, and their tier. A pending slot shows as TBA with its set time. Before anyone is confirmed, the section says “Lineup coming soon”.',
          use: 'on every event page, between Event details and Who’s going. Every event has a lineup section, even before the DJs are confirmed.',
          avoid: 'for the organizer’s own view of bookings: that is the Lineup inside Create New Event (`LineupView`, `BookingCard`), which shows status, offers and amounts. Never put a fee, an offer, a status or who booked the DJ here.',
          usage: `<PublicLineup slots={event.publicLineup} />`,
          a11y: [
            '“Lineup” is a header, so VoiceOver can jump to it.',
            'Each row is one element, spoken as “KOYO, House · Afrobeats · Midnight to 2, Top performer” or “To be announced, 10 to midnight”.',
            'Rows aren’t tappable; nothing here asks for a 44pt target.',
          ],
          do: [
            'Show confirmed DJs only, and TBA only where the organizer allows pending slots (PRODUCT.md).',
            'Keep the Gelatin line under the heading.',
            'Use the slots the server sends, in its order.',
          ],
          dont: [
            'Show fees, offers, statuses or booker details: this is a public surface.',
            'Hide the section when there are no slots: it says “Lineup coming soon” instead.',
            'Say why a DJ isn’t on the lineup.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof PublicLineup>;

export default meta;
// Slots come from the sample server inside `render`, so `args` aren't required here.
type Story = StoryObj<typeof PublicLineup>;

export const ConfirmedDjs: Story = {
  name: 'Confirmed DJs',
  render: () => <EventLineup eventId="e_daylight" />,
  parameters: storyDoc('Two confirmed DJs with their sound, set times and tiers (Daylight).'),
};

export const WithATbaSlot: Story = {
  name: 'With a TBA slot',
  render: () => <EventLineup eventId="e_warehouse_friday" />,
  parameters: storyDoc('One confirmed DJ and a slot still to be announced, shown because the organizer allows it (Warehouse Friday).'),
};

export const OneDj: Story = {
  name: 'One DJ',
  render: () => <EventLineup eventId="e_night_service" />,
  parameters: storyDoc('A single confirmed headliner with a photo (Night Service).'),
};

export const NoPhoto: Story = {
  name: 'No photo',
  render: () => <EventLineup eventId="e_long_table" />,
  parameters: storyDoc('A confirmed DJ the catalog has no photo for: initials in the purple tint (Long Table).'),
};

export const TbaOnly: Story = {
  name: 'TBA only',
  render: () => <EventLineup eventId="e_listening_session" />,
  parameters: storyDoc('Nobody confirmed yet, but the organizer shows the slot as TBA (Listening Session).'),
};

export const ComingSoon: Story = {
  name: 'Lineup coming soon',
  render: () => <EventLineup eventId="e_daylight" pick={() => []} />,
  parameters: storyDoc('No slots yet: the section stays, saying the DJs will show once confirmed.'),
};
