import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Image } from 'expo-image';
import { ArrowLeft, Heart, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';
import { darkPalette, radius } from '@/theme/tokens';

import { IconButton } from './IconButton';

const icon = (I: typeof Search, size = 18, color: string = darkPalette.foreground) => <I size={size} color={color} strokeWidth={2} />;

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: { icon: icon(ArrowLeft), accessibilityLabel: 'Back', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['outline', 'card', 'scrim', 'plain'] },
    size: { control: { type: 'range', min: 36, max: 48, step: 2 } },
    icon: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A round button with one icon and no label: back, close, search, filters, remove. Outline by default; `card` for over-map controls, `scrim` over a photo, `plain` inside a card.',
          use: 'when the icon is the whole message and a label would crowd the row: the back arrow in a header, the X that removes a DJ, the search button over the map.',
          avoid: 'when the action needs words to be understood: use `PillButton` (in a row) or `Button` (the screen’s main action). Never for a link in running text.',
          usage: `<IconButton
  accessibilityLabel="Back"
  icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />}
  onPress={() => router.back()}
/>`,
          a11y: [
            'Role `button`. `accessibilityLabel` is required: it is the only spoken name.',
            'Visual size is 36–48; the hit area is always at least 44pt (hit slop makes up the rest).',
            'Icons are 18px in rows and headers, 20px over the map, 16px for chevrons.',
          ],
          do: [
            'Name the action in the spoken label, with the object when it helps: “Remove KOYO”.',
            'Use the `card` variant at 48 over the map, with a 1px border.',
            'Use `scrim` only over a photo, where the 60% black pill keeps the icon legible.',
          ],
          dont: [
            'Add a shadow or a glass effect to lift it off the map.',
            'Use an icon nobody would guess without a label; add the label and use a `PillButton`.',
            'Shrink the hit area below 44pt.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {
  parameters: storyDoc('The default: back in a screen header, or a quiet control beside a title.'),
};

export const Card: Story = {
  args: { variant: 'card', size: 48, accessibilityLabel: 'Search', icon: icon(Search, 20) },
  parameters: storyDoc('Over the map: a 48pt card-filled control such as search or filters.'),
};

export const Plain: Story = {
  args: { variant: 'plain', size: 36, accessibilityLabel: 'Remove KOYO', icon: icon(X, 18, darkPalette.mutedText) },
  parameters: storyDoc('Inside a card, with no border: the X that removes a DJ you added. 36 to see, 44 to tap.'),
};

export const Scrim: Story = {
  render: (args) => (
    <Sample name="cover" load={(repo) => repo.getEvent('e_warehouse_friday')}>
      {(event) => (
        <View style={styles.photo}>
          {event ? <Image source={event.cover} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <View style={styles.corner}>
            <IconButton {...args} variant="scrim" size={36} accessibilityLabel="Save event" icon={icon(Heart, 18, darkPalette.onBrand)} />
          </View>
        </View>
      )}
    </Sample>
  ),
  parameters: storyDoc('Over a cover photo: the 60% black scrim keeps a white icon legible on any photo.'),
};

export const Sizes: Story = {
  render: (args) => (
    <View style={styles.row}>
      <IconButton {...args} size={36} accessibilityLabel="Filters, small" icon={icon(SlidersHorizontal, 16)} />
      <IconButton {...args} size={44} accessibilityLabel="Filters" icon={icon(SlidersHorizontal)} />
      <IconButton {...args} size={48} variant="card" accessibilityLabel="Filters, over the map" icon={icon(SlidersHorizontal, 20)} />
    </View>
  ),
  parameters: storyDoc('36, 44 and 48. Every size taps at 44pt or more.'),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  photo: { height: 150, borderRadius: radius.card, overflow: 'hidden' },
  corner: { position: 'absolute', top: 10, right: 10 },
});
