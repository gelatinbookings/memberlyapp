import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Sheet, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind, Slot } from '@/stories/support/organisms';

function Body({ secondary = false }: { secondary?: boolean }) {
  return (
    <>
      <Slot label="Body: rows, chips or two fields" height={160} />
      <Button label="Primary action" onPress={fn()} />
      {secondary ? <Button label="Secondary action" variant="secondary" onPress={fn()} /> : null}
      <Text variant="helper" tone="muted" align="center">
        One helper line under the actions, when one is needed.
      </Text>
    </>
  );
}

const meta = {
  title: 'Templates/Bottom sheet',
  component: Sheet,
  tags: ['autodocs'],
  args: { visible: true, onClose: fn(), title: 'Sheet title', subtitle: 'One muted line on what the sheet is for.', children: null },
  argTypes: { children: { control: false }, action: { control: false }, title: { control: 'text' }, subtitle: { control: 'text' } },
  render: (args) => (
    <>
      <ScreenBehind />
      <Sheet {...args}>
        <Body />
      </Sheet>
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The layout of a self-contained task that rises over the screen and returns to it: the screen behind drops to 35%; the sheet sits on the black ground with a 1px border, 24px top radius and the 40×4 handle; then a 20pt headline title with a 14pt muted line, the body, and 6px full-width actions at the foot. Padding is 10pt top, 20pt sides, and the home-indicator inset plus 16 at the bottom; 16pt between blocks.',
          use: 'for Create, Filters, City and Country, Test accounts (a `Sheet`), and for flows where one sheet follows another, like the offer review, payment, DJ taken or Continue in Gelatin (an `OverlaySheet`, same layout). Pages that raise one: Home (Create), Explore and Browse talent (Filters), Lineup (the offer flow), the event page (Get a pass), Sign in.',
          avoid: 'for a decision with two answers (Centered dialog template) or for anything long enough to need its own back stack (Pushed screen template).',
          usage: `<Sheet visible={open} onClose={close} title="Filters" action={<Reset />}>
  {chips}
  <Button label="Show 6 DJs" onPress={apply} />
</Sheet>`,
          a11y: [
            'The title is a header; the dimmed screen behind is a button spoken as “Close”.',
            'Swipe down on the handle or title, tap the dim, or use system back to close; closing applies nothing.',
            'Actions are 52pt primary, 48pt secondary; every target is at least 44pt.',
            'Under Reduce Motion the sheet fades rather than slides, and doesn’t follow the finger.',
          ],
          do: [
            'Put the primary action last and full width; a secondary under it.',
            'Say in the subtitle what the sheet is for.',
            'Keep content short enough to see the action without scrolling where you can.',
          ],
          dont: ['Add a shadow or blur: the border and the dim do the separating.', 'Put an eyebrow above the title.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('Title, one line, a body and one primary action at the foot.'),
};

export const TwoActions: Story = {
  name: 'Two actions',
  render: (args) => (
    <>
      <ScreenBehind />
      <Sheet {...args}>
        <Body secondary />
      </Sheet>
    </>
  ),
  parameters: storyDoc('A primary action with its quieter alternative under it, 10pt apart.'),
};

export const SecondStep: Story = {
  name: 'Second step',
  args: { onBack: fn(), subtitle: undefined },
  parameters: storyDoc('A choice inside the sheet: a back arrow before the title returns to the first step.'),
};

function Opening() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
      <Text variant="headline">Screen title</Text>
      <Button label="Open the sheet" onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} title="Sheet title" subtitle="Closing changes nothing.">
        <Slot label="Body" height={120} />
        <Button label="Done" onPress={() => setOpen(false)} />
      </Sheet>
    </View>
  );
}

export const Interactive: Story = {
  render: () => <Opening />,
  parameters: storyDoc('Open it, then close it by the dim, a swipe down or Done.'),
};
