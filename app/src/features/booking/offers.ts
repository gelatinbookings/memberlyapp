import type { DraftOffer } from '@/data/types';

/**
 * Your offer is whole dollars. The field keeps digits only; the amount travels
 * as integer cents. The app never adds the service fee: the server returns the
 * total once the offer is created.
 */
export function sanitizeDollars(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 6);
}

/** "450" → 45000; "" or "0" → null (no fee yet). */
export function dollarsToCents(input: string): number | null {
  const digits = sanitizeDollars(input);
  if (!digits) return null;
  const dollars = Number(digits);
  return dollars > 0 ? dollars * 100 : null;
}

/** 45000 → "450" for the field; null → "". */
export function centsToDollarsField(cents: number | null): string {
  return cents == null ? '' : String(Math.floor(cents / 100));
}

export function feeMissing(offer: Pick<DraftOffer, 'offerCents'>): boolean {
  return offer.offerCents == null || offer.offerCents <= 0;
}

export const FEE_MISSING_MESSAGE = 'Enter a fee to send this offer.';

/** Send is enabled only when there is at least one offer and every DJ has a fee. */
export function canSendOffers(offers: Pick<DraftOffer, 'offerCents'>[]): boolean {
  return offers.length > 0 && offers.every((o) => !feeMissing(o));
}

/** "Send 2 offers", "Send 1 offer" */
export function sendOffersLabel(count: number): string {
  return `Send ${count} offer${count === 1 ? '' : 's'}`;
}
