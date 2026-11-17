import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { BottomSheetFrame, SheetHandle } from './BottomSheetFrame';
import { Button } from './Button';
import { Text } from './Text';

const meta = {
  title: 'Organisms/BottomSheetFrame',
  component: BottomSheetFrame,
  subcomponents: { SheetHandle },
  tags: ['autodocs'],
  args: { padBottom: true, children: null },
  argTypes: { padBottom: { control: 'boolean' }, children: { control: false }, style: { control: false }, grab: { control: false } },
  render: (args) => (
    <BottomSheetFrame {...args}>
      <Text variant="headline" accessibilityRole="header">
        Sheet title
      </Text>
      <Text tone="muted">The frame draws the look only: ground, border, radius, handle and padding.</Text>
      <Button label="Primary action" onPress={fn()} />
    </BottomSheetFrame>
  ),
  parameters: {
    frame: 'bare',
    docs: {
      description: {
        component: componentDocs({
          what: 'The look of every bottom sheet, with no behaviour: black ground, 1px border on the top and sides, 24px top radius, the 40×4 grab handle, 10px 20px padding and the safe-area bottom. `SheetHandle` is the handle on its own.',
          use: 'inside a sheet that brings its own presentation: `Sheet`, `OverlaySheet`, the auth sheet, and the list that sits under the map on Tonight.',
          avoid: 'as a sheet by itself: it has no dim, no close and no gesture. Use `Sheet` or `OverlaySheet` for a task, or a `Card` for a block inside a screen.',
          usage: `<BottomSheetFrame grab={swipe.grab}>
  <Text variant="headline" accessibilityRole="header">Filters</Text>
  {children}
</BottomSheetFrame>`,
          a11y: [
            'The handle is hidden from VoiceOver; the sheet that uses the frame gives the close action its name.',
            'Pass `grab` to make the handle a 24pt-tall pull area for swipe to close.',
            'Bottom padding is the home-indicator inset plus 16, so the last action clears it.',
          ],
          do: ['Use it for every sheet so they all share one edge, one radius and one handle.'],
          dont: ['Give it a shadow or a tinted fill.', 'Round the bottom corners: the sheet meets the screen edge.'],
        }),
      },
    },
  },
} satisfies Meta<typeof BottomSheetFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('The frame with a title, a line and an action, padded clear of the home indicator.'),
};

export const NoBottomPadding: Story = {
  name: 'No bottom padding',
  args: { padBottom: false },
  parameters: storyDoc('When the content scrolls to the edge itself, as the list under the map on Tonight does.'),
};

export const HandleOnly: Story = {
  name: 'Handle only',
  render: () => <SheetHandle />,
  parameters: { frame: 'padded', ...storyDoc('The 40×4 round handle on its own, for a sheet with a custom head (DJ profile, auth).') },
};
