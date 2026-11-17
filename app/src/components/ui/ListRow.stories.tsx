import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, CalendarDays, LogOut, Moon } from 'lucide-react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { GroupedList } from './GroupedList';
import { ListRow } from './ListRow';

const icon = (I: typeof Bell, color: string = darkPalette.foreground) => <I size={18} color={color} strokeWidth={2} />;

const meta = {
  title: 'Molecules/ListRow',
  component: ListRow,
  tags: ['autodocs'],
  args: { label: 'Upcoming events', value: '1 pass', icon: icon(CalendarDays), onPress: fn() },
  argTypes: {
    tone: { control: 'select', options: ['default', 'muted', 'brand', 'success', 'warning', 'error'] },
    chevron: { control: 'boolean' },
    icon: { control: false },
  },
  decorators: [(Story) => <GroupedList><Story /></GroupedList>],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One row of a settings-style list: an optional 18px icon in a 36px muted tile, a 15px/500 label, an optional muted value, and a 16px chevron when it opens something. 52pt tall.',
          use: 'inside a `GroupedList` on Me and in settings: Upcoming events, Appearance, Notifications, Sign out.',
          avoid: 'for an event (use `EventRow`), a DJ (use `DjCard`) or a booking (use `BookingCard`). Not on its own outside a grouped card.',
          usage: `<GroupedList>
  <ListRow label="Upcoming events" value="1 pass" icon={<CalendarDays size={18} color={c.foreground} strokeWidth={2} />} onPress={openEvents} />
  <ListRow label="Sign out" tone="error" chevron={false} onPress={signOut} />
</GroupedList>`,
          a11y: [
            'With `onPress` it is a `button` spoken as “Upcoming events, 1 pass”. Without it, it is plain text.',
            '52pt tall: above the 44pt minimum. The label scales with Dynamic Type.',
          ],
          do: [
            'Show the chevron only when the row opens another screen.',
            'Use the error tone only for Sign out and other ways out.',
          ],
          dont: ['Nest a card inside a row.', 'Put two actions in one row.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIconAndValue: Story = {
  name: 'With icon and value',
  parameters: storyDoc('A row that opens a screen and shows where things stand: Upcoming events, 1 pass.'),
};

export const LabelOnly: Story = {
  name: 'Label only',
  args: { label: 'Appearance', value: 'Dark', icon: undefined },
  parameters: storyDoc('A plain row with a value, no icon.'),
};

export const NotTappable: Story = {
  name: 'Not tappable',
  args: { label: 'Signed in as', value: 'Organizer', icon: undefined, onPress: undefined },
  parameters: storyDoc('A fact with nothing to open: no chevron, no press state.'),
};

export const SignOut: Story = {
  name: 'Sign out',
  args: { label: 'Sign out', value: undefined, tone: 'error', chevron: false, icon: icon(LogOut, darkPalette.errorText) },
  parameters: storyDoc('The way out at the bottom of Me, in the error tone, with no chevron.'),
};

export const InAList: Story = {
  name: 'In a list',
  decorators: [],
  render: (args) => (
    <GroupedList>
      <ListRow {...args} />
      <ListRow label="Notifications" value="On" icon={icon(Bell)} onPress={args.onPress} />
      <ListRow label="Appearance" value="Dark" icon={icon(Moon)} onPress={args.onPress} />
      <ListRow label="Sign out" tone="error" chevron={false} icon={icon(LogOut, darkPalette.errorText)} onPress={args.onPress} />
    </GroupedList>
  ),
  parameters: storyDoc('Rows together in one card, separated by 1px rules, as on Me.'),
};
