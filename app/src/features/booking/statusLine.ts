import type { Booking } from '@/data/types';

import { formatCents, formatRate } from './money';

/** One run of text; `strong` runs are amounts shown in the foreground colour. */
export type LinePart = { text: string; strong?: boolean };

/**
 * The one money line under a booking's status pill (F8 status table).
 * Amounts are the server's `totalCents`, formatted, never computed.
 */
export function statusLine(b: Pick<Booking, 'status' | 'totalCents' | 'newOfferCents'> & { dj: { name: string } }): LinePart[] {
  const dj = b.dj.name;
  const total = formatCents(b.totalCents);
  switch (b.status) {
    case 'authorization_required':
      return [{ text: `${dj} won’t see this request until your card is held for ` }, { text: total, strong: true }, { text: '.' }];
    case 'requested':
      return [{ text: total, strong: true }, { text: ` held on your card, not charged. You’re charged only if ${dj} accepts.` }];
    case 'negotiating':
      return [{ text: `You and ${dj} are working out the fee in Gelatin.` }];
    case 'reauthorization_required':
      return [
        {
          text:
            b.newOfferCents != null
              ? `${dj} came back at ${formatRate(b.newOfferCents)}. Your ${total} hold was released. A new price means a new hold.`
              : `${dj} came back with a new price. Your ${total} hold was released. A new price means a new hold.`,
        },
      ];
    case 'confirmed':
      return [{ text: total, strong: true }, { text: ` charged. ${dj} is on your public lineup.` }];
    case 'declined':
      return [{ text: `${dj} passed on this one. Your hold was released and you were not charged.` }];
    case 'expired':
      return [{ text: `${dj} didn’t answer in time. Your hold was released and you were not charged.` }];
    case 'cancelled':
      return [{ text: 'This booking was cancelled.' }];
    default:
      return [];
  }
}

/**
 * After Create & publish: one row per booking still open (F12). Requested and
 * negotiating DJs are still deciding; unpaid ones were never sent.
 */
export type OpenBookingRow = { requestId: string; title: string; detail: string; warning: boolean };

export function openBookingRows(bookings: Pick<Booking, 'requestId' | 'status' | 'dj'>[]): OpenBookingRow[] {
  return bookings.flatMap((b): OpenBookingRow[] => {
    const dj = b.dj.name;
    if (b.status === 'requested' || b.status === 'negotiating') {
      return [
        {
          requestId: b.requestId,
          title: `${dj} is still deciding`,
          detail: 'They join your public lineup once they accept. Your card stays held until then.',
          warning: false,
        },
      ];
    }
    if (b.status === 'authorization_required') {
      return [
        {
          requestId: b.requestId,
          title: `${dj} not sent yet`,
          detail: 'They won’t see your request until you pay.',
          warning: true,
        },
      ];
    }
    return [];
  });
}

/** The first DJ who still needs paying, for the published screen's Pay now. */
export function firstUnpaid<T extends Pick<Booking, 'status'>>(bookings: T[]): T | undefined {
  return bookings.find((b) => b.status === 'authorization_required');
}

/**
 * Save as draft while a hold is running: the DJ already has the request and
 * saving doesn't pause it. Null when no hold is running.
 */
export function draftHoldNotice(bookings: Pick<Booking, 'status' | 'dj'>[]): string | null {
  const holding = bookings.filter((b) => b.status === 'requested' || b.status === 'negotiating');
  if (holding.length === 0) return null;
  const names = holding.map((b) => b.dj.name);
  const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const has = names.length === 1 ? 'already has your request' : 'already have your requests';
  return `${who} ${has}. Saving a draft doesn’t pause it, and your card stays held until they answer.`;
}
