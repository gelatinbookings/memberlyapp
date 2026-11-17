import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pencil, Plus } from 'lucide-react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { IconButton } from './IconButton';
import { ScreenHeader } from './ScreenHeader';

const meta = {
  title: 'Organisms/ScreenHeader',
  component: ScreenHeader,
  tags: ['autodocs'],
  args: { title: 'Lineup', subtitle: 'Warehouse Friday · Fri, Nov 20 · Atlanta', onBack: fn() },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    subtitleLines: { control: { type: 'number', min: 1, max: 3 } },
    right: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The head of a pushed screen: a round 44pt back button, the 20px headline title, one muted line under it, and an optional round action on the right. No eyebrow, no top bar fill.',
          use: 'at the top of every screen pushed onto the stack: Lineup, Browse talent, Create community’s steps, a pass form.',
          avoid: 'on tab screens (they open with a large greeting or title, not a back button) or inside a sheet: a sheet has its own title row with `Sheet`’s `onBack`.',
          usage: `<ScreenHeader
  title="Lineup"
  subtitle="Warehouse Friday · Fri, Nov 20 · Atlanta"
  right={<IconButton accessibilityLabel="Add more talent" icon={<Plus size={18} color={c.foreground} />} onPress={browse} />}
/>`,
          a11y: [
            'The title has `accessibilityRole="header"`, so VoiceOver’s rotor can jump to it.',
            'Back is a 44pt round `IconButton` spoken as “Back”. Without `onBack` it goes back, or to Manage when there is nothing to go back to.',
            'Focus order: Back, title, subtitle, then the right action.',
            'Edge-swipe back stays alive on every pushed screen; the button is not the only way out.',
          ],
          do: [
            'Keep the title short and the subtitle to one line of where you are (event · night · city).',
            'Use round 44pt icon buttons on the right, one or two at most.',
          ],
          dont: ['Put an eyebrow or kicker above the title.', 'Put a primary action in the header: it belongs in the pinned footer.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ScreenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('A pushed screen with a back button, a title and one line of context.'),
};

export const TitleOnly: Story = {
  name: 'Title only',
  args: { title: 'Browse talent', subtitle: undefined },
  parameters: storyDoc('While the screen has nothing to say under its title yet, as on a loading Lineup.'),
};

export const WithActions: Story = {
  name: 'With actions',
  args: {
    subtitle: '3 DJs · 1 confirmed · 1 card held · 1 payment needed',
    subtitleLines: 2,
    right: (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconButton accessibilityLabel="Edit Warehouse Friday" icon={<Pencil size={18} color={darkPalette.foreground} strokeWidth={2} />} onPress={fn()} />
        <IconButton accessibilityLabel="Add more talent" icon={<Plus size={18} color={darkPalette.foreground} strokeWidth={2} />} onPress={fn()} />
      </View>
    ),
  },
  parameters: storyDoc('The Lineup in motion: Edit and Add more talent on the right, a summary allowed two lines.'),
};

export const LongTitle: Story = {
  name: 'Long title',
  args: { title: 'Membership pricing for your new community', subtitle: 'Create community' },
  parameters: storyDoc('A title too long for one line is cut with an ellipsis; the back button never moves.'),
};
