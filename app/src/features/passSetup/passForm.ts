import type { OrganizerPass } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { centsToDollarsField, dollarsToCents } from '@/features/booking/offers';

/**
 * Add a pass (GEL-1057): what the form holds, what stops Save, and how a pass
 * reads in a list. Prices are whole dollars typed by the organizer, carried
 * as integer cents and shown as they are: the app adds nothing to them.
 */

export const PASS_NAME_MAX = 60;
export const PASS_INCLUDED_MAX = 120;

export const STRIPE_NOTICE = 'Connect Stripe to sell paid passes';
export const SAVE_FAILED = 'Couldn’t save this pass. Try again.';
export const DELETE_FAILED = 'Couldn’t delete this pass. Try again.';
export const NEEDS_COMMUNITY = 'Start a community to add events and passes.';

export type PassScope = OrganizerPass['scope'];

export type PassDraft = {
  name: string;
  paid: boolean;
  /** Whole dollars, as typed. Monthly for a community pass. */
  price: string;
  included: string;
  /** A member limit or a quantity, as typed. Empty is no limit. */
  limit: string;
  freeForMembers: boolean;
};

export const EMPTY_PASS: PassDraft = { name: '', paid: false, price: '', included: '', limit: '', freeForMembers: false };

export function draftOf(pass: OrganizerPass): PassDraft {
  return {
    name: pass.name,
    paid: pass.priceCents != null,
    price: centsToDollarsField(pass.priceCents),
    included: pass.included,
    limit: pass.limit == null ? '' : String(pass.limit),
    freeForMembers: pass.freeForMembers,
  };
}

/** Digits only, no leading zeros: a count of people or passes. */
export function sanitizeCount(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 5);
}

/** Null is free. */
export function priceOf(d: PassDraft): number | null {
  return d.paid ? dollarsToCents(d.price) : null;
}

/** Null is no limit; NaN is something typed that is not a count above zero. */
export function limitOf(d: PassDraft): number | null {
  const digits = sanitizeCount(d.limit);
  if (!digits) return null;
  const count = Number(digits);
  return count > 0 ? count : Number.NaN;
}

/** Why Save is disabled, in the button's own words; null when the pass can be saved. */
export function passBlocker(d: PassDraft, scope: PassScope): string | null {
  if (!d.name.trim()) return 'Add a name to save';
  if (d.paid && dollarsToCents(d.price) == null) return 'Enter a price to save';
  if (Number.isNaN(limitOf(d))) return scope === 'community' ? 'Enter a member limit above 0' : 'Enter a quantity above 0';
  return null;
}

/** "Free", "$30" for an event pass, "$25 a month" for a community pass. */
export function passPriceText(pass: Pick<OrganizerPass, 'priceCents' | 'scope'>): string {
  if (pass.priceCents == null) return 'Free';
  return pass.scope === 'community' ? `${formatRate(pass.priceCents)} a month` : formatRate(pass.priceCents);
}

/** Who holds it, against the limit when there is one: "310 of 400 members", "40 of 48 held", "No one yet". */
export function passHolders(pass: Pick<OrganizerPass, 'heldCount' | 'limit' | 'scope'>): string {
  const { heldCount: held, limit, scope } = pass;
  if (scope === 'community') {
    if (limit != null) return `${held.toLocaleString('en-US')} of ${limit.toLocaleString('en-US')} members`;
    return held === 0 ? 'No members yet' : `${held.toLocaleString('en-US')} ${held === 1 ? 'member' : 'members'}`;
  }
  if (limit != null) return `${held.toLocaleString('en-US')} of ${limit.toLocaleString('en-US')} held`;
  return held === 0 ? 'No one holds it yet' : `${held.toLocaleString('en-US')} held`;
}

/** Why it can be turned off but not deleted. */
export function heldLine(pass: Pick<OrganizerPass, 'heldCount' | 'scope'>): string {
  const people = pass.heldCount === 1 ? '1 person holds' : `${pass.heldCount.toLocaleString('en-US')} people hold`;
  return `${people} this pass. You can turn it off, but it can’t be deleted.`;
}

/**
 * Access & passes in one line: "2 passes · from $30", "1 pass · free".
 * Counts passes that are turned on; "from" is the lowest price among them.
 * Null when the event has no passes at all.
 */
export function passesSummary(passes: Pick<OrganizerPass, 'priceCents' | 'active'>[]): string | null {
  if (passes.length === 0) return null;
  const on = passes.filter((p) => p.active);
  if (on.length === 0) return `${passes.length} ${passes.length === 1 ? 'pass' : 'passes'} · turned off`;
  const count = `${on.length} ${on.length === 1 ? 'pass' : 'passes'}`;
  const prices = on.flatMap((p) => (p.priceCents == null ? [] : [p.priceCents]));
  return prices.length === 0 ? `${count} · free` : `${count} · from ${formatRate(Math.min(...prices))}`;
}
