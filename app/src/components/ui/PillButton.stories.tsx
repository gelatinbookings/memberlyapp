import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { PillButton } from './PillButton';

const meta = {
  title: 'Atoms/PillButton',
  component: PillButton,
  tags: ['autodocs'],
  args: { label: 'Add', onPress: fn() },
  argTypes: {
    filled: { control: 'boolean' },
    disabled: { control: 'boolean' },
    icon: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A light action that sits inside a row or a card: Add, Offer, Show card, Manage. Round, 44pt tall, 1px border, 13px/600 label. The filled variant marks the one action on a highlighted card.',
          use: 'for an action that belongs to one row or card, so it reads lighter than the screen’s primary button: Add on a DJ card, Show card on Home, Other DJs open that night on a booking.',
          avoid: 'for the main action of a screen, sheet or dialog: use `Button` (6px, full width). For a filter or a choice use `Chip`; for an icon with no label use `IconButton`.',
          usage: `<PillButton label="Add" onPress={add} />
<PillButton label="Added" filled icon={<Check size={14} color={c.onBrand} strokeWidth={2.5} />} onPress={remove} />`,
          a11y: [
            'Role `button`; the label is the spoken name. Pass `accessibilityLabel` when the label alone is too short, such as “Get General pass”.',
            '`disabled` is announced through `accessibilityState` and drawn at 50% opacity.',
            '44pt tall: the minimum target, met without hit slop.',
            'The label scales with Dynamic Type; the pill grows with it.',
          ],
          do: [
            'Keep it to one or two words that name the action.',
            'Use the filled variant once per card, for the card’s one action (Added, Manage).',
            'Use a 14px icon at 2.5 stroke when the pill carries one.',
          ],
          dont: [
            'Use it as the primary action of a screen: round is for lighter actions (the Two-Radius Rule).',
            'Put two filled pills on one card.',
            'Tint it purple for decoration: purple means action, selection or state.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof PillButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {
  parameters: storyDoc('The default: a light action in a row or card, such as Add on a DJ card.'),
};

export const Filled: Story = {
  args: { label: 'Added', filled: true, icon: <Check size={14} color={darkPalette.onBrand} strokeWidth={2.5} /> },
  parameters: storyDoc('The one action on a highlighted card: a DJ you’ve added, or Manage on a community you run.'),
};

export const WithIcon: Story = {
  name: 'With icon',
  args: { label: 'New event', filled: true, icon: <Plus size={14} color={darkPalette.onBrand} strokeWidth={2.5} /> },
  parameters: storyDoc('A 14px leading icon when it makes the action quicker to read.'),
};

export const Disabled: Story = {
  args: { label: 'Show card', disabled: true },
  parameters: storyDoc('When the action can’t run yet; say why nearby.'),
};

function AddToggle() {
  const [added, setAdded] = useState(false);
  return (
    <PillButton
      label={added ? 'Added' : 'Add'}
      filled={added}
      icon={added ? <Check size={14} color={darkPalette.onBrand} strokeWidth={2.5} /> : undefined}
      onPress={() => setAdded((a) => !a)}
    />
  );
}

export const AddAndRemove: Story = {
  name: 'Add and remove',
  render: () => <AddToggle />,
  parameters: storyDoc('Tap it: Add becomes a filled Added, and tapping again removes, as on a DJ card in Browse talent.'),
};
