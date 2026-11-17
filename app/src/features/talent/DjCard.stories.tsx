import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import type { Dj } from '@/data/types';
import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { Attribution } from './BrowseStates';
import { DjCard } from './DjCard';

/** A DJ from the sample catalog, as the fake server returns it on a booking. */
const djOf = (status: string) => (repo: Parameters<typeof bookingIn>[0]) => bookingIn(repo, status).then((b) => b.dj);

const meta = {
  title: 'Molecules/DjCard',
  component: DjCard,
  tags: ['autodocs'],
  args: { added: false, onToggle: fn(), onOpen: fn() },
  argTypes: { added: { control: 'boolean' }, dj: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A DJ in Browse talent: a 52px photo or initials, the name with the tier, genres, the draw, the rate per set, and Add. Added turns the card purple and the pill into a filled Added. Rate and draw are shown exactly as the catalog sends them.',
          use: 'in Browse talent and in Other DJs open that night, stacked at full width.',
          avoid: 'for a DJ already on the lineup with an offer (use `AddedDjCard` before sending, `BookingCard` after) or on public surfaces (the public lineup has its own rows).',
          usage: `<DjCard dj={dj} added={isAdded(dj.id)} onToggle={() => toggle(dj)} onOpen={() => openProfile(dj)} />`,
          a11y: [
            'The whole card is one `button`: a double tap adds or removes; the spoken label carries name, tier, genres, draw and rate.',
            'VoiceOver’s actions offer “Open profile”; a tap on the card body opens it for everyone else.',
            'Add is a 44pt `PillButton`.',
          ],
          do: [
            'Show “Private rate” and “Draw not yet established” when the catalog sends nothing; never a guess.',
            'Credit the catalog under the list: “DJs, availability and rates from Gelatin”.',
          ],
          dont: ['Work out or round a rate.', 'Hide a private-rate DJ from a budget band.', 'Say why a DJ isn’t open.'],
        }),
      },
    },
  },
} satisfies Meta<typeof DjCard>;

export default meta;
type Story = StoryObj<typeof DjCard>;

const withDj = (status: string, doc: string, added = false): Story => ({
  render: (args) => (
    <Sample name={`dj-${status}`} load={djOf(status)}>
      {(dj) => <DjCard {...args} added={added || args.added} dj={dj} />}
    </Sample>
  ),
  parameters: storyDoc(doc),
});

export const PublishedRate = { ...withDj('authorization_required', 'A DJ with a photo, a published rate and an established draw.'), name: 'Published rate' };

export const Added = withDj('authorization_required', 'A DJ you’ve added to the lineup: purple card and a filled Added. Tap Added to remove.', true);

export const PrivateRate = { ...withDj('negotiating', 'A DJ who doesn’t publish a rate: “Private rate” in place of the price. You enter the fee yourself.'), name: 'Private rate' };

export const NoPhoto = { ...withDj('requested', 'A DJ with no photo in the catalog: initials on the purple tint.'), name: 'No photo' };

export const NoDrawYet = { ...withDj('reauthorization_required', 'A DJ new to the catalog: “Draw not yet established” in muted text.'), name: 'No draw yet' };

function Browse({ djs }: { djs: Dj[] }) {
  const [added, setAdded] = useState<string[]>([]);
  const toggle = (id: string) => setAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  return (
    <Stack>
      {djs.map((dj) => (
        <DjCard key={dj.id} dj={dj} added={added.includes(dj.id)} onToggle={() => toggle(dj.id)} onOpen={() => undefined} />
      ))}
      <Attribution />
    </Stack>
  );
}

export const AddSeveral: Story = {
  name: 'Add several',
  render: () => (
    <Sample
      name="djs"
      load={(repo) => Promise.all(['authorization_required', 'requested', 'negotiating'].map((s) => djOf(s)(repo)))}>
      {(djs) => <Browse djs={djs} />}
    </Sample>
  ),
  parameters: storyDoc('A working list: tap Add on any DJ to add them, and Added to take them off.'),
};
