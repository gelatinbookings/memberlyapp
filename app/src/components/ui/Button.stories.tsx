import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ArrowRight, ArrowUpRight } from 'lucide-react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  args: { label: 'Browse talent', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'destructive'] },
    icon: { control: false },
    trailingIcon: { control: false },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The primary action on a screen or sheet. Full width, 6px radius (the Memberly control radius). Primary and destructive are 52pt; secondary is 48pt with a 1px border. Pressed eases to 0.97 and darkens.',
          use: 'for the one main action of a screen, sheet or dialog (Browse talent, Pay now, Create community), and for its quieter alternative beside it (Save as draft).',
          avoid: 'for light actions inside a row or card: use `PillButton`. For an icon-only control use `IconButton`; for a link in running text use brand-toned `Text` in a `Pressable`.',
          usage: `<Button label="Create community" onPress={create} loading={saving} />
<Button label="Save as draft" variant="secondary" onPress={saveDraft} />`,
          a11y: [
            'Role `button`; the label is the spoken name. Add `accessibilityHint` when the result isn’t obvious.',
            '`disabled` and `loading` are announced through `accessibilityState` (`disabled`, `busy`).',
            '52pt / 48pt tall: above the 44pt minimum.',
            'The pressed scale is off under Reduce Motion; the button only darkens.',
          ],
          do: [
            'Name the action: “Send 2 offers”, “Pay now”, “Manage in Gelatin”.',
            'Say nearby why a disabled button can’t run yet, or put the reason in the label as Create community does.',
            'Use an 18px trailing `ArrowUpRight` when the action leaves the app.',
          ],
          dont: [
            'Put two primary buttons on one screen.',
            'Use destructive for anything but undoing what the organizer set up (Change date, Cancel).',
            'Round it into a pill: round is for lighter actions.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  parameters: storyDoc('The one main action on a screen or sheet: Browse talent, Pay now, Create community.'),
};

export const Secondary: Story = {
  args: { label: 'Save as draft', variant: 'secondary' },
  parameters: storyDoc('The quieter alternative beside a primary action, such as Save as draft.'),
};

export const Destructive: Story = {
  args: { label: 'Change date', variant: 'destructive' },
  parameters: storyDoc('Only for actions that undo something the organizer set up: Change date, Cancel.'),
};

export const Disabled: Story = {
  args: { label: 'Send 2 offers', disabled: true },
  parameters: storyDoc('When the action can’t run yet; say why nearby (for example, a fee is missing).'),
};

export const Loading: Story = {
  args: { label: 'Holding your card', loading: true },
  parameters: storyDoc('While the action is in flight; the button stays in place and can’t be pressed twice.'),
};

export const WithTrailingIcon: Story = {
  name: 'With trailing icon',
  args: {
    label: 'Manage in Gelatin',
    variant: 'secondary',
    trailingIcon: <ArrowUpRight size={18} color={darkPalette.foreground} strokeWidth={2} />,
  },
  parameters: storyDoc('An 18px trailing icon when the action leaves the app (opens Gelatin or the web).'),
};

export const Compact: Story = {
  render: (args) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button {...args} label="Keep Fri, Nov 20" variant="secondary" compact style={{ flex: 1 }} />
      <Button {...args} label="Continue" compact style={{ flex: 1 }} trailingIcon={<ArrowRight size={14} color={darkPalette.onBrand} strokeWidth={2} />} />
    </View>
  ),
  parameters: storyDoc('Two buttons side by side in a centred dialog, with the 14px label.'),
};
