import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { EventRow } from './EventRow';

const meta = {
  title: 'Molecules/EventRow',
  component: EventRow,
  tags: ['autodocs'],
  args: { onPress: fn() },
  argTypes: {
    showDate: { control: 'boolean' },
    showDistance: { control: 'boolean' },
    framed: { control: 'boolean' },
    relation: { control: 'inline-radio', options: [undefined, 'pass', 'going', 'saved'] },
    event: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One event in a list: a 64px cover thumbnail, the name, a meta line (community, time, and the date or distance when asked), and on the right the price, your Pass, or a Going or Saved pill. Plain inside a sheet; a bordered card row in a list.',
          use: 'in any list of events: Also tonight, the map’s sheet, Explore results, the Events tab.',
          avoid: 'for tonight’s featured pass on Home (a large photo card) or for an event the organizer is editing (Manage has its own rows).',
          usage: `<EventRow event={event} framed showDistance />
<EventRow event={event} framed showDate relation="going" />`,
          a11y: [
            'Role `button`, spoken as one line: “Warehouse Friday, Second Sundays · 10 PM, you have a pass”.',
            'At least 44pt tall; the whole row is the target and opens the event.',
            'The name is one line; with a date the meta line can wrap to two so the time stays visible.',
          ],
          do: [
            'Show the price label exactly as Memberly’s pass setup sends it.',
            'Use `framed` in lists on the black ground and the plain row inside a sheet.',
          ],
          dont: ['Show fees or anything about the lineup’s bookings here.', 'Put a second action in the row.'],
        }),
      },
    },
  },
} satisfies Meta<typeof EventRow>;

export default meta;
type Story = StoryObj<typeof EventRow>;

const withEvent = (id: string, props: Partial<Parameters<typeof EventRow>[0]>, doc: string): Story => ({
  render: (args) => (
    <Sample name={id} load={(repo) => repo.getEvent(id)}>
      {(event) => (event ? <EventRow {...args} {...props} event={event} /> : null)}
    </Sample>
  ),
  parameters: storyDoc(doc),
});

export const Plain = withEvent('e_rooftop_hours', {}, 'Inside a sheet, such as the map’s list: no border, the price on the right.');

export const Framed = withEvent('e_rooftop_hours', { framed: true }, 'In a list on the black ground: a bordered card row.');

export const WithDistance = { ...withEvent('e_rooftop_hours', { framed: true, showDistance: true }, 'Tonight, near you: the meta line ends with how far it is.'), name: 'With distance' };

export const WithDate = { ...withEvent('e_long_table', { framed: true, showDate: true }, 'A list across several days: the date leads the meta line, which can wrap to two lines.'), name: 'With date' };

export const YouHaveAPass = { ...withEvent('e_warehouse_friday', { framed: true }, 'An event you already hold a pass for: the green Pass pill takes the place of the price.'), name: 'You have a pass' };

export const Going = withEvent('e_rooftop_hours', { framed: true, showDate: true, relation: 'going' }, 'On the Events tab, an event you said you’re going to.');

export const Saved = withEvent('e_rooftop_hours', { framed: true, showDate: true, relation: 'saved' }, 'On the Events tab, an event you saved for later.');

export const ATonightList: Story = {
  name: 'A list of tonight',
  render: () => (
    <Sample name="tonight" load={(repo) => repo.getTonight('Atlanta')}>
      {(events) => (
        <Stack>
          {events.map((e) => (
            <EventRow key={e.id} event={e} framed showDistance />
          ))}
        </Stack>
      )}
    </Sample>
  ),
  parameters: storyDoc('Also tonight on Home: framed rows stacked 10px apart.'),
};
