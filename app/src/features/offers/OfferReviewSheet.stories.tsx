import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { getFakeControls } from '@/data/fakeRepository';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { draftOfferOf, eventOf, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { SEND_FAILED } from './copy';
import { OfferReviewSheet } from './OfferReviewSheet';

/** Late Service's unsent offer to its published-rate DJ, as the fake keeps it, under review. */
function Review({
  error = null,
  sending = false,
  withNote = false,
  noQuote = false,
}: {
  error?: string | null;
  sending?: boolean;
  withNote?: boolean;
  /** Cut the fake's connection once the offer is read, so the quote never arrives. */
  noQuote?: boolean;
}) {
  return (
    <Sample
      name={`offer-review-${withNote ? 'note' : 'plain'}`}
      load={async (repo) => {
        const event = await eventOf(repo, SAMPLE_EVENT.draftsNotSent);
        let offer = await draftOfferOf(repo, SAMPLE_EVENT.draftsNotSent);
        if (withNote) {
          // The organizer's note, saved the way the offer fields save it.
          const offers = await repo.updateDraftOffer(SAMPLE_EVENT.draftsNotSent, offer.dj.id, { note: 'Headline set, midnight to 2' });
          offer = offers.find((o) => o.dj.id === offer.dj.id) ?? offer;
        }
        if (noQuote) getFakeControls(repo)?.simulate({ offline: true });
        return { offer, context: [event.name, nightOf(event).day].join(' · ') };
      }}>
      {({ offer, context }) => (
        <>
          <ScreenBehind title="Lineup" />
          <OfferReviewSheet
            eventId={SAMPLE_EVENT.draftsNotSent}
            context={context}
            offer={offer}
            error={error}
            sending={sending}
            onConfirm={fn()}
            onEdit={fn()}
            onOffline={fn()}
          />
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/OfferReviewSheet',
  component: OfferReviewSheet,
  tags: ['autodocs'],
  render: () => <Review />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The offer review, one DJ at a time: the DJ’s photo and name, the event and night, then the fee, the Gelatin service fee and the total to hold, all from the server’s quote. Three numbered lines say what happens: the card is held, not charged; the DJ sees the offer after the hold; you’re charged only if they accept. Then the note, Edit, and Hold and send.',
          use: 'after Send offers on the Lineup, once per DJ, before the payment sheet opens.',
          avoid: 'to show a booking already sent (that is the Lineup card) or anywhere a member can see it. An offer is a fee and a note only.',
          usage: `<OfferReviewSheet
  eventId={eventId}
  context="Late Service · Sat, Nov 28"
  offer={offer}
  error={step.error}
  sending={flow.sending}
  onConfirm={flow.confirm}
  onEdit={flow.close}
  onOffline={flow.wentOffline}
/>`,
          a11y: [
            'The sheet is spoken as “Your offer to KOYO”; the title is a header.',
            'While the quote loads the summary is one busy element, “Getting your total”, and the button is disabled.',
            'Edit is spoken as “Edit offer” with a 44pt target.',
            'The total is in the money type with tabular numerals, beside the line “Held on your card”.',
          ],
          do: [
            'Show only the server’s figures: fee, service fee, total.',
            'Say held, not charged, before the button that holds.',
          ],
          dont: ['Add the numbers up on the phone.', 'Offer anything but a fee and a note.'],
        }),
      },
    },
  },
} satisfies Meta<typeof OfferReviewSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof OfferReviewSheet>;

export const Ready: Story = {
  render: () => <Review />,
  parameters: storyDoc('The quote is in: fee, service fee and the total to hold, with no note on the offer.'),
};

export const WithNote: Story = {
  name: 'With a note',
  render: () => <Review withNote />,
  parameters: storyDoc('The organizer wrote a note; it is quoted above Edit and goes with the offer.'),
};

export const WaitingForTotal: Story = {
  name: 'Waiting for the total',
  render: () => <Review />,
  parameters: {
    memberly: { pending: ['quoteOffer'] },
    ...storyDoc('Before the server’s quote arrives: skeleton lines in place of the figures, and a disabled “Getting your total” button.'),
  },
};

export const Sending: Story = {
  render: () => <Review sending />,
  parameters: storyDoc('Hold and send was pressed: the button shows it is working and can’t be pressed twice.'),
};

export const SendFailed: Story = {
  name: 'Send failed',
  render: () => <Review error={SEND_FAILED} />,
  parameters: storyDoc('The last send didn’t go through; nothing was held, and the button tries again.'),
};

export const QuoteFailed: Story = {
  name: 'Couldn’t get the total',
  render: () => <Review />,
  parameters: {
    memberly: { failing: ['quoteOffer'] },
    ...storyDoc('The server answered but couldn’t price the offer: an error notice in place of the figures, and Try again in place of Hold and send.'),
  },
};

export const Offline: Story = {
  render: () => <Review noQuote />,
  parameters: storyDoc('No connection while the total loads: the skeleton stays and the sheet calls `onOffline`, so the flow can keep the offer and say it will send when you’re back online.'),
};
