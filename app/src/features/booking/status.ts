/**
 * Gelatin booking status → what the organizer reads.
 * Labels and actions are fixed by the agreed flow (GEL-844); change them only
 * with product sign-off.
 */
export const BOOKING_STATUSES = [
  'authorization_required',
  'requested',
  'negotiating',
  'reauthorization_required',
  'confirmed',
  'declined',
  'expired',
  'cancelled',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Pill colour. `held` is the purple tint; `neutral` is grey. */
export type StatusTone = 'warning' | 'held' | 'success' | 'neutral';

export type StatusAction =
  | 'pay_now'
  | 'manage_in_gelatin'
  | 'review_new_offer'
  | 'other_djs';

export type StatusUi = {
  label: string;
  tone: StatusTone;
  action: StatusAction | null;
  actionLabel: string | null;
};

const MAP: Record<BookingStatus, StatusUi> = {
  authorization_required: {
    label: 'Payment needed',
    tone: 'warning',
    action: 'pay_now',
    actionLabel: 'Pay now',
  },
  requested: {
    label: 'Card held · waiting for the DJ',
    tone: 'held',
    action: 'manage_in_gelatin',
    actionLabel: 'Manage in Gelatin',
  },
  negotiating: {
    label: 'Negotiating',
    tone: 'held',
    action: 'manage_in_gelatin',
    actionLabel: 'Manage in Gelatin',
  },
  reauthorization_required: {
    label: 'New offer from the DJ',
    tone: 'warning',
    action: 'review_new_offer',
    actionLabel: 'Review the new offer in Gelatin',
  },
  confirmed: {
    label: 'Confirmed',
    tone: 'success',
    action: 'manage_in_gelatin',
    actionLabel: 'Manage in Gelatin',
  },
  declined: {
    label: 'Passed',
    tone: 'neutral',
    action: 'other_djs',
    actionLabel: 'Other DJs open that night',
  },
  expired: {
    label: 'Expired',
    tone: 'neutral',
    action: 'other_djs',
    actionLabel: 'Other DJs open that night',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'neutral',
    action: 'other_djs',
    actionLabel: 'Other DJs open that night',
  },
};

/** A status the app does not know yet shows as neutral with no action. */
const UNKNOWN: StatusUi = {
  label: 'Checking status',
  tone: 'neutral',
  action: null,
  actionLabel: null,
};

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

export function statusUi(status: string): StatusUi {
  return isBookingStatus(status) ? MAP[status] : UNKNOWN;
}

/** Poll every 5 seconds only while the DJ is deciding. */
export const POLL_INTERVAL_MS = 5000;

export function shouldPoll(status: string): boolean {
  return status === 'requested' || status === 'negotiating';
}
