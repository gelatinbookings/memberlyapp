import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { type, type TypeVariant } from '@/theme/tokens';

import { Text, type TextTone } from './Text';

const VARIANTS = Object.keys(type) as TypeVariant[];
const TONES: TextTone[] = ['default', 'muted', 'brand', 'onBrand', 'success', 'warning', 'error'];

const meta = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  args: { children: 'A long night in a raw room on the Westside.', variant: 'body', tone: 'default' },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    tone: { control: 'select', options: TONES },
    align: { control: 'inline-radio', options: ['auto', 'left', 'center', 'right'] },
    children: { control: 'text' },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'All text in the app. A variant picks the size, weight and line height from `type` in tokens.ts; a tone picks the colour role.',
          use: 'for every word on screen, including button labels inside your own parts.',
          avoid: 'for amounts you work out yourself: `money` shows only a total the server sent. Don’t use React Native’s `Text` directly; it skips the Inter faces and the Dynamic Type cap.',
          usage: `<Text variant="headline" accessibilityRole="header">Create New Event</Text>
<Text variant="secondary" tone="muted">Second Sundays · draft</Text>`,
          a11y: [
            'Scales with Dynamic Type up to 2× (pills, the `label` variant, up to 1.4×).',
            'Give screen and section titles `accessibilityRole="header"` so VoiceOver can jump between them.',
            '`mutedText` meets 4.5:1 on black and on card; keep muted text on those grounds.',
          ],
          do: ['Write in sentence case and the second person.', 'Use `money` only beside a line that says held, charged or released.'],
          dont: ['Put an eyebrow or kicker above a heading.', 'Uppercase anything except the 10px `label` inside a pill.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: storyDoc('Try any variant and tone with the controls.'),
};

export const EveryVariant: Story = {
  name: 'Every variant',
  render: () => (
    <View style={{ gap: 12 }}>
      {VARIANTS.map((v) => (
        <Text key={v} variant={v}>
          {v === 'money' ? '0123456789' : v === 'label' ? 'Confirmed' : `${v}: Warehouse Friday`}
        </Text>
      ))}
    </View>
  ),
  parameters: storyDoc('The whole scale, top to bottom, as Foundations / Typography lists it.'),
};

export const EveryTone: Story = {
  name: 'Every tone',
  render: () => (
    <View style={{ gap: 8 }}>
      {TONES.filter((t) => t !== 'onBrand').map((t) => (
        <Text key={t} tone={t}>
          {t}: Card held · waiting for the DJ
        </Text>
      ))}
    </View>
  ),
  parameters: storyDoc('Default for primary text, muted for meta, brand for links, and the three status tones.'),
};
