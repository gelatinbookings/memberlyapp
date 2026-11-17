import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import type { Dj } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, findDj, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { DjProfileSheet } from './DjProfileSheet';

/** The event Browse talent is open for in these stories. */
const EVENT = SAMPLE_EVENT.empty;

/** A DJ open on Long Table's night, read from the fake catalog, in the profile sheet. */
function Profile({ name, added = false, interactive = false }: { name: string; added?: boolean; interactive?: boolean }) {
  return (
    <Sample
      name={`profile-${name}`}
      load={async (repo) => ({ dj: await findDj(repo, EVENT, name), day: nightOf(await eventOf(repo, EVENT)).day })}>
      {({ dj, day }) =>
        interactive ? (
          <Toggling dj={dj} day={day} />
        ) : (
          <>
            <ScreenBehind title="Browse talent" />
            <DjProfileSheet dj={dj} day={day} added={added} onAdd={fn()} onRemove={fn()} onClose={fn()} />
          </>
        )
      }
    </Sample>
  );
}

function Toggling({ dj, day }: { dj: Dj; day: string }) {
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(true);
  return (
    <>
      <ScreenBehind title="Browse talent" />
      <DjProfileSheet
        dj={open ? dj : null}
        day={day}
        added={added}
        onAdd={() => {
          // Add to lineup adds and closes, as on Browse talent.
          setAdded(true);
          setOpen(false);
          setTimeout(() => setOpen(true), 600);
        }}
        onRemove={() => setAdded(false)}
        onClose={() => {
          setOpen(false);
          setTimeout(() => setOpen(true), 600);
        }}
      />
    </>
  );
}

const meta = {
  title: 'Organisms/DjProfileSheet',
  component: DjProfileSheet,
  tags: ['autodocs'],
  render: () => <Profile name="KOYO" />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'A DJ’s profile in a tall sheet: the large photo (or initials when there is none) with Close and “Open Fri, Nov 20” over it, then the name, genres and tier, two stat cards (published rate or Private rate; draw over the last 90 days or Draw not yet established), a short bio when the catalog has one, and Add to lineup. Once added, the button reads Added and removes.',
          use: 'from a DJ card on Browse talent. Every DJ it shows is open on the event’s night in the event’s city.',
          avoid: 'on public surfaces, or for anything the catalog doesn’t send: no contact details, booking history or reviews. While the catalog loads or fails, Browse talent shows its own states (see BrowseStates); the sheet itself only opens on a DJ it has.',
          usage: `<DjProfileSheet
  dj={profileDj}
  day="Fri, Nov 20"
  added={addedIds.has(profileDj?.id)}
  onAdd={add}
  onRemove={remove}
  onClose={() => setProfileDj(null)}
/>`,
          a11y: [
            'The name is a header. Each stat card is one element with a spoken summary, “Published rate”, the rate in words, then “You can offer any fee”.',
            'Close profile is a 44pt round button on the photo’s scrim; the photo is the part to pull down to close.',
            'Added carries a hint, “Removes KOYO from your lineup”.',
            'Under Reduce Motion the sheet doesn’t follow the finger; it closes on release.',
          ],
          do: [
            'Show “Private rate” and “Draw not yet established” plainly when the catalog has none.',
            'Keep the attribution under the button.',
          ],
          dont: ['Invent a rate, draw or bio the catalog didn’t send.', 'Put a shadow under the sheet or a gradient over the photo.'],
        }),
      },
    },
  },
} satisfies Meta<typeof DjProfileSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof DjProfileSheet>;

export const PublishedRate: Story = {
  name: 'Published rate',
  render: () => <Profile name="KOYO" />,
  parameters: storyDoc('A DJ with a photo, a published rate, a venue-confirmed draw and a bio.'),
};

export const PrivateRate: Story = {
  name: 'Private rate',
  render: () => <Profile name="NIGHTFORM" />,
  parameters: storyDoc('No published rate: “Private rate”, and a line saying the organizer makes an offer.'),
};

export const ThinProfile: Story = {
  name: 'Thin profile',
  render: () => <Profile name="Priya Nox" />,
  parameters: storyDoc('No photo, no rate, no draw and no bio: initials, Private rate and Draw not yet established.'),
};

export const Added: Story = {
  render: () => <Profile name="KOYO" added />,
  parameters: storyDoc('The DJ is already in the lineup: the button reads Added and removes them.'),
};

export const Interactive: Story = {
  render: () => <Profile name="Sable Hart" interactive />,
  parameters: storyDoc('Add to lineup adds and closes; open again and Added removes.'),
};
