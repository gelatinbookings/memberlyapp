import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { UNKNOWN_STATUS_SAMPLE } from '@/data/fakeRepository';
import { statusUi, type BookingStatus } from '@/features/booking/status';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { BookingCard } from './BookingCard';

const meta = {
  title: 'Molecules/BookingCard',
  component: BookingCard,
  tags: ['autodocs'],
  args: { onPay: fn(), onManage: fn(), onAlternates: fn(), paying: false, paymentFailed: false },
  argTypes: { paying: { control: 'boolean' }, paymentFailed: { control: 'boolean' }, booking: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A booking in motion on the Lineup: the DJ, the offer and set time, a live status pill, one line about the money, and one action. Pay now holds the card; everything after the first payment is a hand-off to Gelatin; a booking that’s over offers other DJs open that night.',
          use: 'on the Lineup, one per booking, after an offer is created.',
          avoid: 'before an offer exists (use `AddedDjCard`) or on any public surface: members never see bookings, fees or offer history.',
          usage: `<BookingCard booking={booking} onPay={() => pay(booking)} onManage={() => openGelatin(booking)} onAlternates={() => showAlternates(booking)} />`,
          a11y: [
            'The status pill announces a change after a poll: “KOYO: Confirmed”.',
            'Pay now and Review the new offer in Gelatin are 52pt `Button`s; Manage in Gelatin is a 44pt `link`; Other DJs open that night is a 44pt pill.',
            'A DJ whose booking is over is shown with a muted avatar.',
          ],
          do: [
            'Show amounts exactly as the server sent them, beside held, charged or released.',
            'Use the fixed status labels and actions; the card picks them from the status.',
            'Hand off to Gelatin for anything after the first payment, with the 18px arrow that says you’re leaving.',
          ],
          dont: [
            'Show a reason when a DJ passes or isn’t available.',
            'Build a screen of the app’s own for anything Gelatin handles.',
            'Compute a total or a difference between amounts.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof BookingCard>;

export default meta;
type Story = StoryObj<typeof BookingCard>;

const inStatus = (status: BookingStatus, doc: string, extra: Partial<Parameters<typeof BookingCard>[0]> = {}): Story => ({
  name: statusUi(status).label,
  render: (args) => (
    <Sample name={`booking-${status}`} load={(repo) => bookingIn(repo, status)}>
      {(booking) => <BookingCard {...args} {...extra} booking={booking} />}
    </Sample>
  ),
  parameters: storyDoc(doc),
});

export const PaymentNeeded = inStatus(
  'authorization_required',
  'The offer exists but the card isn’t held: the DJ hasn’t seen it. Pay now holds the card.',
);
export const CardHeld = inStatus('requested', 'The card is held and the DJ is deciding. The line says what’s held and when you’d be charged.');
export const Negotiating = inStatus('negotiating', 'You and the DJ are working out the fee in Gelatin. Manage in Gelatin opens it.');
export const NewOffer = inStatus(
  'reauthorization_required',
  'The DJ came back with a new price: amber edge, the old hold released, and Review the new offer in Gelatin.',
);
export const Confirmed = inStatus('confirmed', 'The DJ accepted: the total was charged and they’re on the public lineup.');
export const Passed = inStatus('declined', 'The DJ passed: the hold was released. Other DJs open that night offers someone else.');
export const Expired = inStatus('expired', 'The DJ didn’t answer in time: the hold was released. Other DJs open that night.');
export const Cancelled = inStatus('cancelled', 'The booking was cancelled. Other DJs open that night.');

export const Paying = {
  ...inStatus('authorization_required', 'Pay now was tapped and the payment sheet is working: the button shows it’s busy.', { paying: true }),
  name: 'Paying',
};

export const PaymentFailed = {
  ...inStatus(
    'authorization_required',
    'The card was refused: the card says nothing was held or sent, and offers Try again.',
    { paymentFailed: true },
  ),
  name: 'Payment failed',
};

export const CheckingStatus: Story = {
  name: 'Checking status',
  render: (args) => (
    <Sample name="booking-unknown" load={async (repo) => ({ ...(await bookingIn(repo, 'requested')), status: UNKNOWN_STATUS_SAMPLE })}>
      {(booking) => <BookingCard {...args} booking={booking} />}
    </Sample>
  ),
  parameters: storyDoc('A status this build doesn’t know yet: “Checking status”, no money line and no action.'),
};
