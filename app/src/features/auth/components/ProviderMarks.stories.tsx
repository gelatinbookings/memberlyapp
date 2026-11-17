import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Wrap } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { AppleMark, GoogleMark } from './ProviderMarks';

const meta = {
  title: 'Atoms/ProviderMarks',
  component: GoogleMark,
  subcomponents: { AppleMark },
  tags: ['autodocs'],
  args: { size: 20 },
  argTypes: { size: { control: { type: 'range', min: 16, max: 48, step: 2 } } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The Google “G” in Google’s own colours, and the Apple mark in one colour you pass. 20px by default, drawn as SVG.',
          use: 'inside the sign-in provider buttons, beside “Continue with Google” and “Continue with Apple”.',
          avoid: 'anywhere else, or on their own as a button: use `ProviderButtons`, which carries the label and the 52pt target.',
          usage: `<GoogleMark />
<AppleMark color={c.foreground} />`,
          a11y: [
            'Hidden from VoiceOver: the button’s label already says the provider.',
          ],
          do: ['Keep Google’s four colours exactly, as its brand rules require (`brandMarks` in tokens.ts).', 'Draw the Apple mark in the button’s text colour.'],
          dont: ['Recolour the Google mark purple or white.', 'Scale a mark past the label’s height.'],
        }),
      },
    },
  },
} satisfies Meta<typeof GoogleMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Google: Story = {
  parameters: storyDoc('Inside Continue with Google, on every platform.'),
};

export const Apple: Story = {
  render: (args) => <AppleMark size={args.size} color={darkPalette.foreground} />,
  parameters: storyDoc('Inside Continue with Apple, on iPhone only, in the foreground colour.'),
};

export const Together: Story = {
  render: (args) => (
    <Wrap>
      <GoogleMark size={args.size} />
      <AppleMark size={args.size} color={darkPalette.foreground} />
    </Wrap>
  ),
  parameters: storyDoc('Both marks at the same size, as they sit in the stacked provider buttons.'),
};
