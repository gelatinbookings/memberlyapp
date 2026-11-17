import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Info } from 'lucide-react-native';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { Notice } from './Notice';

const HOLD_LINE = 'Your card is held, not charged. You’re charged only if KOYO accepts. If they pass or don’t answer, the hold is released.';

const meta = {
  title: 'Molecules/Notice',
  component: Notice,
  tags: ['autodocs'],
  args: { children: HOLD_LINE, tone: 'muted' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['muted', 'tint', 'warning', 'error'] },
    children: { control: 'text' },
    title: { control: 'text' },
    icon: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'An inset message in a 12px box with 13px text: muted grey, purple tint with the purple line, amber warning, or red error. An optional bold title leads in on the same line.',
          use: 'for a line that explains what’s happening on this screen: the hold line, back from Gelatin, offers saved while offline, talent unavailable.',
          avoid: 'for a whole-screen failure (use `ErrorState`), a field problem (use the field’s `warning`), or transient feedback that should disappear.',
          usage: `<Notice>Your card is held, not charged. You’re charged only if KOYO accepts. If they pass or don’t answer, the hold is released.</Notice>
<Notice tone="error" title="Talent is unavailable right now.">Your event is safe and nothing was sent.</Notice>`,
          a11y: [
            'The error tone has role `alert`, so VoiceOver reads it when it appears.',
            'Every tone’s text meets 4.5:1 on its own fill; 13px text scales with Dynamic Type.',
          ],
          do: [
            'Say plainly what is held, charged or released, using the hold line word for word.',
            'Use the tint for good news that involves Gelatin, such as Back from Gelatin.',
            'Say what is still safe when something fails: “Nothing was sent.”',
          ],
          dont: ['Stack two notices.', 'Use a notice as decoration or a marketing banner.', 'Put a button inside one; the action goes below it.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Muted: Story = {
  parameters: storyDoc('The hold line, under a money summary or after paying: the everyday notice.'),
};

export const Tint: Story = {
  args: { tone: 'tint', children: 'Back from Gelatin. Your lineup is up to date.' },
  parameters: storyDoc('Returning from Gelatin: purple tint with the purple line.'),
};

export const Warning: Story = {
  args: { tone: 'warning', children: 'You’re offline. Your offers are saved and will send when you’re back.' },
  parameters: storyDoc('Something needs your attention but nothing is lost, such as being offline.'),
};

export const ErrorTone: Story = {
  name: 'Error',
  args: { tone: 'error', title: 'Talent is unavailable right now.', children: 'Your event is safe and nothing was sent.' },
  parameters: storyDoc('Something failed: the bold title names it and the line says what is still safe.'),
};

export const WithTitle: Story = {
  name: 'With title',
  args: {
    title: 'No lineup right now?',
    children: 'You can publish without a lineup. Nothing is sent to a DJ and nothing is charged until you pay for an offer.',
  },
  parameters: storyDoc('A bold lead-in in the foreground colour, then the explanation.'),
};

export const WithIcon: Story = {
  name: 'With icon',
  args: { icon: <Info size={16} color={darkPalette.mutedText} strokeWidth={2} /> },
  parameters: storyDoc('A 16px icon on the left when it helps the notice be found.'),
};

export const Centred: Story = {
  args: { center: true, children: 'Secure checkout by Gelatin. Memberly never sees your card.' },
  parameters: storyDoc('Centred text, under a centred heading such as Card held.'),
};
