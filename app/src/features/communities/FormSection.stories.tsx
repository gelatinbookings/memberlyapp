import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { AtSign, Gift, Type } from 'lucide-react-native';

import { TextField } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { FormSection } from './FormSection';

const meta = {
  title: 'Molecules/FormSection',
  component: FormSection,
  tags: ['autodocs'],
  args: {
    icon: Type,
    title: 'The basics',
    line: 'Your name and the one line people see first.',
    children: <TextField label="Community name" placeholder="What people will call it" />,
  },
  argTypes: {
    optional: { control: 'boolean' },
    filled: { control: 'boolean' },
    icon: { control: false },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A section of a long form in its own card: a 36px muted icon tile, a title and one line, then the fields under a hairline. An optional section starts folded, with a chevron, and opens on a tap or by itself once something is in it.',
          use: 'to break a long form into named parts, as Create community does: the basics, social links, a referral code.',
          avoid: 'for the sections of Create New Event, which open their own screens (use `SectionCard`), or for a single field.',
          usage: `<FormSection icon={AtSign} title="Social links" line="Shown as icons on your public page." optional filled={linksFilled}>
  <TextField label="Instagram" placeholder="https://instagram.com/yourhandle" />
</FormSection>`,
          a11y: [
            'The title has role `header`.',
            'An optional section’s head is a `button` spoken as “Social links, optional” with `expanded` state.',
            'The head is at least 44pt tall.',
          ],
          do: [
            'Say “Optional.” first in the line of an optional section (done for you).',
            'Keep an optional section open while it has something in it, so nothing typed is hidden.',
          ],
          dont: ['Fold a required section.', 'Nest a card inside the section; fields sit straight on it.'],
        }),
      },
    },
  },
} satisfies Meta<typeof FormSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Required: Story = {
  parameters: storyDoc('A required part of the form: always open, no chevron.'),
};

export const OptionalFolded: Story = {
  name: 'Optional, folded',
  args: {
    icon: AtSign,
    title: 'Social links',
    line: 'Shown as icons on your public page.',
    optional: true,
    children: <TextField label="Instagram" placeholder="https://instagram.com/yourhandle" />,
  },
  parameters: storyDoc('An optional part with nothing in it yet: folded to keep the form short. Tap it to open.'),
};

export const OptionalFilled: Story = {
  name: 'Optional, filled',
  args: {
    icon: Gift,
    title: 'Referral code',
    line: 'Did someone refer you to Memberly?',
    optional: true,
    filled: true,
    children: <TextField label="Referral code" hideLabel value="SECOND24" />,
  },
  parameters: storyDoc('An optional part with something in it: it stays open and can’t be folded away.'),
};
