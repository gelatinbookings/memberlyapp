import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { PaymentFailedSheet } from './PaymentFailedSheet';

/** The Payment needed booking on Sunday Sessions, after its payment didn't go through. */
function Failed({ retrying = false }: { retrying?: boolean }) {
  return (
    <Sample name="payment-failed" load={(repo) => bookingIn(repo, 'authorization_required')}>
      {(booking) => (
        <>
          <ScreenBehind title="Lineup" />
          <PaymentFailedSheet booking={booking} retrying={retrying} onRetry={fn()} onClose={fn()} />
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/PaymentFailedSheet',
  component: PaymentFailedSheet,
  tags: ['autodocs'],
  render: () => <Failed />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: '“Payment didn’t go through”: after the payment sheet has shown the provider’s own message, this says what it means for the offer. The card wasn’t held and the DJ hasn’t been sent anything. The booking row keeps its Payment needed pill and the server’s offer and total; Try again opens a fresh payment, Not now closes.',
          use: 'when the hold for an offer is declined or its payment session has expired, in the offer flow or from Pay now on the Lineup.',
          avoid: 'for a DJ who turned out to be taken (`DjTakenSheet`) or for a failure before payment started, which is a notice on the Lineup.',
          usage: `<PaymentFailedSheet booking={booking} retrying={flow.paying} onRetry={() => flow.pay(booking)} onClose={flow.close} />`,
          a11y: [
            'The sheet is spoken as “Payment didn’t go through”; the title is a header.',
            'Try again shows it is busy while a new payment starts; Not now is a 44pt text button.',
            'The card icon is decoration in the warning tint.',
          ],
          do: ['Say the card wasn’t held and nothing was sent.', 'Show the server’s offer and total, as sent.'],
          dont: ['Repeat the provider’s decline message here; the payment sheet already showed it.', 'Ask for card details: the payment sheet does that.'],
        }),
      },
    },
  },
} satisfies Meta<typeof PaymentFailedSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof PaymentFailedSheet>;

export const Default: Story = {
  parameters: storyDoc('The hold was declined: nothing held, nothing sent, Try again or Not now.'),
};

export const Retrying: Story = {
  render: () => <Failed retrying />,
  parameters: storyDoc('Try again was pressed and a fresh payment is starting.'),
};
