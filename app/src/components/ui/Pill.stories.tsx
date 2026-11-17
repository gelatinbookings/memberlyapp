import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Wrap } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { PassPill, Pill, type PillTone } from './Pill';

const TONES: PillTone[] = ['warning', 'held', 'success', 'neutral', 'brand'];

const meta = {
  title: 'Atoms/Pill',
  component: Pill,
  subcomponents: { PassPill },
  tags: ['autodocs'],
  args: { label: 'Going', tone: 'held' },
  argTypes: {
    tone: { control: 'inline-radio', options: TONES },
    label: { control: 'text' },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A small round label that states something: 10px/700 uppercase, 0.04em tracking, 5px 9px padding. Five tones: warning, held (purple tint), success, neutral (grey) and brand (the filled “New”). `PassPill` is the member’s own pass, in green.',
          use: 'for a state read at a glance beside a name or a row: Pass, Going, Saved, New. Booking states use `StatusPill` and DJ tiers use `TierPill`, both built on this.',
          avoid: 'for anything tappable (use `Chip` or `PillButton`), or for a booking status you would have to spell yourself: `StatusPill` keeps the fixed labels.',
          usage: `<Pill label="Going" tone="held" />
<PassPill />`,
          a11y: [
            'Not a control: it is read as its label (`accessible`, `accessibilityLabel={label}`).',
            'The label type scales with Dynamic Type up to 1.4×, so it never pushes a row apart.',
            'Every tone’s text meets 4.5:1 on its own fill.',
          ],
          do: [
            'Keep labels to one or two words; the text is uppercased for you.',
            'Use success for the member’s own Pass and for Confirmed, and nothing else.',
            'Use the brand tone only for New.',
          ],
          dont: [
            'Use a pill as an eyebrow above a heading.',
            'Invent a new tone or colour for a state.',
            'Make a pill tappable.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: storyDoc('Try any label and tone with the controls.'),
};

export const EveryTone: Story = {
  name: 'Every tone',
  render: () => (
    <Wrap>
      <Pill label="Payment needed" tone="warning" />
      <Pill label="Going" tone="held" />
      <Pill label="Confirmed" tone="success" />
      <Pill label="Saved" tone="neutral" />
      <Pill label="New" tone="brand" />
    </Wrap>
  ),
  parameters: storyDoc('Warning, held, success, neutral and brand, side by side.'),
};

export const Pass: Story = {
  render: () => <PassPill />,
  parameters: storyDoc('On an event row when you already hold a pass for it: it takes the place of the price.'),
};

export const New: Story = {
  args: { label: 'New', tone: 'brand' },
  parameters: storyDoc('The filled purple pill on a section that’s new to Create New Event, such as Lineup.'),
};

export const Saved: Story = {
  args: { label: 'Saved', tone: 'neutral' },
  parameters: storyDoc('An event you saved but haven’t joined, on the Events tab.'),
};
