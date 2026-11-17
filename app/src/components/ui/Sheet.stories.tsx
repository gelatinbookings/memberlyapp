import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';

import { Button } from './Button';
import { Chip } from './Chip';
import { Sheet } from './Sheet';
import { Text } from './Text';

const meta = {
  title: 'Organisms/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  args: {
    visible: true,
    onClose: fn(),
    title: 'Add a pass for',
    subtitle: 'Choose a community.',
    children: null,
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    visible: { control: 'boolean' },
    children: { control: false },
    action: { control: false },
  },
  render: (args) => (
    <>
      <ScreenBehind title="Home" />
      <Sheet {...args}>
        <Text tone="muted">The sheet’s content goes here: rows, chips or a short form.</Text>
        <Button label="Continue" onPress={fn()} />
      </Sheet>
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'A bottom sheet in a native modal: the screen behind drops to 35%, the sheet sits on the black ground with a 1px border, a 24px top radius and the 40×4 grab handle, then a 20px headline title and a muted line. An optional back arrow makes a second step; an optional text action (Reset) sits on the title row.',
          use: 'for a self-contained task that returns to the same screen: Create, Filters, City, Country, Test accounts.',
          avoid: 'when one sheet must follow another without waiting for the system to dismiss the first (review, then payment, then the result): use `OverlaySheet`. For a decision with two answers use a centred dialog (see Templates / Centered dialog).',
          usage: `<Sheet visible={open} onClose={() => setOpen(false)} title="Filters" action={<ResetLink />}>
  <ChipGroup />
  <Button label="Show 6 DJs" onPress={apply} />
</Sheet>`,
          a11y: [
            'The title is a header. The dimmed screen behind is a button spoken as “Close”.',
            'Swipe the handle or title down to close; under Reduce Motion the sheet stays put and closes on release.',
            'The system back gesture and Android back close it. Closing any way applies nothing.',
            'Back (second step) is a 36pt round button with a 44pt hit area, spoken as “Back”.',
          ],
          do: [
            'Keep actions 6px and full width at the foot of the sheet.',
            'Say what closing does in the component’s docs: closing a Sheet never applies a change.',
          ],
          dont: ['Add a shadow: the 1px border and the dimmed screen separate it.', 'Stack two Sheets; move to `OverlaySheet` when one must follow another.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('A sheet with a title, one muted line, its content and one action.'),
};

export const SecondStep: Story = {
  name: 'Second step',
  args: { onBack: fn(), title: 'Add an event for', subtitle: undefined },
  parameters: storyDoc('A step inside the sheet: the back arrow before the title returns to the first step.'),
};

export const WithTitleAction: Story = {
  name: 'With a title action',
  args: {
    title: 'Filters',
    subtitle: undefined,
    action: (
      <Pressable accessibilityRole="button" accessibilityLabel="Reset" onPress={fn()} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text variant="bodyStrong" tone="brand">
          Reset
        </Text>
      </Pressable>
    ),
  },
  parameters: storyDoc('A text action on the title row, such as Reset on Filters.'),
};

function OpenAndClose() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <>
      <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
        <Text variant="headline">Explore</Text>
        <Text tone="muted">{picked ? `You picked ${picked}.` : 'Nothing picked yet.'}</Text>
        <Button label="Open the sheet" onPress={() => setOpen(true)} />
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title="Location" subtitle="Closing the sheet changes nothing.">
        {['Near me', 'Atlanta', 'Anywhere'].map((l) => (
          <Chip key={l} label={l} selected={picked === l} onPress={() => setPicked(l)} />
        ))}
        <Button label="Done" onPress={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

export const Interactive: Story = {
  render: () => <OpenAndClose />,
  parameters: storyDoc('Open it, pick, then tap the dimmed screen, pull it down or tap Done to close.'),
};
