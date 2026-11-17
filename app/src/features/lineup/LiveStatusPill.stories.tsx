import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PillButton, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { space } from '@/theme/tokens';

import { LiveStatusPill } from './LiveStatusPill';

const meta = {
  title: 'Atoms/LiveStatusPill',
  component: LiveStatusPill,
  tags: ['autodocs'],
  args: { djName: 'BLKMTN', status: 'requested' },
  argTypes: {
    status: {
      control: 'select',
      options: ['authorization_required', 'requested', 'negotiating', 'reauthorization_required', 'confirmed', 'declined', 'expired', 'cancelled'],
    },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A booking’s `StatusPill` on the Lineup that notices change. When a poll brings a new status while the card is on screen, the old pill fades out as the new one fades in (200ms, opacity only) and VoiceOver announces it: “BLKMTN: Confirmed”.',
          use: 'on a booking card on the Lineup, where statuses update every few seconds while a DJ is deciding.',
          avoid: 'anywhere a status doesn’t change while you look at it: use `StatusPill`.',
          usage: `<LiveStatusPill djName={booking.dj.name} status={booking.status} />`,
          a11y: [
            'A change is announced once, with the DJ’s name and the new label.',
            'A card that has just appeared neither fades nor announces.',
            'Under Reduce Motion the pill simply changes, and is still announced.',
          ],
          do: ['Pass the DJ’s name so the announcement says whose booking changed.'],
          dont: ['Animate anything but opacity: no glow, bounce or colour sweep.', 'Announce on first render.'],
        }),
      },
    },
  },
} satisfies Meta<typeof LiveStatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Steady: Story = {
  parameters: storyDoc('Nothing has changed since the card appeared: the pill just sits there.'),
};

const NEXT: Record<string, string> = { requested: 'confirmed', confirmed: 'declined', declined: 'requested' };

function Poll() {
  const [status, setStatus] = useState('requested');
  return (
    <View style={styles.stack}>
      <LiveStatusPill djName="BLKMTN" status={status} />
      <Text variant="helper" tone="muted">
        Each tap stands in for a poll that brings a new status.
      </Text>
      <PillButton label="Next poll" onPress={() => setStatus((s) => NEXT[s] ?? 'requested')} style={styles.button} />
    </View>
  );
}

export const ChangesAfterAPoll: Story = {
  name: 'Changes after a poll',
  render: () => <Poll />,
  parameters: storyDoc('Tap Next poll: the pill cross-fades to the new status, as when a DJ accepts while you watch.'),
};

const styles = StyleSheet.create({
  stack: { gap: space.stack },
  button: { alignSelf: 'flex-start' },
});
