import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { AddedDjCard } from './AddedDjCard';

const meta = {
  title: 'Molecules/AddedDjCard',
  component: AddedDjCard,
  tags: ['autodocs'],
  args: { onChange: fn(), onRemove: fn() },
  argTypes: { offer: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A DJ on the lineup whose offer isn’t sent yet: avatar, name, tier and rate, an X to remove, Your offer (a money field) and an optional note to the DJ. An offer is a fee plus a note, nothing more.',
          use: 'on the Lineup, for each DJ you added from Browse talent, before you send offers.',
          avoid: 'once the offer is sent (use `BookingCard`) or while browsing (use `DjCard`).',
          usage: `<AddedDjCard offer={offer} onChange={(patch) => update(offer.dj.id, patch)} onRemove={() => remove(offer.dj.id)} />`,
          a11y: [
            'The fee field is spoken “Your offer to KOYO, in dollars”; the note “Note to KOYO”.',
            'Remove is a 36pt icon button with a 44pt target, spoken “Remove KOYO”.',
            'A missing fee is announced as the field’s hint and shown in amber under it.',
          ],
          do: [
            'Prefill the fee with the published rate; leave it empty for a private rate.',
            'Say plainly that a fee is needed before the offer can be sent.',
            'Save what’s typed as it’s typed, so nothing is lost when the keyboard closes.',
          ],
          dont: ['Show a total here: the server prices the offer on the review sheet.', 'Add terms beyond the fee and the note.'],
        }),
      },
    },
  },
} satisfies Meta<typeof AddedDjCard>;

export default meta;
type Story = StoryObj<typeof AddedDjCard>;

export const PublishedRate: Story = {
  name: 'Published rate',
  render: (args) => (
    <Sample name="drafts" load={(repo) => repo.getDraftOffers('e_late_service')}>
      {(offers) => <AddedDjCard {...args} offer={offers[0]} />}
    </Sample>
  ),
  parameters: storyDoc('A DJ with a published rate: the fee starts at that rate. Change it or add a note.'),
};

export const FeeMissing: Story = {
  name: 'Fee missing',
  render: (args) => (
    <Sample name="drafts" load={(repo) => repo.getDraftOffers('e_late_service')}>
      {(offers) => <AddedDjCard {...args} offer={offers[1]} />}
    </Sample>
  ),
  parameters: storyDoc('A private-rate DJ: no fee yet, so the field warns in amber. Type a fee to clear it.'),
};

export const TwoAdded: Story = {
  name: 'Two added',
  render: (args) => (
    <Sample name="drafts" load={(repo) => repo.getDraftOffers('e_late_service')}>
      {(offers) => (
        <Stack>
          {offers.map((o) => (
            <AddedDjCard key={o.dj.id} {...args} offer={o} />
          ))}
        </Stack>
      )}
    </Sample>
  ),
  parameters: storyDoc('The Lineup of a draft with two DJs added and nothing sent: one priced, one waiting for a fee.'),
};

/** A note close to the limit, so the character count shows. Story copy, not sample data. */
const LONG_NOTE =
  'Headline set, midnight to 2. The room holds about 300 and the crowd is there for house and Afrobeats, so keep it warm early and build after 1. ' +
  'There’s a full booth with monitors; bring your own headphones and a backup USB. Load-in is from 10 through the side door on Foundry St.';

export const LongNote: Story = {
  name: 'Long note',
  render: (args) => (
    <Sample name="drafts" load={(repo) => repo.getDraftOffers('e_late_service')}>
      {(offers) => <AddedDjCard {...args} offer={{ ...offers[0], note: LONG_NOTE }} />}
    </Sample>
  ),
  parameters: storyDoc('A note near the 280-character limit: the helper under it counts the characters used.'),
};
