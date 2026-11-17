import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Wrap } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { Avatar } from './Avatar';

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { initials: 'BM', size: 44, accessibilityLabel: 'BLKMTN' },
  argTypes: {
    size: { control: { type: 'range', min: 28, max: 96, step: 4 } },
    muted: { control: 'boolean' },
    source: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A round photo of a person or DJ. With no photo it shows their initials in purple text on the purple tint. Muted greys it out.',
          use: 'beside a name: DJ cards, booking cards, the greeting on Home, Me. 44 in rows, 52 on DJ cards, larger at the head of a profile.',
          avoid: 'for a community or an event (use `CommunityThumb`, a rounded square) or for decoration with no name beside it.',
          usage: `<Avatar source={dj.photo} initials={dj.initials} accessibilityLabel={dj.name} />
<Avatar initials="CM" size={52} />`,
          a11y: [
            'Give it `accessibilityLabel` (the person’s name) when nothing beside it says the name; otherwise leave it out so the name isn’t read twice.',
            'Initials scale with the avatar, not with Dynamic Type, so they always fit the circle.',
          ],
          do: [
            'Always pass initials, even with a photo: they show while the photo loads and if it fails.',
            'Mute a DJ whose booking is over (passed, expired, cancelled).',
          ],
          dont: ['Square the corners: avatars are round.', 'Use the tint for anything but initials; a tinted circle means a person.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Photo: Story = {
  render: (args) => (
    <Sample name="dj" load={(repo) => bookingIn(repo, 'authorization_required')}>
      {(b) => <Avatar {...args} source={b.dj.photo} initials={b.dj.initials} accessibilityLabel={b.dj.name} />}
    </Sample>
  ),
  parameters: storyDoc('A DJ or member with a photo.'),
};

export const Initials: Story = {
  parameters: storyDoc('No photo yet: initials in purple on the purple tint.'),
};

export const MutedPhoto: Story = {
  name: 'Muted photo',
  render: (args) => (
    <Sample name="dj" load={(repo) => bookingIn(repo, 'authorization_required')}>
      {(b) => <Avatar {...args} source={b.dj.photo} initials={b.dj.initials} muted accessibilityLabel={b.dj.name} />}
    </Sample>
  ),
  parameters: storyDoc('A DJ whose booking is over: the photo drops to 60%.'),
};

export const MutedInitials: Story = {
  name: 'Muted initials',
  args: { muted: true, initials: 'MS', accessibilityLabel: 'Mara Sol' },
  parameters: storyDoc('A DJ with no photo whose booking is over: grey initials on the muted surface.'),
};

export const Sizes: Story = {
  render: () => (
    <Sample name="dj" load={(repo) => bookingIn(repo, 'authorization_required')}>
      {(b) => (
        <Wrap>
          {[36, 44, 52, 72].map((s) => (
            <Avatar key={s} size={s} source={b.dj.photo} initials={b.dj.initials} />
          ))}
          {[36, 44, 52, 72].map((s) => (
            <Avatar key={`i${s}`} size={s} initials="SH" />
          ))}
        </Wrap>
      )}
    </Sample>
  ),
  parameters: storyDoc('36, 44 (rows), 52 (DJ cards) and 72 (a profile head), with a photo and with initials.'),
};
