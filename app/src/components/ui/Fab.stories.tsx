import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { EventRow } from '@/features/events/EventRow';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';
import { space } from '@/theme/tokens';

import { Fab } from './Fab';
import { LoadingRows } from './StateViews';

const meta = {
  title: 'Atoms/Fab',
  component: Fab,
  tags: ['autodocs'],
  args: { onPress: fn() },
  argTypes: { style: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The floating action button: a round 56pt brand button with a white 2px plus. Pressed, it darkens and eases to 0.97. Flat, with no shadow.',
          use: 'once, on Home, at the bottom right, 16px from the edge and 12px above the tab bar. It opens the Create sheet (Create community, Add event, Add pass).',
          avoid: 'on any other screen today, or for a single action that fits in the screen: use `Button`. Never open a fan of mini buttons from it.',
          usage: `<Fab onPress={openCreateSheet} style={{ position: 'absolute', right: 16, bottom: tabBarClearance + 12 }} />`,
          a11y: [
            'Role `button`; spoken as “Create” unless you pass another `accessibilityLabel`.',
            '56pt: well above the 44pt minimum.',
            'Under Reduce Motion it only darkens when pressed; it doesn’t scale.',
          ],
          do: ['Keep one per screen at most.', 'Let the Create sheet say what can’t be made yet, with one line on why.'],
          dont: ['Add a shadow to lift it off the content.', 'Put a label or a second icon on it.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('On Home: the one way into Create.'),
};

export const OverContent: Story = {
  name: 'Over content',
  render: (args) => (
    <View style={styles.area}>
      <Sample name="tonight" load={(repo) => repo.getTonight('Atlanta')}>
        {(events) => (
          <View style={styles.list}>
            {events.slice(0, 3).map((e) => (
              <EventRow key={e.id} event={e} framed />
            ))}
          </View>
        )}
      </Sample>
      <Fab {...args} style={styles.fab} />
    </View>
  ),
  parameters: storyDoc('Floating at the bottom right over Home’s list, flat, separated only by its own fill.'),
};

export const Loading: Story = {
  render: (args) => (
    <View style={styles.area}>
      <LoadingRows />
      <Fab {...args} style={styles.fab} />
    </View>
  ),
  parameters: storyDoc('It stays put and works while Home’s content loads.'),
};

const styles = StyleSheet.create({
  area: { minHeight: 300 },
  list: { gap: space.stack },
  fab: { position: 'absolute', right: 0, bottom: 0 },
});
