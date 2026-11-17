import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Wrap } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { CommunityThumb } from './CommunityThumb';

const meta = {
  title: 'Atoms/CommunityThumb',
  component: CommunityThumb,
  tags: ['autodocs'],
  args: { cover: null, size: 44 },
  argTypes: {
    size: { control: { type: 'range', min: 32, max: 96, step: 4 } },
    cover: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A community’s logo or cover, or an event’s cover, as a small square with the 12px thumbnail radius. With no photo it is a plain muted tile.',
          use: 'at the start of a row about a community or an event: the communities you run on Me, memberships on the Memberly Card, search results.',
          avoid: 'for a person or a DJ (use `Avatar`, which is round) or for a large cover (event covers are 150px cards).',
          usage: `<CommunityThumb cover={community.logo ?? community.cover} />`,
          a11y: [
            'Decorative: the row’s name says what it is, so the thumb has no label of its own.',
            'Never the only target in a row; the whole row is tappable.',
          ],
          do: ['Prefer the logo, then the banner, then the muted tile.', 'Use 44 in rows and 64 in larger list rows.'],
          dont: ['Round it into a circle: circles are people.', 'Put a placeholder icon or a gradient in the empty tile.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CommunityThumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {
  name: 'With photo',
  render: (args) => (
    <Sample name="communities" load={(repo) => repo.getOrganizedCommunities()}>
      {(communities) => <CommunityThumb {...args} cover={communities[0]?.logo ?? communities[0]?.cover} />}
    </Sample>
  ),
  parameters: storyDoc('A community with a logo or banner.'),
};

export const NoPhoto: Story = {
  name: 'No photo',
  parameters: storyDoc('A community that hasn’t added a logo or banner yet: a muted tile.'),
};

export const Sizes: Story = {
  render: () => (
    <Sample name="communities" load={(repo) => repo.getTopCommunities('Atlanta')}>
      {(communities) => (
        <Wrap>
          {[32, 44, 64].map((s) => (
            <CommunityThumb key={s} size={s} cover={communities[0]?.cover} />
          ))}
          <CommunityThumb size={64} cover={null} />
        </Wrap>
      )}
    </Sample>
  ),
  parameters: storyDoc('32, 44 and 64, and the empty tile at 64.'),
};
