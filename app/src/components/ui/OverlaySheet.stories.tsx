import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';

import { Button } from './Button';
import { OverlaySheet } from './OverlaySheet';
import { Text } from './Text';

const meta = {
  title: 'Organisms/OverlaySheet',
  component: OverlaySheet,
  tags: ['autodocs'],
  args: { visible: true, onClose: fn(), accessibilityLabel: 'Sheet title', children: null, covered: false },
  argTypes: {
    visible: { control: 'boolean' },
    covered: { control: 'boolean' },
    accessibilityLabel: { control: 'text' },
    closeLabel: { control: 'text' },
    children: { control: false },
  },
  render: (args) => (
    <>
      <ScreenBehind title="Lineup" />
      <OverlaySheet {...args}>
        <Text variant="headline" accessibilityRole="header">
          Sheet title
        </Text>
        <Text tone="muted">An overlay sheet scrolls its own content and keeps the primary action at its foot.</Text>
        <Button label="Primary action" onPress={fn()} />
      </OverlaySheet>
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'A bottom sheet drawn inside the current screen rather than a native modal, so one sheet can follow another at once: offer review, then the payment sheet, then Card held or DJ taken. Same look as `Sheet`: 35% screen behind, 1px border, 24px radius, grab handle. It rises from the bottom edge and its content scrolls.',
          use: 'for steps in a flow that chain without a pause: the offer flow, Continue in Gelatin, Get a pass, the test payment sheet.',
          avoid: 'for a one-off task over a screen (Filters, City, Create): use `Sheet`, which also handles the system back. Never for a yes / no decision: use a centred dialog.',
          usage: `<View style={{ flex: 1 }}>
  <Lineup />
  <OverlaySheet visible onClose={close} accessibilityLabel="Your offer to KOYO">
    <OfferSummary />
  </OverlaySheet>
</View>`,
          a11y: [
            'The sheet is a modal for VoiceOver (`accessibilityViewIsModal`) and carries the spoken name you give it.',
            'The dimmed screen is a button named by `closeLabel` (“Close” by default).',
            '`covered` hides it from VoiceOver while another sheet sits on top, without taking it off screen.',
            'Rises with a slide; under Reduce Motion it fades in. Swipe down on the handle to close.',
          ],
          do: ['Put it last inside a full-screen container so it covers the screen.', 'Give it the spoken name of its title.'],
          dont: ['Nest one OverlaySheet inside another; render them side by side and mark the lower one `covered`.', 'Add a shadow or a blur behind it.'],
        }),
      },
    },
  },
} satisfies Meta<typeof OverlaySheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('One sheet risen over the screen, the screen behind at 35%.'),
};

export const LongContent: Story = {
  name: 'Long content',
  render: (args) => (
    <>
      <ScreenBehind title="Lineup" />
      <OverlaySheet {...args}>
        <Text variant="headline" accessibilityRole="header">
          Sheet title
        </Text>
        {Array.from({ length: 14 }, (_, i) => (
          <Text key={i} tone="muted">
            Line {i + 1} of content that runs past the sheet’s 92% height and scrolls inside it.
          </Text>
        ))}
        <Button label="Primary action" onPress={fn()} />
      </OverlaySheet>
    </>
  ),
  parameters: storyDoc('Content taller than the screen: the sheet stops at 92% and scrolls inside.'),
};

function Chained() {
  const [step, setStep] = useState<'first' | 'second' | null>(null);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
        <Text variant="headline">Lineup</Text>
        <Button label="Start" onPress={() => setStep('first')} />
      </View>
      <OverlaySheet visible={step != null} onClose={() => setStep(null)} accessibilityLabel="First step" covered={step === 'second'}>
        <Text variant="headline" accessibilityRole="header">
          First step
        </Text>
        <Text tone="muted">The next sheet rises over this one without waiting for it to close.</Text>
        <Button label="Next" onPress={() => setStep('second')} />
      </OverlaySheet>
      <OverlaySheet visible={step === 'second'} onClose={() => setStep(null)} accessibilityLabel="Second step">
        <Text variant="headline" accessibilityRole="header">
          Second step
        </Text>
        <Text tone="muted">The first sheet stays underneath, out of VoiceOver’s reach.</Text>
        <Button label="Done" onPress={() => setStep(null)} />
      </OverlaySheet>
    </View>
  );
}

export const Interactive: Story = {
  render: () => <Chained />,
  parameters: storyDoc('Start, then Next: one sheet follows another, the way review leads to payment.'),
};
