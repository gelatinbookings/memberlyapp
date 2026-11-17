import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { AnimatedSplash } from './AnimatedSplash';

const meta = {
  title: 'Organisms/AnimatedSplash',
  component: AnimatedSplash,
  tags: ['autodocs'],
  args: { ready: false, known: true, backdrop: false, onShown: fn(), onDone: fn() },
  argTypes: { ready: { control: 'boolean' }, known: { control: 'boolean' }, backdrop: { control: 'boolean' } },
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The JavaScript half of launch. It first draws exactly what the native splash shows (black, the wordmark at the same size) so hiding the native splash is seamless; then a purple disc pulses out behind the mark, the mark breathes once, and the whole layer cross-fades into the first screen. Signed out, the Welcome poster fades in behind the mark. Under about 1.6 seconds, and it never waits on itself.',
          use: 'once, in the root layout, over the first screen while fonts, the session and the gate settle.',
          avoid: 'as a loading screen anywhere else: screens show skeletons. Never hold it open on purpose.',
          usage: `{splashDone ? null : (
  <AnimatedSplash ready={placed} known={sessionRead} backdrop={!signedIn} onShown={hideNativeSplash} onDone={() => setSplashDone(true)} />
)}`,
          a11y: [
            'The layer is hidden from VoiceOver and ignores touches; the first screen is what gets read.',
            'Under Reduce Motion there is no disc and no scale: it only fades.',
            'Transform and opacity only; no glow, no gradient, no shadow.',
          ],
          do: ['Leave as soon as the first screen is ready and the pulse is done.', 'Keep the mark the same size as the native splash image.'],
          dont: ['Add a second colour or a glow to the pulse.', 'Block on data that a screen can load itself.'],
        }),
      },
    },
  },
} satisfies Meta<typeof AnimatedSplash>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Holding: Story = {
  parameters: storyDoc('The first screen isn’t placed yet: the mark holds after its pulse. Switch `ready` on to see it leave.'),
};

export const SignedOut: Story = {
  name: 'Signed out',
  args: { backdrop: true },
  parameters: { memberly: { signedIn: false }, ...storyDoc('Nobody signed in: the Welcome poster fades in behind the mark, ready for Welcome’s video.') },
};

export const SessionNotRead: Story = {
  name: 'Session not read yet',
  args: { known: false },
  parameters: storyDoc('Before the session is read the pulse waits, so it starts over the right background.'),
};

function Replay() {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
        <Text variant="headline">First screen</Text>
        <Button
          label="Replay the launch"
          onPress={() => {
            setDone(false);
            setRun((n) => n + 1);
          }}
        />
      </View>
      {done ? null : <AnimatedSplash key={run} ready onShown={fn()} onDone={() => setDone(true)} />}
    </View>
  );
}

export const Interactive: Story = {
  render: () => <Replay />,
  parameters: storyDoc('The whole launch with the first screen ready: pulse, then cross-fade. Replay it with the button.'),
};
