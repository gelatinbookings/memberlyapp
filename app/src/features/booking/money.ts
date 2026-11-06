/**
 * Money display. The app formats amounts the server sends; it never adds,
 * multiplies or derives a total. Amounts arrive as integer cents.
 */
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function assertCents(cents: number): void {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`Amount must be whole cents, got ${cents}`);
  }
}

/** A charge, hold or total: always two decimals. 45700 → "$457.00". */
export function formatCents(cents: number): string {
  assertCents(cents);
  return usd.format(cents / 100);
}

/**
 * A DJ's rate on a card or chip: whole dollars when the rate is whole,
 * "Private rate" when Gelatin sends no published rate.
 */
export function formatRate(publishedRateCents: number | null | undefined): string {
  if (publishedRateCents == null) return 'Private rate';
  assertCents(publishedRateCents);
  return publishedRateCents % 100 === 0
    ? usdWhole.format(publishedRateCents / 100)
    : usd.format(publishedRateCents / 100);
}

export type Draw = { min: number; max: number; average: number } | null | undefined;

/** Venue-confirmed draw over the last 90 days, or the agreed empty copy. */
export function formatDraw(draw: Draw): string {
  if (!draw) return 'Draw not yet established';
  return `Draws ${draw.min}–${draw.max} · avg ${draw.average}`;
}
