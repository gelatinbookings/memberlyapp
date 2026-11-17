import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { Skeleton } from './StateViews';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: { height: 16, width: '70%', round: true },
  argTypes: {
    height: { control: { type: 'range', min: 8, max: 160, step: 2 } },
    width: { control: 'text' },
    round: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A flat block in the muted surface that stands in for content while it loads. 12px corners, or round for a line of text. Exported from `StateViews.tsx`.',
          use: 'to hold the shape of what’s coming: a line of text, a thumbnail, a total in the review sheet while the server prices the offer.',
          avoid: 'for a whole list of rows (use `LoadingRows`) or for a short wait inside a control (use `Spinner`, or a button’s `loading`).',
          usage: `<Skeleton height={16} width="70%" round />
<Skeleton height={64} width={64} />`,
          a11y: [
            'Hidden from VoiceOver. Put `accessibilityLabel` and `accessibilityState={{ busy: true }}` on the view that holds the skeletons, such as “Getting your total”.',
            'It doesn’t shimmer, so there is nothing to turn off under Reduce Motion.',
          ],
          do: ['Match the size of the content that replaces it, so nothing jumps.', 'Use round blocks for lines of text and 12px blocks for images.'],
          dont: ['Animate it with a gradient sweep: the system has no gradients.', 'Put a spinner in the middle of content that has a known shape.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextLine: Story = {
  name: 'Text line',
  parameters: storyDoc('A line of text that hasn’t arrived yet.'),
};

export const Block: Story = {
  args: { height: 64, width: 64, round: false },
  parameters: storyDoc('A 64px thumbnail or cover that hasn’t arrived yet.'),
};

export const Total: Story = {
  render: () => (
    <Stack>
      <Skeleton height={16} round />
      <Skeleton height={16} round />
      <Skeleton height={32} width="50%" />
    </Stack>
  ),
  parameters: storyDoc('The offer review sheet while the server works out the total: two fee lines and the total.'),
};

export const Row: Story = {
  render: () => (
    <View style={styles.row}>
      <Skeleton height={44} width={44} round />
      <View style={styles.lines}>
        <Skeleton height={14} width="60%" round />
        <Skeleton height={12} width="40%" round />
      </View>
    </View>
  ),
  parameters: storyDoc('A person row while it loads: a round avatar and two lines.'),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  lines: { flex: 1, gap: 8 },
});
