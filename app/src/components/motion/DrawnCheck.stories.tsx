import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { DrawnCheck } from './DrawnCheck';

const meta = {
  title: 'Atoms/DrawnCheck',
  component: DrawnCheck,
  tags: ['autodocs'],
  args: { size: 56, label: 'Verified' },
  argTypes: { size: { control: { type: 'range', min: 40, max: 96, step: 4 } } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A brand purple disc whose white check draws itself in over 360ms as the disc zooms in. Under Reduce Motion it appears already drawn.',
          use: 'once, at the moment something succeeds that the person waited for: the right code on Verify code.',
          avoid: 'as a status icon in a list or a card (use a `Pill` or the small success tick), or for anything that happens often.',
          usage: `{verified ? <DrawnCheck label="Code accepted" /> : null}`,
          a11y: [
            'Role `image`; `label` is what VoiceOver says. Make it the result: “Verified”, “Code accepted”.',
            'Transform and stroke only; under Reduce Motion it is drawn at once with no zoom.',
          ],
          do: ['Keep it to authored moments in first run, as DESIGN.md’s Motion section lists.'],
          dont: ['Add a glow, a burst or confetti around it.', 'Loop it.'],
        }),
      },
    },
  },
} satisfies Meta<typeof DrawnCheck>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('On Verify code, the moment the right code is entered.'),
};

function Replay() {
  const [run, setRun] = useState(0);
  return (
    <View style={styles.stack}>
      <DrawnCheck key={run} />
      <PillButton label="Play again" onPress={() => setRun((r) => r + 1)} style={styles.button} />
    </View>
  );
}

export const PlayAgain: Story = {
  name: 'Play again',
  render: () => <Replay />,
  parameters: storyDoc('Tap Play again to watch the check draw in from the start.'),
};

const styles = StyleSheet.create({
  stack: { gap: space.md, alignItems: 'flex-start' },
  button: { alignSelf: 'flex-start' },
});
