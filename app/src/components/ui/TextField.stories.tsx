import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';

import { centsToDollarsField, FEE_MISSING_MESSAGE, sanitizeDollars } from '@/features/booking/offers';
import { linkProblem } from '@/features/communities/communityForm';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { TextField } from './TextField';

const meta = {
  title: 'Molecules/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Community name', placeholder: 'What people will call it' },
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    warning: { control: 'text' },
    prefix: { control: 'text' },
    money: { control: 'boolean' },
    multiline: { control: 'boolean' },
    hideLabel: { control: 'boolean' },
    style: { control: false },
    inputStyle: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A 48pt text field: 13px/500 label 6px above, a card-filled box with a 6px radius and 1px border, and a 12px muted helper below. Focus eases in the purple ring. A warning turns the outline and helper amber. Takes every React Native `TextInput` prop.',
          use: 'for anything typed: names, taglines, a note to a DJ, an offer fee (with the “$” prefix and money type).',
          avoid: 'for picking from a list (use `SelectField`, which opens a sheet) or for search over the map (an over-map control).',
          usage: `<TextField label="Tagline" value={tagline} onChangeText={setTagline} helper="One line, shown under your name everywhere." />
<TextField label="Your offer to KOYO, in dollars" hideLabel prefix="$" money keyboardType="number-pad" value={fee} onChangeText={setFee} />`,
          a11y: [
            'The label is the field’s spoken name, even with `hideLabel`. The warning, or else the helper, is the spoken hint.',
            '48pt tall; multiline grows from 104pt.',
            'The ring fades in over 200ms; under Reduce Motion it appears at once.',
            'Text scales with Dynamic Type; the box grows with it.',
          ],
          do: [
            'Write the label as what goes in, in sentence case; put examples in the placeholder.',
            'Say what’s wrong and how to fix it in the warning: “Enter a fee to send this offer.”',
            'Use `prefix="$"` and `money` for a fee, and only for a fee the organizer types.',
          ],
          dont: [
            'Put a total the app worked out in a field.',
            'Use the error red for a field that just needs filling in: amber warns, red is for failure.',
            'Round the field into a pill: fields are 6px.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rest: Story = {
  parameters: storyDoc('An empty field, before anyone types: label, box and placeholder.'),
};

export const Filled: Story = {
  args: { value: 'Second Sundays' },
  parameters: storyDoc('A field with something in it.'),
};

export const Focused: Story = {
  args: { autoFocus: true },
  parameters: storyDoc('While you type: the purple ring sits over the border. Click into any field to see it.'),
};

export const WithHelper: Story = {
  name: 'With helper',
  args: { label: 'Tagline', placeholder: 'Bringing live upscale events to you.', helper: 'One line, shown under your name everywhere.' },
  parameters: storyDoc('A short line under the field that says how it’s used.'),
};

export const Money: Story = {
  render: (args) => (
    <Sample name="draft" load={(repo) => repo.getDraftOffers('e_late_service')}>
      {(offers) => (
        <TextField
          {...args}
          label={`Your offer to ${offers[0].dj.name}, in dollars`}
          prefix="$"
          money
          keyboardType="number-pad"
          value={centsToDollarsField(offers[0].offerCents)}
          placeholder="Fee"
        />
      )}
    </Sample>
  ),
  parameters: storyDoc('An offer fee: a muted “$” prefix and bold tabular figures. Prefilled with the DJ’s published rate.'),
};

export const Multiline: Story = {
  args: {
    label: 'Description',
    multiline: true,
    placeholder: 'Who it’s for, what a night with you feels like, and how often you meet.',
    helper: '0/500',
  },
  parameters: storyDoc('Longer text: a community description or a note to a DJ. Starts 104pt tall and grows.'),
};

function Typing() {
  const [note, setNote] = useState('');
  return (
    <TextField
      label="Note to KOYO"
      value={note}
      placeholder="Set time, the room, what you need"
      maxLength={280}
      onChangeText={setNote}
      helper={note.length >= 240 ? `${note.length} of 280 characters` : 'Optional. KOYO sees it with your offer.'}
    />
  );
}

export const Warning: Story = {
  args: { label: 'Instagram', value: 'instagram', helper: undefined, warning: linkProblem('instagram') },
  parameters: storyDoc('Something needs fixing before you can go on: amber outline and amber helper.'),
};

export const FeeMissing: Story = {
  name: 'Fee missing',
  args: {
    label: 'Your offer to NIGHTFORM, in dollars',
    prefix: '$',
    money: true,
    placeholder: 'Fee',
    warning: FEE_MISSING_MESSAGE,
    keyboardType: 'number-pad',
  },
  parameters: storyDoc('A private-rate DJ with no fee entered yet: the offer can’t be sent until there is one.'),
};

export const TypeInIt: Story = {
  name: 'Type in it',
  render: () => <Typing />,
  parameters: storyDoc('A working field: type to see the ring, and the character count once you’re near the 280 limit.'),
};

function FeeTyping() {
  const [fee, setFee] = useState('');
  return (
    <TextField
      label="Your offer to NIGHTFORM, in dollars"
      prefix="$"
      money
      keyboardType="number-pad"
      placeholder="Fee"
      value={fee}
      maxLength={6}
      warning={fee ? null : FEE_MISSING_MESSAGE}
      onChangeText={(t) => setFee(sanitizeDollars(t))}
    />
  );
}

export const TypeAFee: Story = {
  name: 'Type a fee',
  render: () => <FeeTyping />,
  parameters: storyDoc('A working money field: only whole dollars go in, and the warning clears once there’s a fee.'),
};
