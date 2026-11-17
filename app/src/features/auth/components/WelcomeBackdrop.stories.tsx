import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { WelcomeBackdrop, WelcomePoster, WelcomeScrim } from './WelcomeBackdrop';

/** Placeholder copy where Welcome's wordmark, line and buttons sit, to judge legibility over the scrim. */
function OverIt() {
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 50, gap: 10 }}>
      <Text variant="display">Title over the video</Text>
      <Text tone="muted">One line of copy sits on the darkest part of the scrim.</Text>
      <Button label="Primary action" />
      <Button label="Secondary action" variant="secondary" />
    </View>
  );
}

const meta = {
  title: 'Organisms/WelcomeBackdrop',
  component: WelcomeBackdrop,
  subcomponents: { WelcomePoster, WelcomeScrim },
  tags: ['autodocs'],
  render: () => (
    <>
      <WelcomeBackdrop />
      <OverIt />
    </>
  ),
  parameters: {
    frame: 'screen',
    memberly: { signedIn: false, route: { pathname: '/welcome' } },
    docs: {
      description: {
        component: componentDocs({
          what: 'Welcome’s background. `WelcomeBackdrop` lays the poster still, then cross-fades the muted, looping crowd video in once its first frame is ready, so it never flashes black. `WelcomeScrim` is one flat 60% black layer over all of it, and a black-only fade over the lower part where the copy and buttons sit: the one fade DESIGN.md allows, a legibility scrim over media. `WelcomePoster` is the still with the scrim, which the launch splash shows behind the mark.',
          use: 'behind Welcome, and behind Sign in and Create account (the video keeps playing under them).',
          avoid: 'behind any other screen, or as a decorative wash: the scrim exists only so text over the video reads.',
          usage: `<View style={{ flex: 1 }}>
  <WelcomeBackdrop />
  <WelcomeContent />
</View>`,
          a11y: [
            'The whole backdrop ignores touches and is decoration; nothing in it is read.',
            'Under Reduce Motion there is no video: the poster stays still.',
            'The video is muted and mixes with other audio, so the member’s music keeps playing.',
            'It plays only while Welcome or its sheets are on top and the app is active.',
          ],
          do: ['Keep the scrim black only.', 'Put text on the lower, darker part.'],
          dont: ['Add a coloured or purple gradient.', 'Play sound.'],
        }),
      },
    },
  },
} satisfies Meta<typeof WelcomeBackdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Backdrop: Story = {
  parameters: storyDoc('Welcome’s background as it plays: the poster, the crowd video fading in over it, and the scrim.'),
};

export const Poster: Story = {
  render: () => (
    <>
      <WelcomePoster />
      <OverIt />
    </>
  ),
  parameters: storyDoc('The still poster with its scrim: under Reduce Motion, and behind the launch mark.'),
};

export const Scrim: Story = {
  render: () => (
    <>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: darkPalette.muted }} />
      <WelcomeScrim />
      <OverIt />
    </>
  ),
  parameters: storyDoc('The scrim alone over a flat muted fill, so its two layers show: the flat 60% and the fade where the copy sits.'),
};
