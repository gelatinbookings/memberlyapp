import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Clock, ImageIcon, MapPin, Music, Ticket } from 'lucide-react-native';
import { fn } from 'storybook/test';

import { eventFieldsOf, Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { detailsSummary, lineupCardSummary, locationSummary, SECTION_TITLES, whenSummary } from './completeness';
import { ACCESS_EMPTY_SUMMARY } from './EventFormScreen';
import { SectionCard } from './SectionCard';

const meta = {
  title: 'Molecules/SectionCard',
  component: SectionCard,
  tags: ['autodocs'],
  args: { title: SECTION_TITLES.when, summary: 'Pick the night and the times', Icon: Clock, state: 'todo', onPress: fn() },
  argTypes: {
    state: { control: 'inline-radio', options: ['todo', 'done', 'new'] },
    Icon: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One section of Create New Event as a card: a 44px icon tile, the title, a one-line summary of what’s in it, and on the right a green tick (done), a chevron (to do) or the purple New pill. New also gets the purple line and a filled tile.',
          use: 'for each section of Create New Event: Event details, Date & time, Location, Lineup, Access & passes. Each opens its own screen.',
          avoid: 'for a section that opens in place (use `FormSection`) or for settings rows (use `ListRow`).',
          usage: `<SectionCard title="Date & time" summary={whenSummary(fields)} Icon={Clock} state={whenComplete(fields) ? 'done' : 'todo'} onPress={openWhen} />`,
          a11y: [
            'Role `button`, spoken as “Date & time, complete. Sun, Nov 22 · 7:30 PM – 10:30 PM”.',
            'The summary wraps to two lines at most; the card grows with Dynamic Type.',
          ],
          do: [
            'Write the summary as what’s in the section, or what’s missing: “Venue and city”.',
            'Mark only the Lineup section New while it is new.',
          ],
          dont: ['Show money in a summary.', 'Use New for more than one section.'],
        }),
      },
    },
  },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToDo: Story = {
  name: 'To do',
  parameters: storyDoc('A section with something still missing: the summary says what, and a chevron opens it.'),
};

export const Done: Story = {
  render: (args) => (
    <Sample name="fields" load={(repo) => eventFieldsOf(repo, 'e_long_table')}>
      {(f) => <SectionCard {...args} title={SECTION_TITLES.when} summary={whenSummary(f)} Icon={Clock} state="done" />}
    </Sample>
  ),
  parameters: storyDoc('A finished section: its summary and a green tick.'),
};

export const New: Story = {
  render: (args) => (
    <Sample name="fields" load={(repo) => eventFieldsOf(repo, 'e_long_table')}>
      {(f) => <SectionCard {...args} title={SECTION_TITLES.lineup} summary={lineupCardSummary(f, [], [])} Icon={Music} state="new" />}
    </Sample>
  ),
  parameters: storyDoc('The Lineup section, new to Create New Event: purple line, filled tile and the New pill.'),
};

export const EverySection: Story = {
  name: 'Every section',
  render: (args) => (
    <Sample name="fields" load={(repo) => eventFieldsOf(repo, 'e_late_service')}>
      {(f) => (
        <Stack>
          <SectionCard {...args} title={SECTION_TITLES.details} summary={detailsSummary(f)} Icon={ImageIcon} state="done" />
          <SectionCard {...args} title={SECTION_TITLES.when} summary={whenSummary(f)} Icon={Clock} state="done" />
          <SectionCard {...args} title={SECTION_TITLES.location} summary={locationSummary(f)} Icon={MapPin} state="done" />
          <SectionCard {...args} title={SECTION_TITLES.lineup} summary={lineupCardSummary(f, [], [])} Icon={Music} state="new" />
          <SectionCard {...args} title={SECTION_TITLES.access} summary={ACCESS_EMPTY_SUMMARY} Icon={Ticket} state="todo" />
        </Stack>
      )}
    </Sample>
  ),
  parameters: storyDoc('Create New Event for a draft: the five sections, as the organizer sees them.'),
};
