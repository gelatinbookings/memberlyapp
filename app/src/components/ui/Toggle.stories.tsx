import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { Text } from './Text';
import { Toggle } from './Toggle';

const meta = {
  title: 'Atoms/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: { value: false, onValueChange: fn(), accessibilityLabel: 'Show pending DJs as TBA' },
  argTypes: { value: { control: 'boolean' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A 44×26 round switch with a 20px white knob. Grey with a 1px border when off; brand purple when on.',
          use: 'for a setting that takes effect at once: show pending DJs as TBA on the public lineup, members-only, a notification.',
          avoid: 'for a choice between named options (use `ChoiceCard` or `Chip`) or for something that only applies after Save; use a checkbox-style choice there.',
          usage: `<Toggle value={showTba} onValueChange={setShowTba} accessibilityLabel="Show pending DJs as TBA" />`,
          a11y: [
            'Role `switch` with `accessibilityState.checked`, so VoiceOver says “on” or “off”.',
            '`accessibilityLabel` is required: say what the switch turns on.',
            'The hit area is a full 44pt (9pt slop around the 26pt track).',
          ],
          do: [
            'Put the label to the left on the same row, and let the row’s text say what “on” means.',
            'Apply the change right away.',
          ],
          dont: ['Use it to start an action such as sending or paying.', 'Colour the off state; only “on” is purple.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  parameters: storyDoc('A setting that is off: grey track, knob on the left.'),
};

export const On: Story = {
  args: { value: true },
  parameters: storyDoc('A setting that is on: purple track, knob on the right.'),
};

function SettingRow() {
  const [on, setOn] = useState(false);
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="bodyStrong">Show pending DJs as TBA</Text>
        <Text variant="secondary" tone="muted">
          {on ? 'Your public lineup shows TBA until a DJ accepts.' : 'Your public lineup shows confirmed DJs only.'}
        </Text>
      </View>
      <Toggle value={on} onValueChange={setOn} accessibilityLabel="Show pending DJs as TBA" />
    </View>
  );
}

export const InARow: Story = {
  name: 'In a row',
  render: () => <SettingRow />,
  parameters: storyDoc('Tap it: the switch flips and the line under the label says what is now true.'),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  text: { flex: 1, gap: 2 },
});
