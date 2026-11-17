import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { LoadingRows } from './StateViews';

const meta = {
  title: 'Molecules/LoadingRows',
  component: LoadingRows,
  tags: ['autodocs'],
  args: { count: 3, label: 'Loading events' },
  argTypes: { count: { control: { type: 'range', min: 1, max: 6, step: 1 } } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'Stacked placeholder rows in the shape of an event row card: a 64px thumbnail block and two text lines, inside a bordered card. Exported from `StateViews.tsx`.',
          use: 'while a list of events or communities loads, so the screen keeps its shape and nothing jumps when the rows arrive.',
          avoid: 'for a single line or a total (use `Skeleton`), or for the talent catalog, which has its own DJ-card skeleton.',
          usage: `if (events.isPending) return <LoadingRows label="Loading tonight’s events" />;`,
          a11y: [
            'The stack is one element: VoiceOver reads `label` with a busy state, never the empty rows.',
            'Write the label as what is loading: “Loading tonight’s events”.',
          ],
          do: ['Show about as many rows as will arrive, three by default.', 'Replace it in place with the real rows.'],
          dont: ['Add a spinner on top of it.', 'Leave it up when the read fails: show `ErrorState` instead.'],
        }),
      },
    },
  },
} satisfies Meta<typeof LoadingRows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('A list of events or communities on its way in.'),
};

export const OneRow: Story = {
  name: 'One row',
  args: { count: 1, label: 'Loading your pass' },
  parameters: storyDoc('A single row loading, such as tonight’s pass on Home.'),
};
