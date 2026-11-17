import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import type { AnyBookingStatus } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { ContinueInGelatinSheet } from './ContinueInGelatinSheet';
import type { HandoffProblem } from './useGelatinHandoff';

/** A Sunday Sessions booking in this status, about to be opened in Gelatin. */
function Handoff({ status, opening = false, problem = null }: { status: AnyBookingStatus; opening?: boolean; problem?: HandoffProblem }) {
  return (
    <Sample
      name={`handoff-${status}`}
      load={async (repo) => ({ booking: await bookingIn(repo, status), eventName: (await eventOf(repo, SAMPLE_EVENT.everyStatus)).name })}>
      {({ booking, eventName }) => (
        <>
          <ScreenBehind title="Lineup" />
          <ContinueInGelatinSheet booking={booking} eventName={eventName} opening={opening} problem={problem} onOpen={fn()} onClose={fn()} />
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/ContinueInGelatinSheet',
  component: ContinueInGelatinSheet,
  tags: ['autodocs'],
  render: () => <Handoff status="requested" />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Continue in Gelatin: before the organizer leaves Memberly, the sheet says where they’re going and how they get back. The Memberly mark, an arrow, the Gelatin mark; “Continue in Gelatin” and what happens there; the booking with the server’s figure and status; then Open in Gelatin, and a note that the link lasts 60 seconds.',
          use: 'from Manage in Gelatin, or Review the new offer in Gelatin, on a Lineup card or the date-change dialog.',
          avoid: 'for a booking with no hold yet (Payment needed opens the payment sheet), or for anything a member sees.',
          usage: `<ContinueInGelatinSheet
  booking={handoff.booking}
  eventName="Sunday Sessions"
  opening={handoff.opening}
  problem={handoff.problem}
  onOpen={handoff.launch}
  onClose={handoff.close}
/>`,
          a11y: [
            'The sheet is spoken as “Continue in Gelatin”; the two marks are hidden from VoiceOver.',
            'Open in Gelatin carries a trailing arrow because it leaves the app; it shows it is busy while the link is fetched.',
            'A problem appears as an error notice above the button and is read in order.',
          ],
          do: [
            'Ask Gelatin for the launch link only when Open in Gelatin is tapped, never when the sheet opens.',
            'Say how the organizer comes back.',
          ],
          dont: ['Open Gelatin without this sheet first.', 'Show the launch link or any token on screen.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ContinueInGelatinSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof ContinueInGelatinSheet>;

export const CardHeld: Story = {
  name: 'Card held',
  parameters: storyDoc('Manage in Gelatin on a booking whose card is held, waiting for the DJ.'),
};

export const Confirmed: Story = {
  render: () => <Handoff status="confirmed" />,
  parameters: storyDoc('Manage in Gelatin on a confirmed booking: the line says what was charged.'),
};

export const Opening: Story = {
  render: () => <Handoff status="requested" opening />,
  parameters: storyDoc('Open in Gelatin was tapped and the one-time link is being fetched.'),
};

export const LinkExpired: Story = {
  name: 'Link expired',
  render: () => <Handoff status="requested" problem="expired" />,
  parameters: storyDoc('The 60-second link ran out before it opened: tap again for a new one.'),
};

export const CouldNotOpen: Story = {
  name: 'Couldn’t open',
  render: () => <Handoff status="requested" problem="failed" />,
  parameters: storyDoc('Gelatin couldn’t be opened, usually no connection: check it and try again.'),
};
