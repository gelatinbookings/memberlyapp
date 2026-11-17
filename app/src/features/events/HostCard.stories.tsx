import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { OnEventPage } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { HostCard } from './EventPageParts';

const meta = {
  title: 'Molecules/HostCard',
  component: HostCard,
  tags: ['autodocs'],
  args: { onVisit: fn() },
  argTypes: { host: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'About the community, at the foot of the event page: a card with the title, the host’s 44px logo (or initials), its name with the verified check, “Event host”, the community’s own short description, and a secondary Visit community button. Exported from `features/events/EventPageParts.tsx`.',
          use: 'as the last block of the event page, once the page details have loaded.',
          avoid: 'for the one-line credit under the title (`HostedBy`), or on a community’s own page.',
          usage: `{details ? <HostCard host={details.host} onVisit={visitCommunity} /> : null}`,
          a11y: [
            '“About the community” is a header.',
            'The check is spoken as “Verified”.',
            'Visit community is a full-width secondary button, at least 44pt tall, that opens the community’s page.',
          ],
          do: ['Use the community’s own description as the server sends it.', 'Keep Visit community secondary: the page’s primary action is in the pinned bar.'],
          dont: ['Show the organizer’s personal details or contact.', 'Add a second button, such as Join, to the card.'],
        }),
      },
    },
  },
} satisfies Meta<typeof HostCard>;

export default meta;
/** The host comes from the sample world inside each story's render, so it isn't required here. */
type Story = StoryObj<typeof HostCard>;

export const Verified: Story = {
  render: (args) => <OnEventPage eventId="e_warehouse_friday">{({ details }) => <HostCard {...args} host={details.host} />}</OnEventPage>,
  parameters: storyDoc('A verified community with its description (Second Sundays).'),
};

export const NotVerified: Story = {
  name: 'Not verified',
  render: (args) => <OnEventPage eventId="e_daylight">{({ details }) => <HostCard {...args} host={details.host} />}</OnEventPage>,
  parameters: storyDoc('A community Memberly hasn’t verified: no check by the name (Day Party Collective).'),
};

export const NoDescriptionOrLogo: Story = {
  name: 'No description or logo',
  render: (args) => (
    <OnEventPage eventId="e_daylight">{({ details }) => <HostCard {...args} host={{ ...details.host, about: '', logo: null }} />}</OnEventPage>
  ),
  parameters: storyDoc('A new community that hasn’t written a description or added a logo: initials on the tile, and Visit community straight under the name.'),
};
