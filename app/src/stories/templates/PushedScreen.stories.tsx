import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Button, Screen, ScreenHeader, SectionHeader, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Slot } from '@/stories/support/organisms';

const meta = {
  title: 'Templates/Pushed screen',
  component: Screen,
  tags: ['autodocs'],
  args: { children: null },
  argTypes: { children: { control: false }, footer: { control: false }, contentStyle: { control: false } },
  render: () => (
    <Screen footer={<Button label="Primary action" onPress={fn()} />}>
      <ScreenHeader title="Screen title" subtitle="One line of context" onBack={fn()} />
      <Slot label="Lead block: a card, a photo or a summary" height={150} />
      <SectionHeader title="Section title" />
      <Slot label="Row or card" />
      <Slot label="Row or card" />
      <Slot label="Row or card" />
    </Screen>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The layout of every screen pushed onto the stack: `Screen` with a `ScreenHeader` at the top, content that scrolls under it, and the screen’s one primary action pinned in a footer above the home indicator. Black ground, 20pt gutters, 20pt between sections; the header starts 16pt under the status bar, and the footer rises with the keyboard.',
          use: 'for Lineup, Browse talent, Create New Event and its sub-screens, Event details, a pass form, the Card, Preferences. Pages built on it: Lineup, Create New Event, Event details, Date & time, Pass setup, My Memberly Card.',
          avoid: 'for a tab’s root screen (Tab screen template), for a short task that returns to the same screen (Bottom sheet template), or for a yes / no decision (Centered dialog).',
          usage: `<Screen footer={<Button label="Send 2 offers" onPress={send} />}>
  <ScreenHeader title="Lineup" subtitle="Late Service · Sat, Nov 28" />
  {cards}
</Screen>`,
          a11y: [
            'The header’s title is the screen’s header; Back is first in focus order, the pinned action last.',
            'Safe areas are honoured top and bottom; the footer clears the home indicator.',
            'Edge-swipe back is always alive.',
            'Content scrolls under the footer and stops clear of it, so the last row is never hidden.',
          ],
          do: [
            'Keep 20pt gutters and 20pt between sections; 10pt between stacked cards; 8pt between stacked buttons.',
            'Pin the one primary action at the foot; a quieter alternative goes under it as a secondary button.',
            'Put helper lines (attribution, the fee line) beside the action in the footer, in 12pt muted text.',
          ],
          dont: ['Put the primary action in the header.', 'Add a top bar fill or a shadow under the header.', 'Put two primary buttons in the footer.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('Header, a lead block, a section of rows, and the primary action pinned at the foot.'),
};

export const LongContent: Story = {
  name: 'Long content',
  render: () => (
    <Screen footer={<Button label="Primary action" onPress={fn()} />}>
      <ScreenHeader title="Screen title" subtitle="One line of context" onBack={fn()} />
      {Array.from({ length: 10 }, (_, i) => (
        <Slot key={i} label={`Row or card ${i + 1}`} />
      ))}
    </Screen>
  ),
  parameters: storyDoc('More than a screen of content: it scrolls behind the header’s line and stops clear of the footer.'),
};

export const FooterWithHelper: Story = {
  name: 'Footer with a helper and a second action',
  render: () => (
    <Screen
      footer={
        <>
          <Text variant="helper" tone="muted" align="center">
            One helper line about the action, such as what it costs or who supplies it.
          </Text>
          <Button label="Primary action" onPress={fn()} />
          <Button label="Secondary action" variant="secondary" onPress={fn()} />
        </>
      }>
      <ScreenHeader title="Screen title" subtitle="One line of context" onBack={fn()} />
      <Slot label="Content" height={300} />
    </Screen>
  ),
  parameters: storyDoc('A footer with a helper line, the primary action and its quieter alternative, 10pt apart.'),
};

export const NoFooter: Story = {
  name: 'No footer',
  render: () => (
    <Screen>
      <ScreenHeader title="Screen title" subtitle="One line of context" onBack={fn()} />
      <Slot label="Content that needs no primary action" height={150} />
      <Slot label="Row or card" />
    </Screen>
  ),
  parameters: storyDoc('A screen you only read: no footer, and the content ends clear of the home indicator.'),
};
