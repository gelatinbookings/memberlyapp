import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fn } from 'storybook/test';

import { Fab, FAB_SIZE, Screen, SectionHeader, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Slot, StoryTabBar, type TabName } from '@/stories/support/organisms';
import { size, space } from '@/theme/tokens';

/** The FAB floats 12pt above the tab bar and 16pt from the right edge, as on Home. */
const FAB_GAP = 12;

function TabLayout({ organizer = true, active = 'Home', fab = false }: { organizer?: boolean; active?: TabName; fab?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fill}>
      <Screen tabs footerSpace={fab ? FAB_SIZE + FAB_GAP : 0}>
        <View style={styles.titles}>
          <Text variant="secondary" tone="muted">
            One muted line above the title, such as the date
          </Text>
          <Text variant="display" accessibilityRole="header">
            Large title
          </Text>
        </View>
        <Slot label="Lead card" height={150} />
        <SectionHeader title="Section title" actionLabel="See all" onAction={fn()} />
        <Slot label="Row or card" />
        <Slot label="Row or card" />
        <Slot label="Row or card" />
        <Slot label="The last row clears the tab bar" />
      </Screen>
      {fab ? (
        <Fab onPress={fn()} style={[styles.fab, { bottom: Math.max(insets.bottom, space.md) + size.tabBar + FAB_GAP }]} />
      ) : null}
      <StoryTabBar organizer={organizer} active={active} />
    </View>
  );
}

const meta = {
  title: 'Templates/Tab screen',
  component: Screen,
  tags: ['autodocs'],
  args: { children: null },
  argTypes: { children: { control: false }, footer: { control: false }, contentStyle: { control: false } },
  render: () => <TabLayout />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The layout of a tab’s root screen: `Screen` with `tabs`, a large title (Display, with one muted line above it where the screen needs one), sections down a single column, and the floating tab bar over the foot. The content scrolls full-bleed under the status bar and ends with `useTabBarClearance()` so the last row clears the bar. Home alone adds the round + button, 16pt from the right and 12pt above the bar.',
          use: 'for the tabs: Home, Explore, Events, Me, and Manage for organizers. Pages built on it: Home, Explore, Events, Me, Manage.',
          avoid: 'for anything pushed from a tab (Pushed screen template) or a task that returns to the tab (Bottom sheet template).',
          usage: `<Screen tabs>
  <Text variant="display" accessibilityRole="header">Events</Text>
  <SectionHeader title="This week" />
  {rows}
</Screen>`,
          a11y: [
            'The large title is the screen’s header.',
            'The tab bar is a `tablist`; each tab is spoken by its name and the active one is selected.',
            'The + button is spoken as “Create” and is 56pt.',
            'Nothing scrolls out of reach under the tab bar: the clearance is the bar, the home-indicator inset and a 20pt gap.',
          ],
          do: [
            'Keep 20pt gutters and 20pt between sections; the bar insets 16pt from each edge.',
            'Put at most one floating + on a screen, and today only on Home.',
            'Give members four tabs and organizers five.',
          ],
          dont: ['Add a back button to a tab root.', 'Pin a primary button over the tab bar.', 'Give the bar or the + a shadow.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Organizer: Story = {
  parameters: storyDoc('An organizer’s tab screen: five tabs, the content clearing the bar.'),
};

export const Member: Story = {
  render: () => <TabLayout organizer={false} active="Explore" />,
  parameters: storyDoc('A member’s tab screen: four tabs, no Manage.'),
};

export const WithCreateButton: Story = {
  name: 'With the + button',
  render: () => <TabLayout fab />,
  parameters: storyDoc('Home’s layout: the round + floats 12pt above the bar, and the content leaves room for it too.'),
};

function Switching() {
  const [active, setActive] = useState<TabName>('Home');
  return (
    <View style={styles.fill}>
      <Screen tabs>
        <Text variant="display" accessibilityRole="header">
          {active}
        </Text>
        <Slot label={`The ${active} tab’s content`} height={300} />
      </Screen>
      <StoryTabBar active={active} onSelect={setActive} />
    </View>
  );
}

export const Interactive: Story = {
  render: () => <Switching />,
  parameters: storyDoc('Tap the tabs: the title follows and the active pill moves.'),
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  titles: { gap: space.xs },
  fab: { position: 'absolute', right: space.md },
});
