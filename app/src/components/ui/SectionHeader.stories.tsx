import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
  args: { title: 'Also tonight' },
  argTypes: { actionLabel: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A 17px/700 section title, with an optional brand-coloured link on the right such as See all.',
          use: 'to head a section inside a screen or sheet: Also tonight, You organize, Lineup, Upcoming.',
          avoid: 'for the screen’s own title (use `Text` with the `headline` variant in the header) or for a label above a field (fields carry their own).',
          usage: `<SectionHeader title="Also tonight" actionLabel="See all" onAction={openMap} />`,
          a11y: [
            'The title has role `header`, so VoiceOver can jump between sections.',
            'The action is a `link` with 10pt slop and a 44pt-tall target.',
          ],
          do: ['Name the section in sentence case.', 'Keep the action to one or two words.'],
          dont: ['Put an eyebrow or kicker above it.', 'Use more than one action.'],
        }),
      },
    },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  name: 'Title only',
  parameters: storyDoc('A section that shows everything it has.'),
};

export const WithAction: Story = {
  name: 'With action',
  args: { actionLabel: 'See all', onAction: fn() },
  parameters: storyDoc('A section that shows a few of many, with See all on the right.'),
};

export const LongTitle: Story = {
  name: 'Long title',
  args: { title: 'Communities you might like in Atlanta', actionLabel: 'See all', onAction: fn() },
  parameters: storyDoc('A title that wraps: the action stays on the right, top-aligned with the first line.'),
};
