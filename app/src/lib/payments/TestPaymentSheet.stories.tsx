import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn, screen, userEvent } from 'storybook/test';

import { getFakeControls } from '@/data/fakeRepository';
import type { MemberlyRepository } from '@/data/repository';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { TestPaymentSheet } from './TestPaymentSheet';
import type { PaymentSheetSession } from './types';

/** A hold for the Payment needed booking on Sunday Sessions: the session exactly as the fake server makes it. */
async function holdSession(repo: MemberlyRepository): Promise<PaymentSheetSession> {
  const booking = await bookingIn(repo, 'authorization_required');
  const event = await eventOf(repo, SAMPLE_EVENT.everyStatus);
  const session = await repo.createPaymentSession(booking.requestId);
  return { ...session, purpose: { kind: 'hold', djName: booking.dj.name, eventName: event.name } };
}

/** A paid pass for Long Table: the order's session as the fake server makes it, at the price it lists. */
async function passSession(repo: MemberlyRepository): Promise<PaymentSheetSession> {
  const eventId = 'e_long_table';
  const [type] = await repo.getPassTypes(eventId);
  const event = await repo.getEvent(eventId);
  const order = await repo.createPassOrder(eventId, { passTypeId: type.id, quantity: 1, idempotencyKey: 'story-pass', expectedPriceCents: type.priceCents });
  if (!order.payment) throw new Error('The sample pass needs no payment');
  return { ...order.payment, purpose: { kind: 'pass', passName: type.name, eventName: event?.name ?? '' } };
}

function Payment({ kind, load }: { kind: string; load: (repo: MemberlyRepository) => Promise<PaymentSheetSession> }) {
  return (
    <Sample name={`payment-${kind}`} load={async (repo) => ({ session: await load(repo), fake: getFakeControls(repo) })}>
      {({ session, fake }) => (
        <>
          <ScreenBehind title="Lineup" />
          {fake ? <TestPaymentSheet session={session} fake={fake} onResult={fn()} /> : null}
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/TestPaymentSheet',
  component: TestPaymentSheet,
  tags: ['autodocs'],
  render: () => <Payment kind="hold" load={holdSession} />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'What stands where the native payment sheet will, on the sample repository only: a Test payment pill, what is being paid for, the server’s total in the money type with the line saying what happens to it, then Pay with test wallet and Use a declined test card. There are no card fields and never will be; the app does not collect payment details.',
          use: 'automatically: `PaymentsProvider` presents it for card holds and paid passes while the app runs on the fake repository.',
          avoid: 'with a real backend, where the platform payment sheet takes its place. Never render it directly in a screen.',
          usage: `// Inside PaymentsProvider, on the fake repository only
const result = await payments.presentPaymentSheet({ ...session, purpose: { kind: 'hold', djName, eventName } });`,
          a11y: [
            'The sheet is spoken as “Test payment”; Close is a 36pt round button with a 44pt hit area.',
            'Both buttons show they are busy while the fake answers; the other is disabled.',
            'A decline appears as an error notice with the provider’s own words.',
          ],
          do: ['Show only the server’s total, and say held or paid beside it.', 'Mark it plainly as a test.'],
          dont: ['Add card fields.', 'Ship it with a real repository.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TestPaymentSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof TestPaymentSheet>;

export const CardHold: Story = {
  name: 'Card hold',
  parameters: storyDoc('Holding the card for an offer: held now, charged only if the DJ accepts. Try the declined card to see the error.'),
};

export const PassPayment: Story = {
  name: 'Pass payment',
  render: () => <Payment kind="pass" load={passSession} />,
  parameters: storyDoc('Paying for a pass: paid now, and the pass goes on the Memberly Card.'),
};

export const Declined: Story = {
  name: 'Declined card',
  render: () => <Payment kind="hold" load={holdSession} />,
  play: async () => {
    await userEvent.click(await screen.findByText('Use a declined test card'));
  },
  parameters: storyDoc('The declined test card was used: an error notice gives the payment provider’s message, and nothing is held. Closing the sheet reports the decline to the flow.'),
};
