import type { Booking } from '@/data/types';
import { statusUi } from '@/features/booking/status';

/**
 * Changing the date of an event that has bookings (GEL-1025, F11).
 *
 * CONTRACT GAP (GEL-1025; Backend requirements §9 A). Gelatin's Partner API
 * has no confirmed route to withdraw a booking request before the DJ accepts.
 * So the app does NOT withdraw offers, does not release holds and does not
 * change the date of an event while an offer for the current date is open,
 * and nothing here works around that. The organizer is sent to Gelatin to
 * deal with the offer first ("Manage in Gelatin"), then changes the date.
 *
 * When Gelatin confirms a withdraw route, the open-offers branch becomes the
 * DateChangeBefore board as designed: add the withdraw call to
 * MemberlyRepository, give the dialog its destructive "Change date" button,
 * and replace `openOffersCopy` below with the board's copy ("Changing it
 * cancels the request to KOYO, releases the hold on your card, and you offer
 * again for the new night."). This file is the only place that copy lives.
 */

/** Why the date cannot change from the app right now. */
export type DateChangeBlock =
  | {
      /** A DJ is confirmed for the current date. The date is not changed from the app. */
      kind: 'confirmed';
      confirmed: Booking[];
      /** Offers still open for the same date, mentioned beside the confirmed ones. */
      open: Booking[];
      /** The booking Manage in Gelatin opens. */
      manage: Booking;
    }
  | {
      /** Offers for the current date are still open. See the contract gap above. */
      kind: 'open';
      open: Booking[];
      /** An open booking with a hold, which Gelatin can show. Null while every open offer is still unpaid: no hold, no Gelatin link. */
      manage: Booking | null;
    };

const isOver = (b: Booking) => statusUi(b.status).action === 'other_djs';
/** Gelatin's portal opens for a booking only once a hold exists. */
const hasGelatinLink = (b: Booking) => {
  const { action } = statusUi(b.status);
  return action === 'manage_in_gelatin' || action === 'review_new_offer';
};

/**
 * What stands in the way of a new date, or null when it can simply be saved.
 * Bookings that passed, expired or were cancelled never block; DJs added but
 * not sent are not bookings. A status the app does not know counts as open.
 */
export function dateChangeBlock(bookings: Booking[]): DateChangeBlock | null {
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const open = bookings.filter((b) => b.status !== 'confirmed' && !isOver(b));
  if (confirmed.length > 0) return { kind: 'confirmed', confirmed, open, manage: confirmed[0] };
  if (open.length > 0) return { kind: 'open', open, manage: open.find(hasGelatinLink) ?? null };
  return null;
}

/** "KOYO", "KOYO and BLKMTN", "KOYO, BLKMTN and Sable Hart" */
function names(bookings: Booking[]): string {
  const list = bookings.map((b) => b.dj.name);
  return list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

export type DateChangeCopy = {
  /** The dialog's spoken name. */
  label: string;
  title: string;
  body: string[];
  /** The button that leaves the date as it is. */
  keep: string;
};

/** The DateChangeAfter board. `day` is the event's current date, "Fri, Nov 20". */
function confirmedCopy(block: Extract<DateChangeBlock, { kind: 'confirmed' }>, day: string): DateChangeCopy {
  const who = names(block.confirmed);
  const one = block.confirmed.length === 1;
  const body = [
    one
      ? `You’ve been charged and ${who} has agreed to this night. To move or cancel the booking, open it in Gelatin. You’ll see what happens to your payment before you confirm anything.`
      : 'You’ve been charged and they have agreed to this night. To move or cancel a booking, open it in Gelatin. You’ll see what happens to your payment before you confirm anything.',
  ];
  if (block.open.length > 0) {
    body.push(`Your open ${block.open.length === 1 ? 'offer' : 'offers'} to ${names(block.open)} ${block.open.length === 1 ? 'is' : 'are'} for this date too.`);
  }
  return {
    label: `${who} ${one ? 'is' : 'are'} confirmed for this date`,
    title: `${who} ${one ? 'is' : 'are'} confirmed for ${day}`,
    body,
    keep: 'Keep this date',
  };
}

/**
 * The DateChangeBefore layout with the hand-off in place of the board's
 * withdraw-and-release promise (see the contract gap above). `day` is the
 * current date, `newDay` the one just picked.
 */
function openOffersCopy(block: Extract<DateChangeBlock, { kind: 'open' }>, day: string, newDay: string): DateChangeCopy {
  const one = block.open.length === 1;
  const offers = `Your ${one ? 'offer' : 'offers'} to ${names(block.open)} ${one ? 'is' : 'are'} for ${day}`;
  return {
    label: 'Change the date?',
    title: newDay ? `Change the date to ${newDay}?` : 'Change the date?',
    body: [
      `The date is part of the offer. ${offers}, and an open offer can’t be withdrawn from Memberly.`,
      block.manage
        ? `Manage ${one ? 'it' : 'them'} in Gelatin first, then change the date here.`
        : `The date stays ${day} while ${one ? 'it is' : 'they are'} open.`,
    ],
    keep: `Keep ${day}`,
  };
}

export function dateChangeCopy(block: DateChangeBlock, day: string, newDay: string): DateChangeCopy {
  return block.kind === 'confirmed' ? confirmedCopy(block, day) : openOffersCopy(block, day, newDay);
}

export const MANAGE_IN_GELATIN = 'Manage in Gelatin';

/**
 * DJs added but not sent do not hold the date: it changes, and the organizer
 * is told the DJs are checked again for the new night when the offers go out.
 */
export function recheckNotice(addedCount: number, newDay: string): string {
  const djs = addedCount === 1 ? 'The DJ you added hasn’t' : `The ${addedCount} DJs you added haven’t`;
  return `${djs} been sent an offer yet. They’ll be re-checked for ${newDay} when you send.`;
}
