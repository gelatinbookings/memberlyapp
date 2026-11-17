import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { OnEventPage } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { HostedBy } from './EventPageParts';

const meta = {
  title: 'Molecules/HostedBy',
  component: HostedBy,
  tags: ['autodocs'],
  args: { onOpen: fn() },
  argTypes: { host: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The line under an event’s title: the host community’s logo (or its initials on a muted tile), “Hosted by” and the community’s name as a purple link, and a check when Memberly has verified the community. Tapping it opens the community’s page. Exported from `features/events/EventPageParts.tsx`.',
          use: 'under the title on the event page, once the page details have loaded.',
          avoid: 'before the details arrive (the page shows the community and city in plain purple text instead), or for the fuller host block at the foot of the page (`HostCard`).',
          usage: `<HostedBy host={details.host} onOpen={() => router.push({ pathname: '/community/[id]', params: { id: details.host.communityId } })} />`,
          a11y: [
            'One link, spoken as “Hosted by Second Sundays, verified”.',
            'At least 44pt tall, with an 8pt hit slop around the line.',
            'The logo is decoration; the name carries the meaning.',
          ],
          do: ['Show the check only when the server says the community is verified.', 'Open the community’s own page, never an outside link.'],
          dont: ['Name the organizer as a person: the community hosts.', 'Add a Follow or Join button to the line.'],
        }),
      },
    },
  },
} satisfies Meta<typeof HostedBy>;

export default meta;
/** The host comes from the sample world inside each story's render, so it isn't required here. */
type Story = StoryObj<typeof HostedBy>;

export const Verified: Story = {
  render: (args) => <OnEventPage eventId="e_warehouse_friday">{({ details }) => <HostedBy {...args} host={details.host} />}</OnEventPage>,
  parameters: storyDoc('A verified community: the logo, the name as a link and the purple check (Second Sundays).'),
};

export const NotVerified: Story = {
  name: 'Not verified',
  render: (args) => <OnEventPage eventId="e_daylight">{({ details }) => <HostedBy {...args} host={details.host} />}</OnEventPage>,
  parameters: storyDoc('A community Memberly hasn’t verified yet: the same line with no check (Day Party Collective).'),
};

export const NoLogo: Story = {
  name: 'No logo',
  render: (args) => (
    <OnEventPage eventId="e_warehouse_friday">{({ details }) => <HostedBy {...args} host={{ ...details.host, logo: null }} />}</OnEventPage>
  ),
  parameters: storyDoc('A community with no logo or cover yet: its first two letters on the muted tile.'),
};
