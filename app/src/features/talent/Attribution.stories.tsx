import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { Attribution } from './BrowseStates';

const meta = {
  title: 'Atoms/Attribution',
  component: Attribution,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The catalog credit, “DJs, availability and rates from Gelatin”, in centred muted helper text. Exported from `features/talent/BrowseStates.tsx`.',
          use: 'at the foot of Browse talent, the one screen that lists the whole catalog. The Lineup, Other DJs open that night and DJ taken print the same line in their own footers.',
          avoid: 'on surfaces that don’t show catalog data, such as the public event page or the Memberly Card.',
          usage: `<Attribution />`,
          a11y: ['Plain text, read in order after the list it credits.', 'Helper type scales with Dynamic Type.'],
          do: ['Show it wherever catalog DJs, availability or rates appear.', 'Keep the wording exactly as the product fixes it.'],
          dont: ['Shorten it or move it into a tooltip.', 'Style it as a link or a banner.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Attribution>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('At the foot of Browse talent and anywhere else catalog DJs are listed.'),
};
