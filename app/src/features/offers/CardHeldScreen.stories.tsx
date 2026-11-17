import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import type { AnyBookingStatus } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { draftOfferOf, eventOf, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { CardHeldScreen } from './CardHeldScreen';

/** A Sunday Sessions booking in this status, over the Lineup; `next` names the next unsent offer from Late Service. */
function Held({ status, next = false }: { status: AnyBookingStatus; next?: boolean }) {
  return (
    <Sample
      name={`card-held-${status}-${next}`}
      load={async (repo) => ({
        booking: await bookingIn(repo, status),
        day: nightOf(await eventOf(repo, SAMPLE_EVENT.everyStatus)).day,
        nextDj: next ? (await draftOfferOf(repo, SAMPLE_EVENT.draftsNotSent, 'NIGHTFORM')).dj.name : undefined,
      })}>
      {({ booking, day, nextDj }) => (
        <>
          <ScreenBehind title="Lineup" />
          <CardHeldScreen booking={booking} day={day} nextDj={nextDj} onNext={fn()} onBack={fn()} onAddAnother={fn()} />
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/CardHeldScreen',
  component: CardHeldScreen,
  tags: ['autodocs'],
  render: () => <Held status="requested" />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Card held, offer sent: a full-screen layer the offer flow draws over the Lineup (not a route) once the server says the request has moved on from Payment needed. A tinted check, “Card held. KOYO has your offer.”, the hold line with the server’s total, the DJ row with Card held, then Back to your lineup and Add another DJ, or Next when more offers wait.',
          use: 'only from the offer flow (`OfferFlowHost`), right after a hold succeeds.',
          avoid: 'for a booking’s status later on: the Lineup card shows that. It never says “charged”.',
          usage: `<CardHeldScreen
  booking={booking}
  day="Sat, Nov 28"
  nextDj={queue[0]?.dj.name}
  onNext={flow.next}
  onBack={flow.close}
  onAddAnother={openBrowse}
/>`,
          a11y: [
            'The layer is a modal for VoiceOver; the title is a header and is read first.',
            'It fades in over 200ms; under Reduce Motion it appears at once.',
            'Both buttons are 52pt; the pill names the state in words.',
          ],
          do: ['Say the card is held, not charged, and charged only if the DJ accepts.', 'Lead with Next when more offers are waiting.'],
          dont: ['Show this before the server confirms the hold.', 'Use the success green: a hold is the tint, not Confirmed.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CardHeldScreen>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof CardHeldScreen>;

export const CardHeld: Story = {
  name: 'Card held',
  parameters: storyDoc('The hold went through and the DJ has the offer: Back to your lineup, or Add another DJ.'),
};

export const NextOfferWaiting: Story = {
  name: 'Next offer waiting',
  render: () => <Held status="requested" next />,
  parameters: storyDoc('Several offers are going out: Next leads to the review of the following DJ.'),
};
