import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { draftOfferOf, eventOf, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { DjTakenSheet } from './DjTakenSheet';

/** Late Service: its first added DJ came back taken when the offer was sent. */
function Taken() {
  return (
    <Sample
      name="dj-taken"
      load={async (repo) => ({
        dj: (await draftOfferOf(repo, SAMPLE_EVENT.draftsNotSent)).dj,
        day: nightOf(await eventOf(repo, SAMPLE_EVENT.draftsNotSent)).day,
      })}>
      {({ dj, day }) => (
        <>
          <ScreenBehind title="Lineup" />
          <DjTakenSheet eventId={SAMPLE_EVENT.draftsNotSent} dj={dj} day={day} onOffer={fn()} onSeeEveryone={fn()} onClose={fn()} />
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/DjTakenSheet',
  component: DjTakenSheet,
  tags: ['autodocs'],
  render: () => <Taken />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'DJ taken: the offer came back because the DJ isn’t available that night. Their photo greyed, “KOYO isn’t available that night”, the night, and “Nothing was sent and nothing was charged.” Below, up to three DJs still open that night, each with Offer, then See everyone open that night.',
          use: 'when sending an offer answers that the DJ is no longer open, in the offer flow on the Lineup.',
          avoid: 'for a booking that ended after it was sent (passed, expired, cancelled): use `AlternatesSheet`, which has a hold to explain.',
          usage: `<DjTakenSheet
  eventId={eventId}
  dj={step.dj}
  day="Sat, Nov 28"
  onOffer={flow.addAlternate}
  onSeeEveryone={openBrowse}
  onClose={flow.close}
/>`,
          a11y: [
            'The sheet is spoken as its title, “KOYO isn’t available that night”.',
            'Offer pills are 44pt round buttons; See everyone is the full-width primary button.',
            'The greyed photo is decoration; the title says what happened.',
          ],
          do: ['Say plainly that nothing was sent and nothing was charged.', 'Offer a way on: alternates, or everyone open that night.'],
          dont: ['Give, or guess at, a reason the DJ is taken.', 'Show the alternates’ draws or rates as anything but the catalog’s own.'],
        }),
      },
    },
  },
} satisfies Meta<typeof DjTakenSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof DjTakenSheet>;

export const WithAlternates: Story = {
  name: 'With alternates',
  parameters: storyDoc('The DJ was taken; three others open that night are offered, each with Offer.'),
};

export const CatalogUnavailable: Story = {
  name: 'No alternates to show',
  parameters: {
    memberly: { talentMode: 'unavailable' },
    ...storyDoc('Gelatin couldn’t list who else is open: only the line about nothing being sent, and See everyone.'),
  },
};
