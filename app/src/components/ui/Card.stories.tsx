import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { Card } from './Card';
import { Text } from './Text';

const content = (title: string, line: string) => (
  <>
    <Text variant="cardTitle">{title}</Text>
    <Text variant="secondary" tone="muted">
      {line}
    </Text>
  </>
);

const meta = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
  args: { children: content('Second Sundays', 'You organize · 1,204 members') },
  argTypes: {
    selected: { control: 'boolean' },
    attention: { control: 'boolean' },
    padding: { control: { type: 'range', min: 10, max: 20, step: 2 } },
    children: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The container: 16px radius, card fill, 1px border, 14px padding, 10px between children. Flat. Selected takes the purple tint and line; attention takes an amber edge. With `onPress` the whole card is a button.',
          use: 'to group one thing’s content: a booking, a DJ you added, a money summary, “You organize”.',
          avoid: 'inside another card (separate rows with 1px rules in one card, or use `GroupedList`), or for an inset message (use `Notice`).',
          usage: `<Card selected>
  <Text variant="cardTitle">Second Sundays</Text>
  <Text variant="secondary" tone="muted">You organize · 1,204 members</Text>
</Card>`,
          a11y: [
            'With `onPress` it is a `button`; give it `accessibilityLabel` that sums up the card.',
            'Without `onPress`, its children are read in order.',
          ],
          do: [
            'Tint a card only when it means selected, added or yours.',
            'Use the attention edge only for the one card that needs action, such as a new offer from the DJ.',
          ],
          dont: ['Add a shadow.', 'Nest cards.', 'Tint a card for decoration.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('Everyday container for one thing’s content.'),
};

export const Selected: Story = {
  args: { selected: true },
  parameters: storyDoc('Yours, added or chosen: purple tint and purple line.'),
};

export const Attention: Story = {
  args: { attention: true, children: content('Sable Hart', 'New offer from the DJ. Review it in Gelatin.') },
  parameters: storyDoc('The one card on a screen that needs you: an amber edge.'),
};

export const Pressable: Story = {
  args: { onPress: fn(), accessibilityLabel: 'Second Sundays, you organize, 1,204 members' },
  parameters: storyDoc('A card you tap to open: the whole card is the target and dims slightly when pressed.'),
};

export const Compact: Story = {
  args: { padding: space.stack, children: content('Warehouse Friday', 'Tonight · 10 PM') },
  parameters: storyDoc('10px padding, as on event row cards.'),
};
