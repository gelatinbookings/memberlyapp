import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, PillButton, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { Rise } from './Rise';

const meta = {
  title: 'Atoms/Rise',
  component: Rise,
  tags: ['autodocs'],
  args: { index: 0, delay: 0, children: <Text variant="display">Find your people. Never miss the night.</Text> },
  argTypes: {
    index: { control: { type: 'number', min: 0, max: 6 } },
    delay: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    children: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A wrapper that fades its content in while it rises 16px into place over 420ms. `index` staggers a group 90ms apart. Opacity and transform only; under Reduce Motion it simply appears.',
          use: 'for first-run moments DESIGN.md authors: the wordmark, tagline and buttons on Welcome rising in a stagger.',
          avoid: 'on ordinary screens and lists: inside the product, motion only conveys state (150–250ms). Never on content someone is waiting to read twice.',
          usage: `<Rise index={0}><Text variant="display">Welcome</Text></Rise>
<Rise index={1}><Button label="Create account" onPress={create} /></Rise>`,
          a11y: [
            'Content is in the tree from the start, so VoiceOver can read it before it finishes rising.',
            'Under Reduce Motion there is no movement at all.',
          ],
          do: ['Stagger at most a handful of items, top to bottom.'],
          dont: ['Chain it with scale, blur or colour changes.', 'Use it to slow down a screen people visit often.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Rise>;

export default meta;
type Story = StoryObj<typeof meta>;

export const One: Story = {
  parameters: storyDoc('A single item rising in, such as the Welcome headline.'),
};

function StaggerDemo() {
  const [run, setRun] = useState(0);
  return (
    <View style={styles.stack}>
      <View key={run} style={styles.stack}>
        <Rise index={0}>
          <Text variant="display">Find your people. Never miss the night.</Text>
        </Rise>
        <Rise index={1}>
          <Text tone="muted">Communities, events and passes in one place, built around what you like.</Text>
        </Rise>
        <Rise index={2}>
          <Button label="Create account" />
        </Rise>
        <Rise index={3}>
          <Button label="I already have an account" variant="secondary" />
        </Rise>
      </View>
      <PillButton label="Play again" onPress={() => setRun((r) => r + 1)} style={styles.button} />
    </View>
  );
}

export const Stagger: Story = {
  render: () => <StaggerDemo />,
  parameters: storyDoc('Welcome’s headline, line and buttons rising one after another. Tap Play again to replay.'),
};

const styles = StyleSheet.create({
  stack: { gap: space.md },
  button: { alignSelf: 'flex-start' },
});
