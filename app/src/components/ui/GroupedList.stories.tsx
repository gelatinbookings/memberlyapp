import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, CalendarDays, Gift, LogOut, Moon } from 'lucide-react-native';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { GroupedList } from './GroupedList';
import { ListRow } from './ListRow';

const icon = (I: typeof Bell, color: string = darkPalette.foreground) => <I size={18} color={color} strokeWidth={2} />;

const meta = {
  title: 'Molecules/GroupedList',
  component: GroupedList,
  tags: ['autodocs'],
  args: { children: null },
  argTypes: { children: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One card holding several rows, with a 1px rule between each: 16px radius, card fill, 1px border. Empty children are skipped, so a row you hide leaves no double rule.',
          use: 'for settings-style lists on Me and in settings, built from `ListRow`s.',
          avoid: 'for a list of cards (events, DJs, bookings stack as separate cards 10px apart) or for a single row.',
          usage: `<GroupedList>
  <ListRow label="Upcoming events" value="1 pass" onPress={openEvents} />
  {isOrganizer ? <ListRow label="Your communities" onPress={openCommunities} /> : null}
  <ListRow label="Sign out" tone="error" chevron={false} onPress={signOut} />
</GroupedList>`,
          a11y: ['The card itself isn’t announced; each row is read in order.', 'Rows keep their own 52pt targets.'],
          do: ['Separate rows with the built-in 1px rule.', 'Put Sign out last, in its own list.'],
          dont: ['Nest a card inside it.', 'Mix rows and free text in one list.'],
        }),
      },
    },
  },
} satisfies Meta<typeof GroupedList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {
  render: () => (
    <GroupedList>
      <ListRow label="Upcoming events" value="1 pass" icon={icon(CalendarDays)} onPress={() => undefined} />
      <ListRow label="Referrals" icon={icon(Gift)} onPress={() => undefined} />
      <ListRow label="Notifications" value="On" icon={icon(Bell)} onPress={() => undefined} />
      <ListRow label="Appearance" value="Dark" icon={icon(Moon)} onPress={() => undefined} />
    </GroupedList>
  ),
  parameters: storyDoc('Me’s list: several rows in one card.'),
};

export const OneRow: Story = {
  name: 'One row',
  render: () => (
    <GroupedList>
      <ListRow label="Sign out" tone="error" chevron={false} icon={icon(LogOut, darkPalette.errorText)} onPress={() => undefined} />
    </GroupedList>
  ),
  parameters: storyDoc('Sign out on its own at the bottom of Me.'),
};

export const HiddenRow: Story = {
  name: 'Hidden row',
  render: () => (
    <GroupedList>
      <ListRow label="Upcoming events" value="1 pass" icon={icon(CalendarDays)} onPress={() => undefined} />
      {null}
      <ListRow label="Appearance" value="Dark" icon={icon(Moon)} onPress={() => undefined} />
    </GroupedList>
  ),
  parameters: storyDoc('A row left out for this person, such as an organizer-only row for a member: no gap, no double rule.'),
};
