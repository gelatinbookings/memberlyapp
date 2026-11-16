import type { Booking } from '@/data/types';
import { formatCents, formatRate } from '@/features/booking/money';

/** Copy for sending offers and holding the card. From the Offer, Card held, DJ taken and payment boards. */

export const OFFLINE_OFFERS_NOTICE = 'You’re offline. Your offers are saved and will send when you’re back.';
export const SEND_FAILED = 'That didn’t go through. Nothing was held. Try again.';
export const QUOTE_FAILED = 'We couldn’t get the total for this offer. Try again.';
export const CONFIRMING_HOLD = 'We’re confirming your hold. Your lineup will update in a moment.';
export const PAYMENT_UNAVAILABLE = 'We couldn’t start the payment. Check your connection and try again.';
export const SECURE_LINE = 'Secure checkout by Gelatin. Memberly never sees your card.';

/** "Hold $457.00 and send": the server's total, formatted. */
export function holdAndSendLabel(totalCents: number): string {
  return `Hold ${formatCents(totalCents)} and send`;
}

/** The three numbered lines on the review sheet. */
export function reviewLines(dj: string, totalCents: number): string[] {
  return [
    'Your card is held, not charged.',
    `${dj} sees the offer only after the hold succeeds.`,
    `You’re charged ${formatCents(totalCents)} only if ${dj} accepts. If they pass or don’t answer in time, the hold is released.`,
  ];
}

export function heldTitle(dj: string): string {
  return `Card held. ${dj} has your offer.`;
}

export function heldBody(dj: string, totalCents: number): string {
  return `${formatCents(totalCents)} is held on your card, not charged. You’re charged only if ${dj} accepts. Their answer shows on your lineup.`;
}

export function heldFootnote(dj: string): string {
  return `You can publish the event now. ${dj} joins the public lineup once they accept.`;
}

/** DJ taken. The app never says, or guesses, why. */
export function takenTitle(dj: string): string {
  return `${dj} isn’t available that night`;
}
export const TAKEN_BODY = 'Nothing was sent and nothing was charged.';
export function takenAlternatesLine(day: string): string {
  return `These DJs are still open on ${day}.`;
}
export const SEE_EVERYONE = 'See everyone open that night';

export const PAYMENT_FAILED_TITLE = 'Payment didn’t go through';
export function paymentFailedBody(dj: string): string {
  return `Your card wasn’t held and ${dj} hasn’t been sent anything.`;
}

/** "Offer $450 · total $457.00": both figures as the server sent them. */
export function offerAndTotal(b: Pick<Booking, 'offerCents' | 'totalCents'>): string {
  return `Offer ${formatRate(b.offerCents)} · total ${formatCents(b.totalCents)}`;
}
