import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OnEventPage } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { GoingRow } from './EventPageParts';

const meta = {
  title: 'Molecules/GoingRow',
  component: GoingRow,
  tags: ['autodocs'],
  argTypes: { going: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'Who’s going: up to four overlapping faces (photo or initials), a muted “+86” disc for everyone else, and one line naming the people shown and counting the rest. It renders nothing when nobody has said they’re going. Exported from `features/events/EventPageParts.tsx`.',
          use: 'under the Lineup on the event page, in the “Who’s going” section, with the people the server chose to show.',
          avoid: 'for a community’s members or an organizer’s guest list. It shows only what the server makes public.',
          usage: `{going.people.length > 0 || going.othersCount > 0 ? (
  <Section title="Who’s going">
    <GoingRow going={details.going} />
  </Section>
) : null}`,
          a11y: [
            'One element, spoken as its line: “Ada Okafor, Faith Gowen, Simone Hart, Carmen Reyes, and 86 more going”.',
            'The faces are decoration; the line carries every name.',
          ],
          do: ['Show the people and the count exactly as the server sends them.', 'Hide the whole section when nobody is going yet.'],
          dont: ['Make faces tappable or link to profiles.', 'Show who booked the DJs or bought a pass for someone.'],
        }),
      },
    },
  },
} satisfies Meta<typeof GoingRow>;

export default meta;
/** The people come from the sample world inside each story's render, so they aren't required here. */
type Story = StoryObj<typeof GoingRow>;

export const NamesAndCount: Story = {
  name: 'Names and a count',
  render: () => <OnEventPage eventId="e_warehouse_friday">{({ details }) => <GoingRow going={details.going} />}</OnEventPage>,
  parameters: storyDoc('Four faces, then “+86” for the rest, and a line naming the four (Warehouse Friday).'),
};

export const FewerFaces: Story = {
  name: 'Fewer faces',
  render: () => <OnEventPage eventId="e_listening_session">{({ details }) => <GoingRow going={details.going} />}</OnEventPage>,
  parameters: storyDoc('A small night: three faces and a short count (Listening Session).'),
};

export const NamesOnly: Story = {
  name: 'Names only',
  render: () => (
    <OnEventPage eventId="e_long_table">{({ details }) => <GoingRow going={{ ...details.going, othersCount: 0 }} />}</OnEventPage>
  ),
  parameters: storyDoc('Everyone going is shown: no count disc, and the line ends “going”.'),
};

export const CountOnly: Story = {
  name: 'Count only',
  render: () => (
    <OnEventPage eventId="e_daylight">{({ details }) => <GoingRow going={{ ...details.going, people: [] }} />}</OnEventPage>
  ),
  parameters: storyDoc('The server sends a count with no names: the count disc alone, and a line such as “120 going”.'),
};

export const NobodyYet: Story = {
  name: 'Nobody yet',
  render: () => (
    <OnEventPage eventId="e_daylight">{({ details }) => <GoingRow going={{ ...details.going, people: [], othersCount: 0 }} />}</OnEventPage>
  ),
  parameters: storyDoc('Nobody has said they’re going: the row renders nothing, and the page leaves out the whole section.'),
};
