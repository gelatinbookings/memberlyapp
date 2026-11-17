import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { Spinner } from './StateViews';
import { Text } from './Text';

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The platform activity indicator in muted text grey. Exported from `StateViews.tsx`.',
          use: 'for a short wait with no shape to hold: a sheet fetching one answer, a whole-screen wait before anything is known.',
          avoid: 'in the middle of content with a known shape (use `Skeleton` or `LoadingRows`), or inside a button (use the button’s `loading`).',
          usage: `if (q.data === undefined) return <Spinner />;`,
          a11y: [
            'The platform indicator is announced as in progress.',
            'Say what is loading in a line beside it when the wait could be more than a moment.',
          ],
          do: ['Centre it in the space the answer will fill.'],
          dont: ['Colour it purple: purple is for actions, selection and state.', 'Show two spinners on one screen.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('A short wait for one answer.'),
};

export const WithALine: Story = {
  name: 'With a line',
  render: () => (
    <View style={styles.centre}>
      <Spinner />
      <Text variant="secondary" tone="muted" align="center">
        Checking who’s open that night
      </Text>
    </View>
  ),
  parameters: storyDoc('A wait that may take a few seconds, with a line saying what you’re waiting for.'),
};

const styles = StyleSheet.create({
  centre: { alignItems: 'center', gap: space.sm, paddingVertical: space.gutter },
});
