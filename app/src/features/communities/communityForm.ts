import { COMMUNITY_TYPES } from '@/data/taxonomy';
import type { City, CreateCommunityInput } from '@/data/types';
import { dollarsToCents } from '@/features/booking/offers';

/** Create community (GEL-1056): what the two steps hold, what stops each button, and what is sent. */

export const COMMUNITY_NAME_MAX = 60;
export const COMMUNITY_DESCRIPTION_MAX = 280;
/** The character count appears near the end, as it does on a note to a DJ. */
export const DESCRIPTION_COUNTER_FROM = 240;
export const DEFAULT_MEMBERSHIP_NAME = 'Member';

/** The Explore community types, the same list the Filters sheet uses. */
export const COMMUNITY_TYPE_OPTIONS: readonly string[] = COMMUNITY_TYPES;

export const STEP_TITLES = ['Community details', 'Membership pricing'] as const;
export const STRIPE_HELPER = 'You’ll connect Stripe before you can take payments.';
export const CREATE_FAILED = 'Couldn’t create your community. Try again.';
export const COVER_FAILED = 'Couldn’t open your photos. You can add a cover later.';

export type CommunityDraft = {
  name: string;
  cover: { uri: string } | null;
  city: City | null;
  type: string | null;
  description: string;
  membership: 'free' | 'paid';
  membershipName: string;
  /** Whole dollars a month, as typed. */
  price: string;
};

export const EMPTY_COMMUNITY: CommunityDraft = {
  name: '',
  cover: null,
  city: null,
  type: null,
  description: '',
  membership: 'free',
  membershipName: DEFAULT_MEMBERSHIP_NAME,
  price: '',
};

/** Why Continue is disabled on step 1, in the button's own words; null when it can go on. */
export function detailsBlocker(d: CommunityDraft): string | null {
  if (!d.name.trim()) return 'Add a name to continue';
  if (!d.city) return 'Choose a city to continue';
  if (!d.type) return 'Choose a type to continue';
  return null;
}

/** Why Create community is disabled on step 2; null when it can be created. */
export function pricingBlocker(d: CommunityDraft): string | null {
  if (d.membership === 'free') return null;
  if (!d.membershipName.trim()) return 'Add a membership name to create';
  if (dollarsToCents(d.price) == null) return 'Add a monthly price to create';
  return null;
}

/** Anything entered that closing would lose. */
export function hasEntries(d: CommunityDraft): boolean {
  return (
    d.name.trim().length > 0 ||
    d.cover != null ||
    d.city != null ||
    d.type != null ||
    d.description.trim().length > 0 ||
    d.membership === 'paid'
  );
}

/** The request for this draft. The price travels as integer cents; nothing is added to it. */
export function toCreateInput(d: CommunityDraft, idempotencyKey: string): CreateCommunityInput {
  const monthlyPriceCents = dollarsToCents(d.price);
  return {
    name: d.name.trim(),
    city: d.city?.name ?? '',
    type: d.type ?? '',
    description: d.description.trim() || undefined,
    cover: d.cover,
    membership:
      d.membership === 'paid' && monthlyPriceCents != null
        ? { kind: 'paid', name: d.membershipName.trim(), monthlyPriceCents }
        : { kind: 'free' },
    idempotencyKey,
  };
}
