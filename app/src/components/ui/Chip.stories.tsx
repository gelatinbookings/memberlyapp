import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { MapPin, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { MUSIC_GENRES } from '@/data/taxonomy';
import { Wrap } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { Chip } from './Chip';

const GENRES = MUSIC_GENRES.slice(0, 6);

const meta = {
  title: 'Atoms/Chip',
  component: Chip,
  tags: ['autodocs'],
  args: { label: 'House', onPress: fn() },
  argTypes: {
    selected: { control: 'boolean' },
    icon: { control: false },
    trailingIcon: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A round 44pt filter or choice. At rest it is transparent with a 1px border; selected, it takes the purple tint, the purple line and purple text.',
          use: 'for filters and choices a person turns on and off: genres in Filters, budget bands in Browse talent, preferences in onboarding, discovery tags.',
          avoid: 'for an action (use `PillButton`) or for a label nobody can tap (use `Pill`, or an info tag in `Text`).',
          usage: `<Chip label="House" selected={genre === 'House'} onPress={() => setGenre('House')} />
<Chip label="Afrobeats" selected accessibilityLabel="Remove Afrobeats" trailingIcon={<X size={14} color={c.brandText} />} onPress={remove} />`,
          a11y: [
            'Role `button` with `accessibilityState.selected`, so VoiceOver says “selected”.',
            'Pass `accessibilityLabel` when a tap does something the label doesn’t say: “Remove House”, “Add Rooftop”.',
            '44pt tall; the label scales with Dynamic Type and the chip grows with it.',
          ],
          do: [
            'Write labels in sentence case, as the taxonomy has them.',
            'Show selection with the tint, line and text together, never colour alone on the text.',
            'Wrap chips in rows 8px apart.',
          ],
          dont: [
            'Use a filled purple chip: that is a `PillButton` (an action).',
            'Uppercase a chip label: the only uppercase is inside a 10px pill.',
            'Use chips for the primary action of a screen.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('A filter that is off.'),
};

export const Selected: Story = {
  args: { selected: true },
  parameters: storyDoc('A filter that is on: tint, purple line, purple text.'),
};

export const WithIcon: Story = {
  name: 'With icon',
  args: { label: 'Atlanta · Tonight', icon: <MapPin size={14} color={darkPalette.foreground} strokeWidth={2} /> },
  parameters: storyDoc('A 14px leading icon that says what the chip is about, such as the place and night.'),
};

export const Suggestion: Story = {
  args: { label: 'Rooftop', accessibilityLabel: 'Add Rooftop', icon: <Plus size={14} color={darkPalette.mutedText} strokeWidth={2.5} /> },
  parameters: storyDoc('A suggestion you can add, as under the discovery tags field.'),
};

export const Removable: Story = {
  args: {
    label: 'Afrobeats',
    selected: true,
    accessibilityLabel: 'Remove Afrobeats',
    trailingIcon: <X size={14} color={darkPalette.brandText} strokeWidth={2.5} />,
  },
  parameters: storyDoc('Something you chose, which a tap removes: a discovery tag already on your community.'),
};

function SingleSelect() {
  const [genre, setGenre] = useState<string | null>(GENRES[0]);
  return (
    <Wrap>
      {GENRES.map((g) => (
        <Chip key={g} label={g} selected={genre === g} onPress={() => setGenre(genre === g ? null : g)} />
      ))}
    </Wrap>
  );
}

export const PickOne: Story = {
  name: 'Pick one',
  render: () => <SingleSelect />,
  parameters: storyDoc('Tap a genre: one at a time, as in the Browse talent filters. Tap it again to clear it.'),
};

function MultiSelect() {
  const [chosen, setChosen] = useState<string[]>([GENRES[0], GENRES[2]]);
  const toggle = (g: string) => setChosen((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]));
  return (
    <Wrap>
      {GENRES.map((g) => (
        <Chip key={g} label={g} selected={chosen.includes(g)} onPress={() => toggle(g)} />
      ))}
    </Wrap>
  );
}

export const PickSeveral: Story = {
  name: 'Pick several',
  render: () => <MultiSelect />,
  parameters: storyDoc('Tap as many as you like, as in your preferences and the Explore filters.'),
};
