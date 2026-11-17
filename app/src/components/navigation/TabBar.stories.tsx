import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { House } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { StoryTabBar, type TabName } from '@/stories/support/organisms';

import { TabButton } from './TabBar';

const TAB_NAMES: TabName[] = ['Home', 'Explore', 'Events', 'Manage', 'Me'];

type BarArgs = { organizer: boolean; active: TabName };

const meta = {
  title: 'Organisms/TabBar',
  component: TabButton,
  tags: ['autodocs'],
  args: { label: 'Home', Icon: House, isFocused: true, onPress: fn() },
  argTypes: {
    Icon: { control: false },
    isFocused: { control: 'boolean' },
    label: { control: 'text' },
  },
  parameters: {
    frame: 'bare',
    docs: {
      description: {
        component: componentDocs({
          what: 'The floating tab bar: a 64pt round card-coloured bar with a 1px border, 16pt from each edge and above the home indicator, no shadow. `TabButton` is one item: the active one is a 50pt brand-tint pill with a 20px icon and its label, 1.6× wider; the rest are 22px muted icons only. `tabBarStyles.bar` is the bar itself.',
          use: 'once, in the tabs layout. Members see four tabs (Home, Explore, Events, Me); organizers get a fifth, Manage.',
          avoid: 'on pushed screens, sheets or flows: they cover the bar. Don’t add a tab for the Memberly Card; it opens from Home and Me.',
          usage: `<View accessibilityRole="tablist" style={[tabBarStyles.bar, { bottom, backgroundColor: c.card, borderColor: c.border }]}>
  <TabTrigger name="index" asChild>
    <TabButton label="Home" Icon={House} />
  </TabTrigger>
  …
</View>`,
          a11y: [
            'The bar is a `tablist`; each item is a `tab` spoken by its label with `selected` on the active one, so inactive icon-only tabs still have names.',
            'Each item is 50pt tall, above the 44pt minimum.',
            'Tab screens add `useTabBarClearance()` at the foot of their content so nothing hides under the bar.',
          ],
          do: ['Keep the label on the active tab only.', 'Leave the bar flat: a 1px border, no shadow, no blur.'],
          dont: ['Give members a fifth tab.', 'Put the floating + button on the bar: it floats 12pt above it, on Home only.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TabButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bar in its place at the foot of a phone screen. */
function Bar({ organizer, active }: BarArgs) {
  return (
    <View style={{ height: 120 }}>
      <StoryTabBar organizer={organizer} active={active} onSelect={fn()} />
    </View>
  );
}

export const Organizer: Story = {
  render: () => <Bar organizer active="Home" />,
  parameters: storyDoc('An organizer on Home: five tabs, Manage among them.'),
};

export const Member: Story = {
  render: () => <Bar organizer={false} active="Home" />,
  parameters: storyDoc('A member on Home: four tabs, no Manage.'),
};

export const EachActiveTab: Story = {
  name: 'Each active tab',
  render: () => (
    <View>
      {TAB_NAMES.map((t) => (
        <Bar key={t} organizer active={t} />
      ))}
    </View>
  ),
  parameters: storyDoc('The active pill on each of the five tabs, so the widths can be compared.'),
};

export const OneButton: Story = {
  name: 'One button',
  render: (args) => (
    <View style={{ flexDirection: 'row', padding: 20, gap: 4 }}>
      <TabButton {...args} />
    </View>
  ),
  parameters: storyDoc('A single TabButton; switch `isFocused` to see the active pill and the muted icon.'),
};

function Switching() {
  const [active, setActive] = useState<TabName>('Home');
  return (
    <View style={{ height: 120 }}>
      <StoryTabBar organizer active={active} onSelect={setActive} />
    </View>
  );
}

export const Interactive: Story = {
  render: () => <Switching />,
  parameters: storyDoc('Tap a tab: the pill moves to it and its label appears.'),
};
