import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { formatWallTime, halfHourSlots } from '@/lib/dates';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { SelectField } from './SelectField';

const meta = {
  title: 'Molecules/SelectField',
  component: SelectField,
  tags: ['autodocs'],
  args: { label: 'City', value: null, placeholder: 'Choose a city', onPress: fn() },
  argTypes: {
    value: { control: 'text' },
    strong: { control: 'boolean' },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A field that opens a picker instead of a keyboard: the same 48pt, 6px, card-filled box as `TextField`, with the value (or a muted placeholder) and a 16px chevron. `strong` sets the value in 16px/600 for times.',
          use: 'when the answer comes from a list: a city, a country, a start or end time. The picker rises as a bottom sheet.',
          avoid: 'for free text (use `TextField`) or for two or three options you can show at once (use `Chip` or `ChoiceCard`).',
          usage: `<SelectField label="Starts" value={start ? formatWallTime(start) : null} placeholder="Pick a time" strong onPress={openTimes} />`,
          a11y: [
            'Role `button`, spoken as “City, Atlanta” or “City, Choose a city”.',
            '48pt tall; the value scales with Dynamic Type.',
          ],
          do: ['Say what to pick in the placeholder: “Pick a time”, “Choose a city”.', 'Show the value exactly as the picker lists it.'],
          dont: ['Open a dropdown menu: pickers are bottom sheets.', 'Use it for an action such as Browse talent.'],
        }),
      },
    },
  },
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  parameters: storyDoc('Nothing picked yet: the muted placeholder says what to choose.'),
};

export const WithValue: Story = {
  name: 'With value',
  render: (args) => (
    <Sample name="cities" load={(repo) => repo.getCities()}>
      {(cities) => <SelectField {...args} value={`${cities[0].name}, ${cities[0].region}`} />}
    </Sample>
  ),
  parameters: storyDoc('A city picked from the sheet.'),
};

export const Time: Story = {
  args: { label: 'Starts', placeholder: 'Pick a time', strong: true, value: formatWallTime('22:00') },
  parameters: storyDoc('A time in Date & time: the value is 16px/600 so times read at a glance.'),
};

function CycleTimes() {
  const slots = halfHourSlots();
  const [i, setI] = useState<number | null>(null);
  return (
    <SelectField
      label="Starts"
      placeholder="Pick a time"
      strong
      value={i == null ? null : formatWallTime(slots[i])}
      onPress={() => setI((n) => ((n ?? 43) + 1) % slots.length)}
    />
  );
}

export const TapToPick: Story = {
  name: 'Tap to pick',
  render: () => <CycleTimes />,
  parameters: storyDoc('Tap it: here each tap stands in for a pick from the time sheet, moving half an hour on.'),
};
