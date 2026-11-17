import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ArrowUpRight } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

type DialogProps = {
  /** Second action: none, a primary that stays in the app, a primary that leaves it, or a destructive one. */
  second: 'none' | 'primary' | 'leaves' | 'destructive';
  visible?: boolean;
  onClose?: () => void;
};

/**
 * The centred dialog's layout, as DateChangeDialog draws it: a 16px card with
 * a 1px border and 20pt padding over the screen dimmed to 35%, 20pt in from
 * each side. Placeholder copy only.
 */
function Dialog({ second, visible = true, onClose = fn() }: DialogProps) {
  const c = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: c.dim }]}>
        <View accessibilityViewIsModal accessibilityLabel="Dialog title" style={[styles.dialog, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text variant="headline" accessibilityRole="header">
            Dialog title as a question?
          </Text>
          <Text variant="secondary" tone="muted" style={styles.body}>
            One or two lines saying what is at stake and what each answer does.
          </Text>
          <View style={styles.actions}>
            <Button label="Keep it" variant="secondary" compact onPress={onClose} style={styles.action} />
            {second === 'none' ? null : (
              <Button
                label={second === 'destructive' ? 'Undo it' : second === 'leaves' ? 'Open elsewhere' : 'Go ahead'}
                variant={second === 'destructive' ? 'destructive' : 'primary'}
                compact
                trailingIcon={second === 'leaves' ? <ArrowUpRight size={14} color={c.onBrand} strokeWidth={2} /> : undefined}
                onPress={onClose}
                style={styles.action}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const meta = {
  title: 'Templates/Centered dialog',
  tags: ['autodocs'],
  render: () => (
    <>
      <ScreenBehind />
      <Dialog second="primary" />
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The layout of a decision: a centred 16px card (`card` fill, 1px border, 20pt padding, 14pt between its parts) over the screen dimmed to 35%, 20pt in from each side. A 20pt headline asking the question, one or two 14pt muted lines on what each answer does, then two 48pt buttons side by side: the safe answer first as secondary, the other as primary (or destructive when it undoes what the organizer set up).',
          use: 'when the next step needs a yes or no before anything happens: the date-change dialog (`DateChangeDialog`) is the one in the app today. Page that raises it: Date & time.',
          avoid: 'for a task with fields or a list (Bottom sheet template), or to report something that needs no answer (a `Notice` on the screen).',
          usage: `<Modal visible transparent animationType="fade" onRequestClose={keep}>
  <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: c.dim }}>
    <View style={{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 20, gap: 14 }}>
      <Text variant="headline" accessibilityRole="header">Change the date?</Text>
      …
    </View>
  </View>
</Modal>`,
          a11y: [
            'The card is a modal for VoiceOver with its own spoken label; the title is a header.',
            'The safe answer comes first in focus order; both buttons are 48pt.',
            'System back and Android back give the safe answer.',
            'It fades in; there is nothing to reduce under Reduce Motion.',
          ],
          do: [
            'Name both answers for what they do (“Keep Fri, Nov 20”, “Manage in Gelatin”), never Yes and No.',
            'Use the 14px compact label so both fit side by side.',
            'Add a 14px trailing arrow when an answer leaves the app.',
          ],
          dont: ['Put a third button in a dialog.', 'Use destructive for anything but undoing what the organizer set up.', 'Give the card a shadow.'],
        }),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('A question with a safe answer and a primary one, side by side.'),
};

export const LeavesTheApp: Story = {
  name: 'An answer that leaves the app',
  render: () => (
    <>
      <ScreenBehind />
      <Dialog second="leaves" />
    </>
  ),
  parameters: storyDoc('The second answer opens somewhere else, so it carries the trailing arrow, as Manage in Gelatin does.'),
};

export const Destructive: Story = {
  render: () => (
    <>
      <ScreenBehind />
      <Dialog second="destructive" />
    </>
  ),
  parameters: storyDoc('The second answer undoes something the organizer set up: the red fill.'),
};

export const OneWayOut: Story = {
  name: 'One way out',
  render: () => (
    <>
      <ScreenBehind />
      <Dialog second="none" />
    </>
  ),
  parameters: storyDoc('Only the safe answer, when the other isn’t possible yet.'),
};

function Opening() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
      <Text variant="headline">Screen title</Text>
      <Button label="Ask the question" onPress={() => setOpen(true)} />
      <Dialog second="primary" visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

export const Interactive: Story = {
  render: () => <Opening />,
  parameters: storyDoc('Raise the dialog, then answer it either way.'),
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: space.gutter },
  dialog: { borderWidth: 1, borderRadius: radius.card, padding: space.gutter, gap: space.card },
  body: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  action: { flex: 1, height: size.secondaryButton, paddingHorizontal: space.xs },
});
