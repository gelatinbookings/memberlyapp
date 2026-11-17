import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { ChoiceCard } from './ChoiceCard';

const meta = {
  title: 'Molecules/ChoiceCard',
  component: ChoiceCard,
  tags: ['autodocs'],
  args: { title: 'Free to join', line: 'Anyone can join at no cost.', selected: false, onPress: fn() },
  argTypes: { selected: { control: 'boolean' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One of a few either-or choices, as a card: a title, one muted line, and a radio mark on the right. Selected takes the purple tint, the purple line and a filled radio.',
          use: 'when a person picks one of two or three options that each need a line of explanation: Free to join or Paid membership.',
          avoid: 'for many options or short labels (use `Chip`), for an on/off setting (use `Toggle`), or for a list to choose from (use `SelectField`).',
          usage: `<ChoiceCard title="Free to join" line="Anyone can join at no cost." selected={kind === 'free'} onPress={() => setKind('free')} />
<ChoiceCard title="Paid membership" line="Members pay monthly, per tier." selected={kind === 'paid'} onPress={() => setKind('paid')} />`,
          a11y: [
            'Role `radio` with `checked` and `selected`, spoken as “Free to join. Anyone can join at no cost.”',
            'At least 68pt tall; the whole card is the target.',
          ],
          do: ['Stack the choices 10px apart, one always selected.', 'Keep the line to one sentence about what the choice means.'],
          dont: ['Use it for several picks at once: it is a radio.', 'Add a second action inside the card.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  parameters: storyDoc('A choice you haven’t picked.'),
};

export const Selected: Story = {
  args: { selected: true },
  parameters: storyDoc('The choice you’ve picked: tint, purple line, filled radio.'),
};

function Membership() {
  const [kind, setKind] = useState<'free' | 'paid'>('free');
  return (
    <Stack>
      <ChoiceCard title="Free to join" line="Anyone can join at no cost." selected={kind === 'free'} onPress={() => setKind('free')} />
      <ChoiceCard title="Paid membership" line="Members pay monthly, per tier." selected={kind === 'paid'} onPress={() => setKind('paid')} />
    </Stack>
  );
}

export const PickOne: Story = {
  name: 'Pick one',
  render: () => <Membership />,
  parameters: storyDoc('Membership pricing in Create community: tap either card to choose.'),
};
