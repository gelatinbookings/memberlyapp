import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Text } from '@/components/ui';
import { formatIsoDate, type IsoDate } from '@/lib/dates';
import { eventFieldsOf, Stack, todayOf } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { MonthCalendar } from './MonthCalendar';

const meta = {
  title: 'Molecules/MonthCalendar',
  component: MonthCalendar,
  tags: ['autodocs'],
  args: { onSelect: fn() },
  argTypes: { selected: { control: 'text' }, today: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A month grid in a card for picking the night: the month and previous / next arrows, weekday initials, and 44pt day cells. The chosen day is a purple circle; days before today are dimmed and can’t be picked.',
          use: 'in Date & time, to choose the event’s night.',
          avoid: 'for times (use `SelectField` with the time sheet) or for a date range.',
          usage: `<MonthCalendar selected={fields.date} today={todayAtVenue} onSelect={(date) => set({ date })} />`,
          a11y: [
            'Each day is a `button` spoken as the full date, “Sunday, November 22”, with `selected` and `disabled` states.',
            'The month is a header; weekday initials are hidden from VoiceOver.',
            'Day cells are 44pt tall; the arrows are 36pt with 44pt targets.',
          ],
          do: ['Open on the chosen month, or on this month when nothing is chosen.', 'Use the venue’s today, not the phone’s.'],
          dont: ['Let a past night be picked.', 'Mark days with dots or colours beyond the one selection.'],
        }),
      },
    },
  },
} satisfies Meta<typeof MonthCalendar>;

export default meta;
type Story = StoryObj<typeof MonthCalendar>;

export const NoDateYet: Story = {
  name: 'No date yet',
  render: (args) => (
    <Sample name="today" load={async (repo) => todayOf(repo)}>
      {(today) => <MonthCalendar {...args} selected={null} today={today} />}
    </Sample>
  ),
  parameters: storyDoc('A new event: this month, nothing chosen, past days dimmed.'),
};

export const DateChosen: Story = {
  name: 'Date chosen',
  render: (args) => (
    <Sample name="event" load={async (repo) => ({ today: todayOf(repo), date: (await eventFieldsOf(repo, 'e_long_table')).date })}>
      {({ today, date }) => <MonthCalendar {...args} selected={date} today={today} />}
    </Sample>
  ),
  parameters: storyDoc('An event with its night set: the chosen day is a purple circle.'),
};

function Picking({ today }: { today: IsoDate }) {
  const [date, setDate] = useState<IsoDate | null>(null);
  return (
    <Stack>
      <MonthCalendar selected={date} today={today} onSelect={setDate} />
      <Text variant="secondary" tone="muted">
        {date ? formatIsoDate(date) : 'Pick the night'}
      </Text>
    </Stack>
  );
}

export const PickANight: Story = {
  name: 'Pick a night',
  render: () => (
    <Sample name="today" load={async (repo) => todayOf(repo)}>
      {(today) => <Picking today={today} />}
    </Sample>
  ),
  parameters: storyDoc('A working calendar: tap a day to choose it, and the arrows to change month.'),
};
