import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { UNKNOWN_STATUS_SAMPLE } from '@/data/fakeRepository';
import { BOOKING_STATUSES, statusUi, type BookingStatus } from '@/features/booking/status';
import { Stack } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { StatusPill } from './StatusPill';

const meta = {
  title: 'Atoms/StatusPill',
  component: StatusPill,
  tags: ['autodocs'],
  args: { status: 'requested' },
  argTypes: {
    status: { control: 'select', options: [...BOOKING_STATUSES, UNKNOWN_STATUS_SAMPLE] },
    style: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A booking’s status as the organizer reads it. You pass the status Gelatin sends; the label and colour come from the fixed mapping in `features/booking/status.ts`.',
          use: 'wherever a booking shows its state: a booking card on the Lineup, a DJ in the event summary, the parts kit.',
          avoid: 'for a state that isn’t a booking (use `Pill`). On the Lineup use `LiveStatusPill`, which fades and announces a change after a poll.',
          usage: `<StatusPill status={booking.status} />`,
          a11y: [
            'Read as its label, such as “Card held · waiting for the DJ”. Not a control.',
            'A status the app doesn’t know reads “Checking status” in grey, never a raw code.',
            'Label type scales with Dynamic Type up to 1.4×.',
          ],
          do: [
            'Pass the status exactly as the server sent it.',
            'Write the label nowhere else: change it only in the status mapping, with product sign-off.',
          ],
          dont: [
            'Type a label or pick a colour by hand.',
            'Show a status pill on a public surface: the public lineup shows confirmed DJs only.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

const WHEN: Record<BookingStatus, string> = {
  authorization_required: 'The offer is made but the card isn’t held yet; the DJ hasn’t seen it.',
  requested: 'The card is held and the DJ is deciding.',
  negotiating: 'You and the DJ are working out the fee in Gelatin.',
  reauthorization_required: 'The DJ came back with a new price; you review it in Gelatin.',
  confirmed: 'The DJ accepted and the card was charged.',
  declined: 'The DJ passed; the hold was released.',
  expired: 'The DJ didn’t answer in time; the hold was released.',
  cancelled: 'The booking was cancelled.',
};

const one = (status: BookingStatus): Story => ({
  name: statusUi(status).label,
  args: { status },
  parameters: storyDoc(WHEN[status]),
});

export const PaymentNeeded = one('authorization_required');
export const CardHeld = one('requested');
export const Negotiating = one('negotiating');
export const NewOffer = one('reauthorization_required');
export const Confirmed = one('confirmed');
export const Passed = one('declined');
export const Expired = one('expired');
export const Cancelled = one('cancelled');

export const CheckingStatus: Story = {
  name: 'Checking status',
  args: { status: UNKNOWN_STATUS_SAMPLE },
  parameters: storyDoc('A status this build doesn’t know yet: grey, “Checking status”, and no action.'),
};

export const EveryStatus: Story = {
  name: 'Every status',
  render: () => (
    <Stack gap={8}>
      {BOOKING_STATUSES.map((s) => (
        <StatusPill key={s} status={s} />
      ))}
    </Stack>
  ),
  parameters: storyDoc('All eight, top to bottom, in the order a booking can move through them.'),
};
