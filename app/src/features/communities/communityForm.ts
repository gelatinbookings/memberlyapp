import type { CreateCommunityInput, SocialNetwork } from '@/data/types';
import { dollarsToCents } from '@/features/booking/offers';
import type { LibraryPhoto } from '@/lib/photos';

/**
 * Create community (GEL-1056). The web's Create New Community, on a phone:
 * the same fields in four short steps (story, look, where and links, pricing)
 * instead of one long page. This file says what each step holds, what stops
 * each button, and what is sent.
 */

export const COMMUNITY_NAME_MAX = 60;
export const TAGLINE_MAX = 120;
export const COMMUNITY_DESCRIPTION_MAX = 500;
export const SLUG_MAX = 60;
export const REFERRAL_MAX = 24;
export const GALLERY_MAX = 10;
export const DEFAULT_MEMBERSHIP_NAME = 'Member';
export const DEFAULT_COUNTRY = 'United States';

const MB = 1024 * 1024;
/** The web's size limits: logo 2 MB, banner 5 MB, each gallery photo 10 MB. */
export const PHOTO_LIMITS = { logo: 2 * MB, banner: 5 * MB, gallery: 10 * MB } as const;

export const SLUG_HOST = 'withmemberly.com/community/';



export const STEP_TITLES = ['Your story', 'Your look', 'How people find you', 'Membership pricing'] as const;
/** The short names under the step bar. */
export const STEP_SHORT = ['Story', 'Look', 'Discovery', 'Pricing'] as const;
export type Step = 0 | 1 | 2 | 3;
export const LAST_STEP: Step = 3;
export const STRIPE_HELPER = 'You’ll connect Stripe before you can take payments.';
export const CREATE_FAILED = 'Couldn’t create your community. Try again.';
export const PHOTOS_FAILED = 'Couldn’t open your photos. Try again.';

export const SOCIAL_FIELDS: readonly { key: SocialNetwork; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'youtube', label: 'YouTube video', placeholder: 'https://youtube.com/watch?v=…' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
];

export type CommunityDraft = {
  name: string;
  tagline: string;
  /** As typed; empty means "made from the name". */
  slug: string;
  description: string;
  country: string;
  /** Any city, as typed (optional). */
  city: string;
  /** Its state, province or region, as typed or filled from a suggestion. */
  region: string;
  logo: LibraryPhoto | null;
  banner: LibraryPhoto | null;
  gallery: LibraryPhoto[];
  /** Discovery tags, picked or typed (see tags.ts). */
  tags: string[];
  links: Record<SocialNetwork, string>;
  referralCode: string;
  membership: 'free' | 'paid';
  /** Paid tiers, in the order members will see them. */
  tiers: TierDraft[];
};

/** One paid tier as typed. `key` keeps each card's fields steady while tiers come and go. */
export type TierDraft = {
  key: string;
  name: string;
  /** Whole dollars a month, as typed. */
  price: string;
  included: string;
};

export const TIER_MAX = 5;
export const INCLUDED_MAX = 120;

let tierSeq = 0;
/** A new, empty tier; the first one is called Member. */
export function newTier(first = false): TierDraft {
  tierSeq += 1;
  return { key: `tier-${tierSeq}`, name: first ? DEFAULT_MEMBERSHIP_NAME : '', price: '', included: '' };
}

/** What a tier is called in messages: its name, or its place. */
export const tierLabel = (t: TierDraft, i: number) => t.name.trim() || `tier ${i + 1}`;

export const EMPTY_LINKS: Record<SocialNetwork, string> = { instagram: '', facebook: '', x: '', tiktok: '', youtube: '', linkedin: '' };

export const EMPTY_COMMUNITY: CommunityDraft = {
  name: '',
  tagline: '',
  slug: '',
  description: '',
  country: DEFAULT_COUNTRY,
  city: '',
  region: '',
  logo: null,
  banner: null,
  gallery: [],
  tags: [],
  links: EMPTY_LINKS,
  referralCode: '',
  membership: 'free',
  tiers: [newTier(true)],
};

/** Lowercase letters, numbers and single dashes, as the web's URL slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, SLUG_MAX);
}

/** What the slug will be: the one typed, or one made from the name. */
export function effectiveSlug(d: Pick<CommunityDraft, 'slug' | 'name'>): string {
  return (d.slug || slugify(d.name)).replace(/-+$/, '');
}

/** Uppercase letters and numbers, as referral codes are printed. */
export function sanitizeReferral(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, REFERRAL_MAX);
}

/** A link is fine when it's empty or a full web address. */
export function linkProblem(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(v) ? null : 'Enter the full link, starting with https://';
}

/** Too large for its slot, by the web's limits. Unknown sizes pass; the server checks again. */
export const tooLarge = (photo: LibraryPhoto, limit: number) => photo.bytes != null && photo.bytes > limit;

/** Why Continue is disabled on a step, in the button's own words; null when it can go on. */
export function stepBlocker(step: Step, d: CommunityDraft): string | null {
  switch (step) {
    case 0:
      if (!d.name.trim()) return 'Add a name to continue';
      if (!d.tagline.trim()) return 'Add a tagline to continue';
      if (!d.description.trim()) return 'Add a description to continue';
      return null;
    case 1:
      if (!d.logo) return 'Add a logo to continue';
      if (!d.banner) return 'Add a banner to continue';
      return null;
    case 2: {
      if (!d.country) return 'Choose a country to continue';
      const bad = SOCIAL_FIELDS.find((f) => linkProblem(d.links[f.key]));
      return bad ? `Fix the ${bad.label} link to continue` : null;
    }
    case 3:
      return pricingBlocker(d);
  }
}

/** Why Create community is disabled on the pricing step; null when it can be created. */
export function pricingBlocker(d: CommunityDraft): string | null {
  if (d.membership === 'free') return null;
  for (const [i, t] of d.tiers.entries()) {
    if (!t.name.trim()) return d.tiers.length === 1 ? 'Name your membership to create' : `Name tier ${i + 1} to create`;
    if (dollarsToCents(t.price) == null) return `Add a price for ${tierLabel(t, i)} to create`;
  }
  const names = d.tiers.map((t) => t.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return 'Give each tier its own name';
  return null;
}

/** Anything entered that closing would lose. */
export function hasEntries(d: CommunityDraft): boolean {
  return (
    [d.name, d.tagline, d.slug, d.description, d.referralCode, d.city, d.region, ...Object.values(d.links)].some((v) => v.trim().length > 0) ||
    d.logo != null ||
    d.banner != null ||
    d.gallery.length > 0 ||
    d.tags.length > 0 ||
    d.country !== DEFAULT_COUNTRY ||
    d.membership === 'paid'
  );
}

/** The request for this draft. The price travels as integer cents; nothing is added to it. */
export function toCreateInput(d: CommunityDraft, idempotencyKey: string): CreateCommunityInput {
  const links: CreateCommunityInput['links'] = {};
  for (const { key } of SOCIAL_FIELDS) {
    const v = d.links[key].trim();
    if (v) links[key] = v;
  }
  const slug = d.slug ? effectiveSlug(d) : '';
  const referral = d.referralCode.trim();
  return {
    name: d.name.trim(),
    tagline: d.tagline.trim(),
    ...(slug ? { slug } : null),
    description: d.description.trim(),
    country: d.country,
    ...(d.city.trim() ? { city: d.city.trim(), ...(d.region.trim() ? { state: d.region.trim() } : null) } : null),
    logo: { uri: d.logo?.uri ?? '' },
    banner: { uri: d.banner?.uri ?? '' },
    gallery: d.gallery.map((p) => ({ uri: p.uri })),
    tags: d.tags,
    links,
    ...(referral ? { referralCode: referral } : null),
    membership:
      d.membership === 'paid'
        ? {
            kind: 'paid',
            tiers: d.tiers.map((t) => ({
              name: t.name.trim(),
              monthlyPriceCents: dollarsToCents(t.price) ?? 0,
              ...(t.included.trim() ? { included: t.included.trim() } : null),
            })),
          }
        : { kind: 'free' },
    idempotencyKey,
  };
}
