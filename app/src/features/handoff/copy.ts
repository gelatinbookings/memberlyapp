import type { Booking } from '@/data/types';
import { formatCents } from '@/features/booking/money';
import { statusUi } from '@/features/booking/status';

/** Copy for the hand-off to Gelatin and the way back. From the Portal and PortalReturn boards. */

export const CONTINUE_TITLE = 'Continue in Gelatin';

export function continueBody(dj: string): string {
  return `Your booking with ${dj} opens in Gelatin, styled for Memberly. Counters, new prices, date changes and refunds happen there. When you’re done, you come straight back here.`;
}

export const OPEN_IN_GELATIN = 'Open in Gelatin';
export const OPEN_NOTE = 'Opens in a secure browser sheet. The link works for 60 seconds; tap again if it expires.';

/** Shown only once the lineup has been read again after the return. */
export const BACK_FROM_GELATIN = 'Back from Gelatin. Your lineup is up to date.';

export const LINK_EXPIRED = 'That link expired. Tap again to open Gelatin.';
export const OPEN_FAILED = 'We couldn’t open Gelatin. Check your connection and try again.';

/** "$397.00 held · waiting for the DJ": where the booking stands, under its name on the sheet. The server's total, as sent. */
export function handoffSummary(b: Pick<Booking, 'status' | 'totalCents'>): string {
  if (b.status === 'requested') return `${formatCents(b.totalCents)} held · waiting for the DJ`;
  if (b.status === 'confirmed') return `${formatCents(b.totalCents)} charged · confirmed`;
  return statusUi(b.status).label;
}
