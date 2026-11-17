/**
 * Sample data for the design build. Every name, count and dollar figure here
 * is invented for demonstration, matching the design canvas.
 */
import type { MemberlyRepository } from './repository';
import { formatCents } from '@/features/booking/money';
import { runExplore } from '@/features/explore/filters';
import { addDays, endsNextMorning, formatEventDate, formatIsoDate, zonedIso, type IsoDate } from '@/lib/dates';

import { CatalogUnavailableError, RepositoryError } from './errors';
import { SAMPLE_COMMUNITY_PAGES } from './sampleCommunityPages';
import { SAMPLE_REFERRALS } from './sampleReferrals';
import { defaultEventPage, SAMPLE_EVENT_PAGES } from './sampleEventPages';
import { COMMUNITY_TYPES, EVENT_THEMES, EVENT_TYPES, EVENT_VIBES, MUSIC_GENRES } from './taxonomy';
import {
  DEFAULT_TEST_ACCOUNT,
  NEW_ACCOUNT_TEMPLATE,
  TEST_ACCOUNTS,
  testAccountByEmail,
  testAccountById,
  type TestAccount,
  type TestAccountId,
} from './testAccounts';
import type {
  AnyBookingStatus,
  Booking,
  BudgetBand,
  CardPass,
  City,
  CommunityPage,
  ReferredPerson,
  Referrals,
  Community,
  CommunityOverview,
  DraftOffer,
  Dj,
  CodeIntent,
  CreateCommunityResult,
  EventFields,
  EventRelation,
  KeyValueStorage,
  MemberCard,
  EventAccess,
  EventPageDetails,
  MemberEvent,
  SocialNetwork,
  MyEvent,
  OrganizerEvent,
  OrganizerEventDetail,
  OrganizerPass,
  PassOrder,
  PassType,
  PaymentSession,
  PortalLaunch,
  Preferences,
  Session,
  SetupTask,
  TalentPage,
  Viewer,
} from './types';

const img = {
  warehouse: require('@/assets/images/cover-warehouse.jpg'),
  rooftop: require('@/assets/images/cover-rooftop.jpg'),
  dinner: require('@/assets/images/cover-dinner.jpg'),
  crowd: require('@/assets/images/cover-crowd.jpg'),
  dayparty: require('@/assets/images/cover-dayparty.jpg'),
  koyo: require('@/assets/images/dj-koyo.jpg'),
  nightform: require('@/assets/images/dj-nightform.jpg'),
};

const NY = 'America/New_York';

/** The design build pretends it is Friday, Nov 20, 2026 at 6 PM in Atlanta: tonight is the sample night and "this week" has content. */
export const DEMO_NOW = new Date('2026-11-20T18:00:00-05:00');

/** The viewer a test account signs in as. */
function viewerOf(account: TestAccount): Viewer {
  const { firstName, lastName } = account;
  return {
    id: account.viewerId,
    firstName,
    lastName,
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    email: account.email,
    city: account.city,
    roles: account.organizes ? ['member', 'organizer'] : ['member'],
    communityCount: account.memberships.filter((m) => m.status === 'active').length,
  };
}

/** The existing organizer (see testAccounts.ts): who the sample data has always been. */
export const sampleViewer: Viewer = viewerOf(DEFAULT_TEST_ACCOUNT);

const community = (
  id: string,
  name: string,
  city: string,
  memberCount: number,
  cover: Community['cover'],
  type: string,
  categories: string[],
  genres: string[],
  vibes: string[],
  isOwner?: boolean,
): Community => ({ id, name, city, memberCount, cover, type, categories, genres, vibes, ...(isOwner ? { isOwner } : null) });

/** Twelve in Atlanta (the filter board's "Show 12 communities"), three elsewhere for "Anywhere". */
export const sampleCommunities: Community[] = [
  community('c_second_sundays', 'Second Sundays', 'Atlanta', 1204, img.warehouse, 'Nightlife', ['Nightlife', 'Day parties'], ['House', 'Afrobeats'], ['Underground'], true),
  community('c_supper_club', 'Supper Club ATL', 'Atlanta', 640, img.dinner, 'Food & wine', ['Dinners'], ['R&B'], ['Upscale', 'Intimate']),
  community('c_rooftop', 'Rooftop Society', 'Atlanta', 410, img.rooftop, 'Nightlife', ['Nightlife'], ['R&B', 'House'], ['Upscale']),
  community('c_bass_church', 'Bass Church', 'Atlanta', 290, img.crowd, 'Music', ['Nightlife', 'Concerts'], ['Techno'], ['Underground']),
  community('c_daylight', 'Day Party Collective', 'Atlanta', 880, img.dayparty, 'Nightlife', ['Day parties'], ['Afrobeats', 'Amapiano'], ['Day party']),
  community('c_amapiano_atl', 'Amapiano Atlanta', 'Atlanta', 530, img.crowd, 'Music', ['Day parties', 'Nightlife'], ['Amapiano', 'Afrobeats'], ['Day party', 'Underground']),
  community('c_listening_room', 'The Listening Room', 'Atlanta', 220, img.rooftop, 'Music', ['Concerts'], ['R&B'], ['Intimate']),
  community('c_westside_makers', 'Westside Makers', 'Atlanta', 175, img.dinner, 'Art', ['Workshops'], [], ['Intimate']),
  community('c_founders', 'Founders After Dark', 'Atlanta', 360, img.rooftop, 'Networking', ['Nightlife'], ['House'], ['Upscale']),
  community('c_run_club', 'Morning Miles ATL', 'Atlanta', 450, img.dayparty, 'Wellness', ['Workshops'], [], ['Day party']),
  community('c_soul_kitchen', 'Soul Kitchen Sundays', 'Atlanta', 300, img.dinner, 'Food & wine', ['Dinners'], ['R&B'], ['Intimate']),
  community('c_o4w_social', 'Old Fourth Ward Social', 'Atlanta', 260, img.warehouse, 'Networking', ['Nightlife'], ['Afrobeats'], ['Upscale']),
  community('c_chi_house', 'Chi House Society', 'Chicago', 940, img.warehouse, 'Music', ['Nightlife'], ['House'], ['Underground']),
  community('c_bk_market', 'Brooklyn Night Market', 'New York', 1500, img.dayparty, 'Food & wine', ['Day parties'], ['Afrobeats'], ['Day party']),
  community('c_sunset_supper', 'Sunset Supper LA', 'Los Angeles', 410, img.dinner, 'Food & wine', ['Dinners'], ['R&B'], ['Upscale', 'Intimate']),
];

export const sampleDjs: Record<string, Dj> = {
  koyo: {
    id: 'dj_koyo',
    name: 'KOYO',
    initials: 'KY',
    photo: img.koyo,
    tier: 'Top performer',
    genres: ['House', 'Afrobeats'],
    publishedRateCents: 45000,
    draw: { min: 180, max: 260, average: 215 },
    bio: 'Atlanta resident with 6 years on the circuit. Peak-time sets that move between house, Afrobeats and amapiano without losing the floor.',
  },
  nightform: {
    id: 'dj_nightform',
    name: 'NIGHTFORM',
    initials: 'NF',
    photo: img.nightform,
    tier: 'City pillar',
    genres: ['Techno', 'Bass'],
    publishedRateCents: null,
    draw: { min: 240, max: 330, average: 281 },
    bio: 'Warehouse techno and heavy low end. Builds long, patient sets for rooms that stay late.',
  },
  blkmtn: {
    id: 'dj_blkmtn',
    name: 'BLKMTN',
    initials: 'BM',
    tier: 'Resident',
    genres: ['Baile funk', 'Jersey club'],
    publishedRateCents: 39000,
    draw: { min: 150, max: 205, average: 172 },
  },
  sable: {
    id: 'dj_sable',
    name: 'Sable Hart',
    initials: 'SH',
    tier: 'Verified',
    genres: ['Soul', 'Disco'],
    publishedRateCents: 27500,
    draw: null,
    bio: 'Soul and disco on vinyl. New to the catalog, with a growing Sunday following.',
  },
};

/** A catalog row: the DJ plus what Gelatin knows and the app never sees (city, band, nights already taken). */
type CatalogDj = Dj & {
  city: string;
  /** Gelatin assigns the band, so a private-rate DJ still sits in one. */
  band: BudgetBand;
  /** Nights this DJ is not open. The app is never told why. */
  takenOn?: IsoDate[];
};

/** Cities the fake catalog covers. Anywhere else answers `citySupported: false`. */
export const TALENT_CITIES = ['Atlanta'];

/** DJs per page. Small, so paging shows with ten DJs. The backend caps a page at 20. */
export const TALENT_PAGE_SIZE = 4;

const inAtlanta = (dj: Dj, band: BudgetBand, takenOn?: IsoDate[]): CatalogDj => ({ ...dj, city: 'Atlanta', band, ...(takenOn ? { takenOn } : null) });

/** Ten invented Atlanta DJs across tiers, bands and genres, with two private rates and two unknown draws. */
export const sampleCatalog: CatalogDj[] = [
  inAtlanta(sampleDjs.koyo, '300_to_600'),
  inAtlanta(sampleDjs.nightform, '600_to_1000'),
  inAtlanta(sampleDjs.blkmtn, '300_to_600'),
  inAtlanta(sampleDjs.sable, 'under_300'),
  inAtlanta(
    {
      id: 'dj_mara_sol',
      name: 'Mara Sol',
      initials: 'MS',
      tier: 'Verified',
      genres: ['Amapiano', 'Afrobeats'],
      publishedRateCents: 25000,
      draw: { min: 60, max: 110, average: 85 },
      bio: 'Daytime amapiano and Afrobeats. Warm-up sets that fill a patio early.',
    },
    'under_300',
  ),
  inAtlanta(
    {
      id: 'dj_oktave',
      name: 'OKTAVE',
      initials: 'OK',
      tier: 'Resident',
      genres: ['House', 'Disco'],
      publishedRateCents: 55000,
      draw: { min: 140, max: 190, average: 160 },
    },
    '300_to_600',
    // Not open on the Sunday of Long Table.
    ['2026-11-22'],
  ),
  inAtlanta(
    {
      id: 'dj_juno_vale',
      name: 'Juno Vale',
      initials: 'JV',
      tier: 'Top performer',
      genres: ['R&B', 'Soul'],
      publishedRateCents: 70000,
      draw: { min: 200, max: 280, average: 240 },
      bio: 'R&B edits and deep soul cuts, mixed for rooms that want to sing along.',
    },
    '600_to_1000',
  ),
  inAtlanta(
    {
      id: 'dj_lowtide',
      name: 'LOWTIDE',
      initials: 'LT',
      tier: 'City pillar',
      genres: ['Techno', 'House'],
      publishedRateCents: 120000,
      draw: { min: 320, max: 450, average: 390 },
      bio: 'Fifteen years of Atlanta warehouse nights. Closes the room.',
    },
    '1000_plus',
  ),
  inAtlanta(
    {
      id: 'dj_priya_nox',
      name: 'Priya Nox',
      initials: 'PN',
      tier: 'Verified',
      genres: ['Bass', 'Jersey club'],
      publishedRateCents: null,
      draw: null,
    },
    'under_300',
  ),
  inAtlanta(
    {
      id: 'dj_caro_lumen',
      name: 'Caro Lumen',
      initials: 'CL',
      tier: 'Top performer',
      genres: ['Afrobeats', 'Amapiano'],
      publishedRateCents: 150000,
      draw: { min: 400, max: 520, average: 465 },
      bio: 'Festival-scale Afrobeats and amapiano, scaled down for a club floor.',
    },
    '1000_plus',
  ),
];

/** What the app receives: the catalog row without Gelatin's private columns. */
function publicDj({ city: _city, band: _band, takenOn: _takenOn, ...dj }: CatalogDj): Dj {
  return dj;
}

/** `ok` answers; `unavailable` is 503 catalog_unavailable; `loading` holds the answer back for a while. */
export type TalentSimulation = 'ok' | 'unavailable' | 'loading';

/** How long `loading` keeps the skeletons up, in the design build. */
export const TALENT_LOADING_HOLD_MS = 12_000;

let devTalentMode: TalentSimulation = 'ok';

/** Dev-only switch for demos (see README): the next talent reads behave this way on every fake repository. */
export function setFakeTalentMode(mode: TalentSimulation): void {
  devTalentMode = mode;
}

// ---------------------------------------------------------------------------
// Offers, holds and passes (M5). The fake stands in for Memberly's backend,
// Gelatin and the payment provider. It is the only place a total is produced.

/** The Gelatin service fee on each booking, as the organizer is told on Lineup. */
const SERVICE_FEE_CENTS = 700;

/** How long a payment session lasts before the app has to ask for a new one. */
const SESSION_TTL_MS = 30 * 60_000;

/** A DJ who shows as open in Browse talent and is taken by the time an offer is sent (see README). */
export const TAKEN_ON_SEND_DJ_ID = 'dj_oktave';

/** How long a paid pass order takes to read `paid` in the design build, normally and when slow. */
export const PASS_CONFIRM_MS = 1200;
export const SLOW_PASS_CONFIRM_MS = 16_000;

/** What a declined test card says, standing in for the payment provider's message. */
export const DECLINED_MESSAGE = 'Your card was declined. Try a different card.';

/** Edge states the fake can be put in, for demos (deep links, see README) and tests. */
export type FakeSimulation = {
  /** Calls fail as they do with no connection. */
  offline: boolean;
  /** The next offer answers `dj_unavailable`, once. */
  djTakenNext: boolean;
  /** The next offer is created but its response is lost, once: the app sees a timeout. */
  timeoutNextOffer: boolean;
  /** This many payment sessions come back already expired. */
  expiredSessions: number;
  /** Paid pass orders stay `pending` past the app's 10 seconds. */
  slowPassOrder: boolean;
  /** The next pass order finds the pass sold out, once. */
  soldOutNext: boolean;
  /** The next pass order finds a new price, once. */
  priceChangeNext: boolean;
  /** Booking reads answer with the last body the backend had and `stale: true`, as when Gelatin is slow. */
  staleBookings: boolean;
  /** Booking reads fail, as when the backend cannot be reached. */
  failBookings: boolean;
  /** This many portal launches come back already expired. */
  expiredLaunches: number;
  /** Nobody else is open that night: alternates come back empty. */
  noAlternates: boolean;
  /** The next community or pass is saved but its response is lost, once: the app sees a timeout. */
  timeoutNextSave: boolean;
};

const NO_SIMULATION: FakeSimulation = {
  offline: false,
  djTakenNext: false,
  timeoutNextOffer: false,
  expiredSessions: 0,
  slowPassOrder: false,
  soldOutNext: false,
  priceChangeNext: false,
  staleBookings: false,
  failBookings: false,
  expiredLaunches: 0,
  noAlternates: false,
  timeoutNextSave: false,
};

export type FakePaymentOutcome = { status: 'succeeded' } | { status: 'failed'; message: string };

/** What the DJ, or time, can do to a booking. The test portal's buttons (see src/lib/portal). */
export type PortalAction = 'accept' | 'pass' | 'counter' | 'expire' | 'cancel';

/** A portal launch lasts 60 seconds and opens once (GEL-1021). */
export const LAUNCH_TTL_MS = 60_000;

/** Where fake launches point. `.invalid` never resolves: nothing can be opened by mistake. */
export const TEST_PORTAL_ORIGIN = 'https://gelatin-portal.invalid';

/** How long a counter reads `negotiating` before the DJ's new price lands, in the design build. */
export const COUNTER_MS = 6000;

/** A status the app has never heard of, for the "Checking status" demo. */
export const UNKNOWN_STATUS_SAMPLE = 'awaiting_review';

/** The booking behind a launch, as the test portal shows it. */
export type FakePortalBooking = { eventId: string; eventName: string; booking: Booking };

/**
 * What only the fake has: switches for edge states, and the part the payment
 * provider plays. The test payment sheet calls `confirmPayment` where the real
 * sheet would confirm with the provider and the backend would hear about it.
 */
export type WorldControls = {
  simulate(patch: Partial<FakeSimulation>): void;
  /** The payment went through: a hold moves its request to `requested`; a pass order heads for `paid`. */
  confirmPayment(clientSecret: string): Promise<FakePaymentOutcome>;
  /** A declined card. Nothing is held, charged or sent. */
  declinePayment(clientSecret: string): Promise<FakePaymentOutcome>;
  /** Mark every paid-for pass order `paid` now, as the backend's webhook would. */
  settlePassOrders(): void;
  /** How many booking requests exist on an event. */
  requestCount(eventId: string): number;
  /**
   * Put a booking in any status, as Gelatin would. `newOfferCents` is the DJ's
   * new price on `reauthorization_required`. Changes the event's ETag.
   */
  setStatus(requestId: string, status: AnyBookingStatus, patch?: { newOfferCents?: number | null }): void;
  /**
   * Play the DJ from the test portal: accept → confirmed, pass → declined,
   * counter → negotiating and then reauthorization_required at a new price,
   * expire → expired, cancel → cancelled.
   */
  playDj(requestId: string, action: PortalAction): void;
  /** Land every counter still being worked out: negotiating → reauthorization_required. */
  settleCounters(): void;
  /** How many booking reads an event has answered in full, and how many with "not modified". */
  bookingFetches(eventId: string): { full: number; notModified: number };
  /** How many portal launches have been minted. */
  portalLaunchCount(): number;
  /** Use a launch, once. Null when it was used before, has expired or never existed. */
  redeemLaunch(launchUrl: string): FakePortalBooking | null;
  /** One booking as it stands now. */
  portalBooking(requestId: string): FakePortalBooking | null;
  /** How many pass orders exist. */
  passOrderCount(): number;
};

/**
 * The fake's controls. Everything in WorldControls acts on the account that
 * is signed in (the existing organizer until someone signs in).
 */
export type FakeControls = WorldControls & {
  /** Sign in as one of the test accounts (see testAccounts.ts), as the Test accounts sheet does. */
  signInAs(accountId: TestAccountId): Promise<Session>;
  /** The viewer id of the account whose data the repository is answering with. */
  currentViewerId(): string;
};

export type FakeRepository = MemberlyRepository & { readonly fake: FakeControls };

/** The fake's controls, or null for any other repository (the HTTP one in M8). */
export function getFakeControls(repository: MemberlyRepository): FakeControls | null {
  return (repository as Partial<FakeRepository>).fake ?? null;
}

type StoredOrder = {
  orderId: string;
  eventId: string;
  passTypeId: string;
  status: PassOrder['status'];
  totalCents: number;
  clientSecret: string | null;
  /** The payment went through; the order is on its way to `paid`. */
  paymentConfirmed: boolean;
};

/** What a payment session pays for. */
type SessionTarget = { kind: 'hold'; requestId: string } | { kind: 'pass'; orderId: string };
type StoredSession = SessionTarget & { expiresAt: number };

const pass = (id: string, name: string, priceCents: number, included: string, extra: Partial<PassType> = {}): PassType => ({
  id,
  name,
  priceCents,
  included,
  soldOut: false,
  freeForMembers: false,
  ...extra,
});

/** Invented pass setups. A members-free pass has no price to pay. */
function seedPassTypes(): Record<string, PassType[]> {
  return {
    e_warehouse_friday: [
      pass('pt_warehouse_general', 'General pass', 3000, 'Entry all night'),
      pass('pt_warehouse_member', 'Member pass', 0, 'Entry before midnight for Second Sundays members', { freeForMembers: true }),
    ],
    e_rooftop_hours: [
      pass('pt_rooftop_general', 'General pass', 3000, 'Entry all night and a welcome drink'),
      pass('pt_rooftop_member', 'Member pass', 0, 'Entry before 11 PM for Rooftop Society members', { freeForMembers: true }),
      pass('pt_rooftop_table', 'Table for four', 24000, 'A reserved table by the skyline', { soldOut: true }),
    ],
    e_night_service: [pass('pt_night_member', 'Member pass', 0, 'Entry all night for Bass Church members', { freeForMembers: true })],
    e_long_table: [pass('pt_long_table_seat', 'Seat at the table', 8500, 'Five courses with wine pairings')],
    e_daylight: [pass('pt_daylight_general', 'General pass', 2500, 'Entry from 2 PM')],
    e_listening_session: [pass('pt_listening_general', 'General pass', 2000, 'A seat and the conversation after')],
    e_clay_and_wine: [pass('pt_clay_general', 'General pass', 4500, 'Clay, a wheel and two glasses of wine')],
  };
}

/** A pass as the fake server keeps it: what the organizer set up, plus who holds it. */
type StoredPass = {
  id: string;
  scope: 'community' | 'event';
  /** Set for a community pass; an event pass takes its community from the event. */
  communityId: string | null;
  eventId: string | null;
  name: string;
  /** Null is free. Monthly for a community pass. */
  priceCents: number | null;
  included: string;
  limit: number | null;
  freeForMembers: boolean;
  active: boolean;
  heldCount: number;
  /** Marked sold out whatever the quantity says (the sample "Table for four", and a demo switch). */
  soldOut: boolean;
  /** Sample passes that were on sale before this build asked about Stripe. They stay on sale. */
  seeded: boolean;
};

/** How many people hold each sample pass, to match the sales lines on Manage. */
const SEEDED_HOLDERS: Record<string, { held: number; limit?: number }> = {
  pt_warehouse_general: { held: 212 },
  pt_warehouse_member: { held: 86 },
  pt_long_table_seat: { held: 40, limit: 48 },
};

function seedEventPasses(): Map<string, StoredPass[]> {
  return new Map(
    Object.entries(seedPassTypes()).map(([eventId, types]) => [
      eventId,
      types.map(
        (t): StoredPass => ({
          id: t.id,
          scope: 'event',
          communityId: null,
          eventId,
          name: t.name,
          priceCents: t.priceCents > 0 ? t.priceCents : null,
          included: t.included,
          limit: SEEDED_HOLDERS[t.id]?.limit ?? null,
          freeForMembers: t.freeForMembers,
          active: true,
          heldCount: SEEDED_HOLDERS[t.id]?.held ?? 0,
          soldOut: t.soldOut,
          seeded: true,
        }),
      ),
    ]),
  );
}

/** Invented memberships for the sample community. A community created in the app starts with what its organizer chose. */
function seedCommunityPasses(communityId: string): StoredPass[] {
  if (communityId !== 'c_second_sundays') return [];
  const tier = (id: string, name: string, priceCents: number | null, included: string, heldCount: number, limit: number | null): StoredPass => ({
    id,
    scope: 'community',
    communityId,
    eventId: null,
    name,
    priceCents,
    included,
    limit,
    freeForMembers: false,
    active: true,
    heldCount,
    soldOut: false,
    seeded: true,
  });
  return [
    tier('cp_sundays_member', 'Member', null, 'Entry before midnight at every Second Sundays night', 894, null),
    tier('cp_sundays_inner_circle', 'Inner Circle', 2500, 'Guest list plus one, and first access to passes', 310, 400),
  ];
}

/** The one setup task the app knows: taking payments needs a connected Stripe account. */
const CONNECT_STRIPE_TASK: SetupTask = {
  id: 'stripe',
  title: 'Connect Stripe',
  detail: 'So you can receive payments from paid tiers.',
  actionLabel: 'Connect',
};

/** Longest name the server takes for a community or a pass (GEL-1058). */
export const NAME_MAX = 60;
/** The web's limits for a community: tagline 120, description 500, gallery 10 photos. */
export const TAGLINE_MAX = 120;
export const DESCRIPTION_MAX = 500;
export const GALLERY_MAX = 10;
export const TAG_LIMIT = 10;
/** Paid tiers a community can start with, and the length of a tier's "what's included" line. */
export const MEMBERSHIP_TIER_MAX = 5;
export const INCLUDED_MAX = 120;

/** Sort a community's tags into the Explore taxonomy: one type, genres, vibes, event types; the rest as custom. */
function fileTags(tags: string[]): Pick<Community, 'type' | 'genres' | 'vibes' | 'categories' | 'customTags'> {
  const is = (list: readonly string[]) => (t: string) => list.includes(t);
  const type = tags.find(is(COMMUNITY_TYPES));
  const known = [...COMMUNITY_TYPES, ...MUSIC_GENRES, ...EVENT_VIBES, ...EVENT_TYPES, ...EVENT_THEMES] as readonly string[];
  return {
    ...(type ? { type } : null),
    genres: tags.filter(is(MUSIC_GENRES)),
    vibes: tags.filter(is(EVENT_VIBES)),
    categories: tags.filter(is(EVENT_TYPES)),
    customTags: tags.filter((t) => !known.includes(t)),
  };
}

/** A booking that still holds the DJ for the night. */
const OPEN_BOOKING: Booking['status'][] = ['authorization_required', 'requested', 'negotiating', 'reauthorization_required', 'confirmed'];

/** A booking that is over: the DJ passed, time ran out, or it was cancelled. */
const ENDED_BOOKING: Booking['status'][] = ['declined', 'expired', 'cancelled'];

export const sampleEvents: MemberEvent[] = [
  {
    id: 'e_warehouse_friday',
    name: 'Warehouse Friday',
    communityId: 'c_second_sundays',
    communityName: 'Second Sundays',
    cover: img.warehouse,
    startsAt: '2026-11-20T22:00:00-05:00',
    endsAt: '2026-11-21T02:00:00-05:00',
    timeZone: NY,
    neighborhood: 'Westside',
    city: 'Atlanta',
    distanceMiles: 1.2,
    priceLabel: 'From $30',
    viewerHasPass: true,
    description:
      'A long night in a raw room on the Westside. Members get in free before midnight; everyone else needs a pass.',
    publicLineup: [
      { djName: 'KOYO', djPhoto: img.koyo, genres: 'House · Afrobeats', setTime: 'Midnight to 2', tier: 'Top performer' },
      { djName: null, setTime: '10 to midnight' },
    ],
    mapPin: { x: 0.38, y: 0.34 },
    category: 'Nightlife',
    genres: ['House', 'Afrobeats'],
    vibes: ['Underground'],
  },
  {
    id: 'e_rooftop_hours',
    name: 'Rooftop Hours',
    communityId: 'c_rooftop',
    communityName: 'Rooftop Society',
    cover: img.rooftop,
    startsAt: '2026-11-20T21:00:00-05:00',
    endsAt: '2026-11-21T01:00:00-05:00',
    timeZone: NY,
    neighborhood: 'Midtown',
    city: 'Atlanta',
    distanceMiles: 2.4,
    priceLabel: 'From $30',
    viewerHasPass: false,
    description: 'Cocktails over the skyline with a members-first guest list.',
    publicLineup: [
      { djName: 'Sable Hart', genres: 'Soul · Disco', setTime: '9 to 11', tier: 'Verified' },
      { djName: null, setTime: '11 to 1' },
    ],
    mapPin: { x: 0.58, y: 0.52 },
    category: 'Nightlife',
    genres: ['R&B', 'House'],
    vibes: ['Upscale'],
  },
  {
    id: 'e_night_service',
    name: 'Night Service',
    communityId: 'c_bass_church',
    communityName: 'Bass Church',
    cover: img.crowd,
    startsAt: '2026-11-20T23:00:00-05:00',
    endsAt: '2026-11-21T03:00:00-05:00',
    timeZone: NY,
    neighborhood: 'Old Fourth Ward',
    city: 'Atlanta',
    distanceMiles: 3.1,
    priceLabel: 'Members',
    viewerHasPass: false,
    description: 'Low lights, loud system. Members only.',
    publicLineup: [{ djName: 'NIGHTFORM', djPhoto: img.nightform, genres: 'Techno · Bass', setTime: '11 to 3', tier: 'City pillar' }],
    mapPin: { x: 0.2, y: 0.7 },
    category: 'Nightlife',
    genres: ['Techno'],
    vibes: ['Underground'],
  },
  {
    id: 'e_long_table',
    name: 'Long Table',
    communityId: 'c_supper_club',
    communityName: 'Supper Club ATL',
    cover: img.dinner,
    startsAt: '2026-11-20T19:30:00-05:00',
    endsAt: '2026-11-20T22:30:00-05:00',
    timeZone: NY,
    neighborhood: 'Inman Park',
    city: 'Atlanta',
    distanceMiles: 2.9,
    priceLabel: 'From $85',
    viewerHasPass: false,
    description: 'Forty-eight seats, one long table, a chef you will want to meet.',
    publicLineup: [{ djName: 'Sable Hart', genres: 'Soul · Disco', setTime: 'Dinner set, 7:30 to 10', tier: 'Verified' }],
    mapPin: { x: 0.62, y: 0.78 },
    category: 'Dinners',
    genres: ['R&B'],
    vibes: ['Upscale', 'Intimate'],
  },
];

const dayparty: MemberEvent = {
  id: 'e_daylight',
  name: 'Daylight',
  communityId: 'c_daylight',
  communityName: 'Day Party Collective',
  cover: img.dayparty,
  startsAt: '2026-11-28T14:00:00-05:00',
  endsAt: '2026-11-28T19:00:00-05:00',
  timeZone: NY,
  neighborhood: 'Grant Park',
  city: 'Atlanta',
  priceLabel: 'From $25',
  viewerHasPass: false,
  description: 'Sun, a big patio and a DJ booth under the canopy.',
  publicLineup: [
    { djName: 'Mara Sol', genres: 'Amapiano · Afrobeats', setTime: '2 to 5', tier: 'Verified' },
    { djName: 'BLKMTN', genres: 'Baile funk · Jersey club', setTime: '5 to 7', tier: 'Resident' },
  ],
  mapPin: { x: 0.5, y: 0.5 },
  category: 'Day parties',
  genres: ['Afrobeats', 'Amapiano'],
  vibes: ['Day party'],
};

/** More of the week for Explore. Not tonight, so Home's map is unchanged. */
const exploreOnlyEvents: MemberEvent[] = [
  {
    id: 'e_listening_session',
    name: 'Listening Session',
    communityId: 'c_listening_room',
    communityName: 'The Listening Room',
    cover: img.rooftop,
    startsAt: '2026-11-21T20:00:00-05:00',
    endsAt: '2026-11-21T23:00:00-05:00',
    timeZone: NY,
    neighborhood: 'Castleberry Hill',
    city: 'Atlanta',
    distanceMiles: 1.8,
    priceLabel: 'From $20',
    viewerHasPass: false,
    description: 'A new R&B record played front to back on a proper system, then a conversation with the producer.',
    publicLineup: [{ djName: null, setTime: '7 to 9' }],
    mapPin: { x: 0.44, y: 0.6 },
    category: 'Concerts',
    genres: ['R&B'],
    vibes: ['Intimate'],
  },
  {
    id: 'e_clay_and_wine',
    name: 'Clay & Wine',
    communityId: 'c_westside_makers',
    communityName: 'Westside Makers',
    cover: img.dinner,
    startsAt: '2026-11-24T19:00:00-05:00',
    endsAt: '2026-11-24T21:30:00-05:00',
    timeZone: NY,
    neighborhood: 'West Midtown',
    city: 'Atlanta',
    distanceMiles: 4.2,
    priceLabel: 'From $45',
    viewerHasPass: false,
    description: 'Throw a bowl, drink something good, take it home after the kiln.',
    publicLineup: [{ djName: 'Sable Hart', genres: 'Soul · Disco', setTime: 'Studio set, 7 to 9:30', tier: 'Verified' }],
    mapPin: { x: 0.3, y: 0.4 },
    category: 'Workshops',
    genres: [],
    vibes: ['Intimate'],
  },
];

const allEvents = (): MemberEvent[] => [...sampleEvents, dayparty, ...exploreOnlyEvents];

/** The existing organizer's picks: 11 in all, the number Me shows. */
export const samplePreferences: Preferences = DEFAULT_TEST_ACCOUNT.preferences;

/** The fake codes, documented in the README. */
export const FAKE_CODES = { success: '1234', expired: '0000' } as const;
export const RESEND_SECONDS = 24;

/** Where the session lives in secure storage. */
export const SESSION_KEY = 'memberly.session';
const PROFILE_KEY = 'memberly.fake.profile';

/** A storage that forgets on reload. Tests use it; so does the fake when no storage is given. */
export function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial));
  return {
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => {
      data.set(k, v);
    },
    remove: async (k) => {
      data.delete(k);
    },
  };
}

function splitName(full: string): Pick<Viewer, 'firstName' | 'lastName' | 'initials'> {
  const [first = '', ...rest] = full.trim().split(/\s+/);
  const last = rest.join(' ');
  const initials = `${first.charAt(0)}${last.charAt(0) || first.charAt(1)}`.toUpperCase();
  return { firstName: first, lastName: last, initials };
}

const bookings: Booking[] = [
  {
    requestId: 'br_nightform',
    dj: sampleDjs.nightform,
    status: 'authorization_required',
    offerCents: 60000,
    totalCents: 60700,
    note: '',
    setTime: '10 PM to midnight',
  },
  {
    requestId: 'br_blkmtn',
    dj: sampleDjs.blkmtn,
    status: 'requested',
    offerCents: 39000,
    totalCents: 39700,
    note: 'Opening set',
    setTime: 'Opening set',
  },
  {
    requestId: 'br_koyo',
    dj: sampleDjs.koyo,
    status: 'confirmed',
    offerCents: 45000,
    totalCents: 45700,
    note: 'Headline set, midnight to 2',
    setTime: 'Midnight to 2',
  },
];

/** The sample event that shows every status at once (the "Every status" board). */
export const ALL_STATUSES_EVENT_ID = 'e_sunday_sessions';

const fromCatalog = (id: string): Dj => {
  const row = sampleCatalog.find((dj) => dj.id === id);
  if (!row) throw new Error(`No sample DJ ${id}`);
  return publicDj(row);
};

/** One booking in each of the eight statuses, each with a different DJ. Totals are the fake server's. */
function seedAllStatuses(): Booking[] {
  const row = (
    dj: Dj,
    status: Booking['status'],
    offerCents: number,
    totalCents: number,
    setTime: string,
    extra: Partial<Booking> = {},
  ): Booking => ({ requestId: `br_sessions_${dj.id.replace(/^dj_/, '')}`, dj, status, offerCents, totalCents, note: '', setTime, ...extra });
  return [
    row(sampleDjs.koyo, 'authorization_required', 45000, 45700, '8 to 10'),
    row(sampleDjs.blkmtn, 'requested', 39000, 39700, 'Opening set'),
    row(sampleDjs.nightform, 'negotiating', 60000, 60700, '10 to midnight'),
    row(sampleDjs.sable, 'reauthorization_required', 27500, 28200, '6 to 8', { newOfferCents: 34000 }),
    row(fromCatalog('dj_juno_vale'), 'confirmed', 70000, 70700, 'Headline'),
    row(fromCatalog('dj_mara_sol'), 'declined', 25000, 25700, 'Warm-up'),
    row(fromCatalog('dj_lowtide'), 'expired', 120000, 120700, 'Closing set'),
    row(fromCatalog('dj_caro_lumen'), 'cancelled', 150000, 150700, 'Guest set'),
  ];
}

export const sampleCities: City[] = [
  { id: 'atl', name: 'Atlanta', region: 'GA', timeZone: NY },
  { id: 'sav', name: 'Savannah', region: 'GA', timeZone: NY },
  { id: 'chi', name: 'Chicago', region: 'IL', timeZone: 'America/Chicago' },
  { id: 'den', name: 'Denver', region: 'CO', timeZone: 'America/Denver' },
  { id: 'la', name: 'Los Angeles', region: 'CA', timeZone: 'America/Los_Angeles' },
  { id: 'nyc', name: 'New York', region: 'NY', timeZone: NY },
];

const atlanta = sampleCities[0];
const savannah = sampleCities[1];

type StoredEvent = {
  id: string;
  communityId: string;
  status: OrganizerEventDetail['status'];
  /** Memberly's pass sales line for Manage; null until passes sell. Drafts read "Draft". */
  salesLabel: string | null;
  fields: EventFields;
};

function seedEvents(): StoredEvent[] {
  return [
    {
      id: 'e_warehouse_friday',
      communityId: 'c_second_sundays',
      status: 'published',
      salesLabel: '212 passes sold',
      fields: {
        name: 'Warehouse Friday',
        tagline: 'A long night in a raw room',
        description: sampleEvents[0].description,
        cover: img.warehouse,
        date: '2026-11-20',
        startTime: '22:00',
        endTime: '02:00',
        venue: 'Westside warehouse',
        city: atlanta,
      },
    },
    {
      id: 'e_long_table',
      communityId: 'c_second_sundays',
      status: 'published',
      salesLabel: '40 of 48 seats',
      fields: {
        name: 'Long Table',
        tagline: 'One long table',
        description: sampleEvents[3].description,
        cover: img.dinner,
        date: '2026-11-22',
        startTime: '19:30',
        endTime: '22:30',
        venue: 'Inman Park loft',
        city: atlanta,
      },
    },
    {
      // A draft with two DJs added and no offers sent: one published rate, one private rate.
      id: 'e_late_service',
      communityId: 'c_second_sundays',
      status: 'draft',
      salesLabel: null,
      fields: {
        name: 'Late Service',
        tagline: '',
        description: '',
        cover: img.crowd,
        date: '2026-11-28',
        startTime: '22:00',
        endTime: '03:00',
        venue: 'The Basement',
        city: atlanta,
      },
    },
    {
      // One booking in every status: the "Every status, as the organizer reads it" board.
      id: ALL_STATUSES_EVENT_ID,
      communityId: 'c_second_sundays',
      status: 'published',
      salesLabel: '64 passes sold',
      fields: {
        name: 'Sunday Sessions',
        tagline: 'An all-day room, eight sets',
        description: 'Doors at four. Eight DJs across the afternoon and the night.',
        cover: img.dayparty,
        date: '2026-12-13',
        startTime: '16:00',
        endTime: '02:00',
        venue: 'Westside warehouse',
        city: atlanta,
      },
    },
    {
      // A draft in a city Gelatin does not book yet: Browse talent answers "No DJs in Savannah yet".
      id: 'e_river_street',
      communityId: 'c_second_sundays',
      status: 'draft',
      salesLabel: null,
      fields: {
        name: 'River Street Social',
        tagline: '',
        description: '',
        cover: img.rooftop,
        date: '2026-12-05',
        startTime: '20:00',
        endTime: '01:00',
        venue: 'River Street loft',
        city: savannah,
      },
    },
  ];
}

function seedDraftOffers(): Record<string, DraftOffer[]> {
  return {
    e_late_service: [
      // Pre-filled with the published rate.
      { dj: sampleDjs.koyo, offerCents: sampleDjs.koyo.publishedRateCents, note: '' },
      // Private rate: the organizer enters the fee.
      { dj: sampleDjs.nightform, offerCents: null, note: '' },
    ],
  };
}

function toDetail(e: StoredEvent, communityName?: string): OrganizerEventDetail {
  const { date, startTime, endTime, city } = e.fields;
  const timeZone = city?.timeZone ?? null;
  const timed = !!(date && startTime && endTime && timeZone);
  return {
    ...e.fields,
    id: e.id,
    communityId: e.communityId,
    communityName: communityName ?? sampleCommunities.find((c) => c.id === e.communityId)?.name ?? '',
    status: e.status,
    timeZone,
    startsAt: timed ? zonedIso(date!, startTime!, timeZone!) : null,
    endsAt: timed
      ? zonedIso(endsNextMorning(startTime!, endTime!) ? addDays(date!, 1) : date!, endTime!, timeZone!)
      : null,
  };
}

/** Small artificial delay so loading states are visible in the design build. */
function later<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * In-memory and per instance: saves, publishes and offer edits last until the
 * app reloads. Milestone 8 replaces this with Memberly's backend.
 */
function membershipsOf(account: TestAccount): MemberCard['memberships'] {
  return account.memberships.flatMap((m) => {
    const c = sampleCommunities.find((x) => x.id === m.communityId);
    return c ? [{ communityId: c.id, communityName: c.name, cover: c.cover, tierLabel: m.tierLabel, status: m.status }] : [];
  });
}

/**
 * Everything one account sees, built from its seed in testAccounts.ts. Each
 * account gets its own world: its events, bookings, unsent offers, passes,
 * orders and preferences. Tonight's events, communities and DJs are shared.
 */
type WorldSeed = {
  viewer: Viewer;
  preferences: Preferences;
  memberships: MemberCard['memberships'];
  /** Event id → the pass held. */
  passes: [string, string][];
  /** Going or saved, by event id. */
  relations: Record<string, EventRelation>;
  /** The community the viewer runs, or null. */
  community: Community | null;
  setupTasks: CommunityOverview['setupTasks'];
  stats: Pick<CommunityOverview, 'revenueMonthCents' | 'newMembersMonth' | 'churnPercent' | 'sampleNumbers'>;
  events: StoredEvent[];
  bookings: Record<string, Booking[]>;
  draftOffers: Record<string, DraftOffer[]>;
  /** People who joined with the viewer's code. */
  referred: ReferredPerson[];
};

/** A cover for a community that is not in the shared catalog (one just created). */
const NEW_COMMUNITY_COVER = img.dayparty;

function seedWorld(account: TestAccount, who: Partial<Pick<Viewer, 'id' | 'firstName' | 'lastName' | 'initials' | 'email'>> = {}): WorldSeed {
  const run = account.organizes;
  const listed = run ? sampleCommunities.find((c) => c.id === run.community.id) : undefined;
  const community: Community | null = run
    ? { ...(listed ?? { cover: NEW_COMMUNITY_COVER }), ...run.community, isOwner: true }
    : null;
  const eventIds = new Set(run?.eventIds ?? []);
  const allBookings: Record<string, Booking[]> = {
    e_warehouse_friday: bookings.map((b) => ({ ...b })),
    [ALL_STATUSES_EVENT_ID]: seedAllStatuses(),
  };
  const only = <T,>(byEvent: Record<string, T>) => Object.fromEntries(Object.entries(byEvent).filter(([id]) => eventIds.has(id)));
  return {
    viewer: { ...viewerOf(account), ...who },
    preferences: account.preferences,
    memberships: membershipsOf(account),
    passes: account.passes.map((p) => [p.eventId, p.passName]),
    relations: { ...account.events },
    community,
    setupTasks: run ? run.setupTasks.map((t) => ({ ...t })) : [],
    stats: {
      revenueMonthCents: run?.stats.revenueMonthCents ?? 0,
      newMembersMonth: run?.stats.newMembersMonth ?? 0,
      churnPercent: run?.stats.churnPercent ?? null,
      sampleNumbers: run?.stats.sample ?? false,
    },
    // Copies, so a hold in one world never shows in another.
    events: seedEvents()
      .filter((e) => eventIds.has(e.id))
      .map((e) => (run ? { ...e, communityId: run.community.id } : e)),
    bookings: only(allBookings),
    draftOffers: only(seedDraftOffers()),
    // Someone signing in under their own email starts with nobody referred.
    referred: who.email ? [] : [...(SAMPLE_REFERRALS[account.id] ?? [])],
  };
}

export type FakeRepositoryOptions = {
  delayMs?: number;
  /** Start signed in (and onboarded) as the sample viewer when nothing is stored. EXPO_PUBLIC_FAKE_SIGNED_IN=1. */
  signedIn?: boolean;
  /** Where the session is kept: expo-secure-store in the app, memory in tests. */
  storage?: KeyValueStorage;
  /** How talent reads behave, asked on every call. Tests flip it; the app uses the dev switch. */
  talentMode?: () => TalentSimulation;
  /** Edge states to start in. Change them later through `fake.simulate`. */
  simulation?: Partial<FakeSimulation>;
  /** DJs who are taken by the time an offer is sent. Defaults to the one sample DJ in the README. */
  takenOnSend?: string[];
  /**
   * The server's figures for an offer. Tests pass their own to prove screens
   * show what the server says, whatever it says.
   */
  quote?: (offerCents: number) => { serviceFeeCents: number; totalCents: number };
  /** How long a paid pass order takes to read `paid`; Infinity leaves it pending until `fake.settlePassOrders()`. */
  passConfirmMs?: number;
  slowPassConfirmMs?: number;
  /** How long a counter reads `negotiating` before the new price lands; Infinity waits for `fake.settleCounters()`. */
  counterMs?: number;
  /**
   * Hold every data call until the stored session has been read once, so a
   * screen that asks before then is answered as the person who is signed in,
   * never as the default account. The app sets this; a real repository does
   * the same by reading its token before the first request.
   */
  holdUntilSession?: boolean;
};

/** The session calls live on the repository itself; a world answers everything else for one account. */
type SessionMethod = 'getSession' | 'sendCode' | 'verifyCode' | 'signInWithProvider' | 'completeOnboarding' | 'signOut';
type World = Omit<MemberlyRepository, SessionMethod> & { readonly fake: WorldControls };

function createWorld(options: FakeRepositoryOptions, seed: WorldSeed): World {
  const delay = options.delayMs ?? 250;
  let preferences: Preferences = seed.preferences;
  /** The communities this viewer runs: the seeded one, then any they create. Each has its own setup and numbers. */
  type Owned = { community: Community; setupTasks: SetupTask[]; stats: WorldSeed['stats']; stripeConnected: boolean };
  const owned: Owned[] = seed.community ? [{ community: seed.community, setupTasks: seed.setupTasks, stats: seed.stats, stripeConnected: false }] : [];
  const ownedById = (communityId: string | null | undefined) => owned.find((o) => o.community.id === communityId);
  // Running a community is what makes someone an organizer, from the moment it exists.
  const viewer = (): Viewer => ({ ...seed.viewer, roles: owned.length > 0 ? ['member', 'organizer'] : ['member'] });
  /** The shared catalog, with the owner mark only on communities this viewer runs. */
  const communities = (): Community[] => sampleCommunities.map(({ isOwner: _owner, ...c }) => (ownedById(c.id) ? { ...c, isOwner: true } : c));
  const events = seed.events;
  /** An event as the organizer edits it; a community that is not in the shared catalog is named from the viewer's own. */
  const detail = (e: StoredEvent) => toDetail(e, ownedById(e.communityId)?.community.name);
  const bookingsByEvent: Record<string, Booking[]> = seed.bookings;
  const offersByEvent = seed.draftOffers;
  let nextId = 1;

  // --- Offers, holds and passes -------------------------------------------
  const sim: FakeSimulation = { ...NO_SIMULATION, ...options.simulation };
  const takenOnSend = new Set(options.takenOnSend ?? [TAKEN_ON_SEND_DJ_ID]);
  /** Nights a DJ turned out to be taken on, learnt when an offer was refused. */
  const refusedNights = new Map<string, Set<IsoDate>>();
  /** `<event>:<dj>:<client_offer_id>` → request id: the Idempotency-Key the backend sends Gelatin. */
  const requestsByKey = new Map<string, string>();
  const sessions = new Map<string, StoredSession>();
  const eventPasses = seedEventPasses();
  const communityPasses = new Map<string, StoredPass[]>(owned.map((o) => [o.community.id, seedCommunityPasses(o.community.id)]));
  /** `<kind>:<idempotency_key>` → the id of what that request made. */
  const savedByKey = new Map<string, string>();
  const orders = new Map<string, StoredOrder>();
  const ordersByKey = new Map<string, string>();
  /** Event id → the pass the viewer holds. */
  const passes = new Map<string, string>(seed.passes);
  const relations = seed.relations;
  const passConfirmMs = options.passConfirmMs ?? (delay === 0 ? 0 : PASS_CONFIRM_MS);
  const slowPassConfirmMs = options.slowPassConfirmMs ?? SLOW_PASS_CONFIRM_MS;
  let nextSecret = 1;

  /** The server's sum, and the only one. */
  const priced = (offerCents: number) =>
    options.quote?.(offerCents) ?? { serviceFeeCents: SERVICE_FEE_CENTS, totalCents: offerCents + SERVICE_FEE_CENTS };

  /** Every call from the app crosses the network. */
  const network = async () => {
    if (!sim.offline) return;
    await later(undefined, delay);
    throw new RepositoryError('offline');
  };
  const withPass = <T extends MemberEvent>(e: T): T => ({ ...e, viewerHasPass: passes.has(e.id) });
  const findBooking = (requestId: string) => {
    for (const [eventId, list] of Object.entries(bookingsByEvent)) {
      const booking = list.find((b) => b.requestId === requestId);
      if (booking) return { eventId, booking };
    }
    return null;
  };
  // --- Status, ETags, alternates and portal launches (M6) -------------------
  /** Each change to an event's bookings gives its body a new ETag (GEL-1021). */
  const bookingVersions = new Map<string, number>();
  const etagOf = (eventId: string) => `W/"${eventId}.${bookingVersions.get(eventId) ?? 0}"`;
  const writeBookings = (eventId: string, list: Booking[]) => {
    bookingsByEvent[eventId] = list;
    bookingVersions.set(eventId, (bookingVersions.get(eventId) ?? 0) + 1);
  };
  const patchBooking = (requestId: string, patch: Partial<Booking>) => {
    const found = findBooking(requestId);
    if (!found) return;
    writeBookings(
      found.eventId,
      bookingsByEvent[found.eventId].map((b) => (b.requestId === requestId ? { ...b, ...patch } : b)),
    );
  };
  const setBookingStatus = (requestId: string, status: Booking['status']) => patchBooking(requestId, { status });
  const bookingReads = new Map<string, { full: number; notModified: number }>();
  const readsOf = (eventId: string) => {
    let reads = bookingReads.get(eventId);
    if (!reads) bookingReads.set(eventId, (reads = { full: 0, notModified: 0 }));
    return reads;
  };
  /** The last body the backend had before Gelatin went slow, per event. */
  const staleBodies = new Map<string, { bookings: Booking[]; etag: string }>();
  const launches = new Map<string, { requestId: string; expiresAt: number; used: boolean }>();
  let launchCount = 0;
  /** Counters the DJ is still working out, by request. */
  const counters = new Map<string, ReturnType<typeof setTimeout> | null>();
  const counterMs = options.counterMs ?? (delay === 0 ? Infinity : COUNTER_MS);
  /** What a DJ asks for when they counter: invented, and decided here, on the fake server. */
  const COUNTER_STEP_CENTS = 13000;
  const landCounter = (requestId: string) => {
    const timer = counters.get(requestId);
    if (timer) clearTimeout(timer);
    counters.delete(requestId);
    const found = findBooking(requestId);
    if (found?.booking.status !== 'negotiating') return;
    patchBooking(requestId, { status: 'reauthorization_required', newOfferCents: found.booking.offerCents + COUNTER_STEP_CENTS });
  };
  const portalBooking = (requestId: string): FakePortalBooking | null => {
    const found = findBooking(requestId);
    if (!found) return null;
    return { eventId: found.eventId, eventName: find(found.eventId)?.fields.name ?? '', booking: { ...found.booking } };
  };
  const newPaymentSession = (target: SessionTarget, totalCents: number): PaymentSession => {
    // A simulated expired session is born in the past.
    const bornExpired = sim.expiredSessions > 0;
    if (bornExpired) sim.expiredSessions -= 1;
    const expiresAt = Date.now() + (bornExpired ? -1000 : SESSION_TTL_MS);
    const clientSecret = `pi_fake_${nextSecret}_secret_${Date.now().toString(36)}${nextSecret++}`;
    sessions.set(clientSecret, { ...target, expiresAt });
    return {
      clientSecret,
      // Not a real key: the fake never talks to a payment provider.
      publishableKey: 'pk_test_fake',
      totalCents,
      merchantDisplayName: 'Memberly',
      expiresAt: new Date(expiresAt).toISOString(),
    };
  };
  const orderView = (o: StoredOrder, payment?: PaymentSession): PassOrder => ({
    orderId: o.orderId,
    status: o.status,
    totalCents: o.totalCents,
    ...(payment ? { payment } : null),
  });
  const settle = (o: StoredOrder) => {
    if (o.status !== 'pending' || !o.paymentConfirmed) return;
    o.status = 'paid';
    const held = (eventPasses.get(o.eventId) ?? []).find((t) => t.id === o.passTypeId);
    if (held) held.heldCount += 1;
    passes.set(o.eventId, held?.name ?? 'Pass');
  };
  const cardPasses = (): CardPass[] =>
    [...passes.entries()]
      .map(([eventId, passName]) => ({ event: allEvents().find((e) => e.id === eventId), passName }))
      .filter((p): p is { event: MemberEvent; passName: string } => !!p.event)
      .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt))
      .map(({ event, passName }) => ({
        eventId: event.id,
        eventName: event.name,
        passName,
        whenLabel: formatEventDate(event.startsAt, event.timeZone),
      }));

  const controls: WorldControls = {
    simulate: (patch) => {
      Object.assign(sim, patch);
      if (!sim.staleBookings) staleBodies.clear();
    },
    confirmPayment: async (clientSecret) => {
      const session = sessions.get(clientSecret);
      if (!session || session.expiresAt <= Date.now()) {
        return later({ status: 'failed' as const, message: 'That checkout expired. Start a fresh one.' }, delay);
      }
      if (session.kind === 'hold') {
        // The hold succeeded: Gelatin tells the DJ and the request reads `requested`.
        if (findBooking(session.requestId)?.booking.status === 'authorization_required') setBookingStatus(session.requestId, 'requested');
      } else {
        const order = orders.get(session.orderId);
        if (order && !order.paymentConfirmed) {
          order.paymentConfirmed = true;
          const wait = sim.slowPassOrder ? slowPassConfirmMs : passConfirmMs;
          // The backend's webhook marks the order paid a moment later.
          if (wait <= 0) settle(order);
          else if (Number.isFinite(wait)) setTimeout(() => settle(order), wait);
        }
      }
      sessions.delete(clientSecret);
      return later({ status: 'succeeded' as const }, delay);
    },
    declinePayment: () => later({ status: 'failed' as const, message: DECLINED_MESSAGE }, delay),
    settlePassOrders: () => orders.forEach(settle),
    requestCount: (eventId) => (bookingsByEvent[eventId] ?? []).length,
    passOrderCount: () => orders.size,
    setStatus: (requestId, status, patch) => patchBooking(requestId, { status, ...patch }),
    playDj: (requestId, action) => {
      const found = findBooking(requestId);
      if (!found) return;
      if (action === 'counter') {
        patchBooking(requestId, { status: 'negotiating', newOfferCents: null });
        counters.set(requestId, Number.isFinite(counterMs) ? setTimeout(() => landCounter(requestId), Math.max(0, counterMs)) : null);
        return;
      }
      const pending = counters.get(requestId);
      if (pending) clearTimeout(pending);
      counters.delete(requestId);
      if (action === 'accept') {
        // An accepted counter is charged at the new price; the total is the server's.
        const { newOfferCents } = found.booking;
        patchBooking(requestId, {
          status: 'confirmed',
          newOfferCents: null,
          ...(newOfferCents != null ? { offerCents: newOfferCents, totalCents: priced(newOfferCents).totalCents } : null),
        });
        return;
      }
      patchBooking(requestId, { status: action === 'pass' ? 'declined' : action === 'expire' ? 'expired' : 'cancelled', newOfferCents: null });
    },
    settleCounters: () => [...counters.keys()].forEach(landCounter),
    bookingFetches: (eventId) => ({ ...readsOf(eventId) }),
    portalLaunchCount: () => launchCount,
    redeemLaunch: (launchUrl) => {
      const launch = launches.get(launchUrl);
      if (!launch || launch.used || launch.expiresAt <= Date.now()) return null;
      launch.used = true;
      return portalBooking(launch.requestId);
    },
    portalBooking,
  };

  const offers = (eventId: string) => (offersByEvent[eventId] ??= []);
  const waitlist = new Set<string>();

  /** The night and city of a stored event. Talent is always read through this, never from the caller. */
  const nightOf = (eventId: string) => {
    const e = find(eventId);
    if (!e) throw new Error(`No event ${eventId}`);
    const { date, city } = e.fields;
    if (!date || !city) throw new Error('Set the night and the city first');
    return { date, city: city.name };
  };
  /** DJs open on the event's night in its city, before budget and genre. */
  const openDjs = (eventId: string): CatalogDj[] => {
    const { date, city } = nightOf(eventId);
    const held = new Set(
      (bookingsByEvent[eventId] ?? []).filter((b) => OPEN_BOOKING.includes(b.status)).map((b) => b.dj.id),
    );
    return sampleCatalog.filter(
      (dj) => dj.city === city && !dj.takenOn?.includes(date) && !refusedNights.get(dj.id)?.has(date) && !held.has(dj.id),
    );
  };
  /** Catalog reads: fail, stall or answer, as the simulation says. */
  const catalog = async <T,>(read: () => T, firstPage = false): Promise<T> => {
    const mode = options.talentMode?.() ?? devTalentMode;
    if (mode === 'unavailable') {
      await later(undefined, delay);
      throw new CatalogUnavailableError();
    }
    // Only the first page stalls, so the skeletons show and paging stays quick.
    if (mode === 'loading' && firstPage) await later(undefined, TALENT_LOADING_HOLD_MS);
    // A touch slower than the rest, so the paging row is visible.
    return later(read(), delay * 2);
  };

  const organizerRow = (e: StoredEvent): OrganizerEvent => ({
    id: e.id,
    name: e.fields.name,
    cover: e.fields.cover,
    dateLabel: e.fields.date ? formatIsoDate(e.fields.date) : 'No date yet',
    salesLabel: e.status === 'draft' ? 'Draft' : (e.salesLabel ?? 'On sale'),
    status: e.status,
    bookings: bookingsByEvent[e.id] ?? [],
    addedDjCount: offers(e.id).length,
  });

  // --- Communities and passes (GEL-1056, GEL-1057) --------------------------
  const find = (id: string) => events.find((e) => e.id === id);
  /** The community an event belongs to: the organizer's own event, or one in the shared catalog. */
  const communityOfEvent = (eventId: string) => find(eventId)?.communityId ?? allEvents().find((e) => e.id === eventId)?.communityId ?? null;
  const communityOfPass = (p: StoredPass) => p.communityId ?? (p.eventId ? communityOfEvent(p.eventId) : null);
  const isMember = (communityId: string | null) =>
    !!communityId && (!!ownedById(communityId) || seed.memberships.some((m) => m.communityId === communityId && m.status === 'active'));
  /** A community's public page (GET /app/communities/:id). Tiers and prices are worded here, as the server will. */
  const communityPageOf = (id: string): CommunityPage | null => {
    const mine = ownedById(id);
    const base = mine?.community ?? sampleCommunities.find((c) => c.id === id);
    if (!base) return null;
    const page = SAMPLE_COMMUNITY_PAGES[id];
    const stored = mine ? (communityPasses.get(id) ?? []) : seedCommunityPasses(id);
    const tiers = stored.length
      ? stored.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name, priceCents: p.priceCents, included: p.included }))
      : (page?.tiers ?? []);
    const whole = (cents: number) => formatCents(cents).replace(/\.00$/, '');
    const priceOf = (cents: number | null) => (cents ? `${whole(cents)} a month` : 'Free');
    const paid = tiers.map((t) => t.priceCents ?? 0).filter((cents) => cents > 0);
    const joinLine = tiers.length === 0 || paid.length < tiers.length ? 'Free to join' : `Memberships from ${whole(Math.min(...paid))} a month`;
    const membership = seed.memberships.find((m) => m.communityId === id && m.status === 'active');
    const tags = [base.type, ...(base.categories ?? []), ...(base.genres ?? []), ...(base.vibes ?? []), ...(base.customTags ?? [])].filter(
      (t, i, all): t is string => !!t && all.indexOf(t) === i,
    );
    return {
      community: { ...base, tagline: base.tagline ?? page?.tagline },
      location: base.location ?? page?.location ?? base.city,
      verified: page?.verified ?? false,
      about: base.description ?? page?.about ?? '',
      tags,
      links: base.links
        ? Object.entries(base.links).flatMap(([network, url]) => (url ? [{ network: network as SocialNetwork, url }] : []))
        : (page?.links ?? []),
      gallery: base.gallery ?? (page?.gallery ?? []).map((k) => img[k]),
      memberships: tiers.map((t) => ({ id: t.id, name: t.name, price: priceOf(t.priceCents), included: t.included })),
      joinLine,
      viewerMembership: mine ? { tierLabel: 'Owner', owner: true } : membership ? { tierLabel: membership.tierLabel, owner: false } : null,
      upcoming: allEvents()
        .filter((e) => e.communityId === id)
        .map(withPass)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    };
  };

  /**
   * The event page's details, as the server would send them. Access and the
   * price wording come from the event's passes on sale: a members-free pass
   * makes it free for members; with no guest pass it's members only.
   */
  const eventPageOf = (e: MemberEvent): EventPageDetails => {
    const page = SAMPLE_EVENT_PAGES[e.id] ?? defaultEventPage(e.description, e.neighborhood, e.city);
    const onSale = (eventPasses.get(e.id) ?? []).filter((p) => p.active && sellable(p));
    const membersFree = onSale.some((p) => p.freeForMembers);
    const guestPrices = onSale.filter((p) => !p.freeForMembers && (p.priceCents ?? 0) > 0).map((p) => p.priceCents!);
    const from = guestPrices.length > 0 ? Math.min(...guestPrices) : null;
    const whole = (cents: number) => formatCents(cents).replace(/\.00$/, '');
    const access: EventAccess = membersFree ? (from == null ? 'members-only' : 'free-for-members') : 'open';
    const price =
      access === 'members-only'
        ? { headline: 'Free', line: 'Members only · free for members', free: true }
        : access === 'free-for-members'
          ? { headline: whole(from!), line: `Free for members · guests from ${whole(from!)}`, free: false }
          : from == null
            ? { headline: 'Free', line: 'Free to attend', free: true }
            : { headline: whole(from), line: `Passes from ${whole(from)}`, free: false };
    const home = ownedById(e.communityId)?.community ?? sampleCommunities.find((c) => c.id === e.communityId);
    return {
      access,
      sales: page.salesEnded ? 'ended' : 'on-sale',
      host: {
        communityId: e.communityId,
        name: e.communityName,
        logo: home?.logo ?? home?.cover ?? null,
        verified: page.verified,
        about: page.hostAbout,
      },
      viewerIsMember: isMember(e.communityId),
      venue: page.venue,
      price,
      going: {
        people: page.going.names.map((name) => ({ name, initials: name.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2) })),
        othersCount: page.going.othersCount,
      },
      about: page.about,
      memberPerks: page.memberPerks,
    };
  };
  /**
   * A priced pass can be sold only once its community's Stripe account is
   * connected. Nothing in this build connects one, so a new paid pass saves
   * and waits. Sample passes, and other people's events, are on sale as before.
   */
  const sellable = (p: StoredPass) => p.priceCents == null || p.seeded || (ownedById(communityOfPass(p))?.stripeConnected ?? true);
  /** A pass as a member meets it in Get a pass. */
  const passTypeOf = (p: StoredPass): PassType => {
    // A free members' pass is anyone's to claim, as it always was here; a priced one is free only to the community's members.
    const membersFree = p.freeForMembers && (p.priceCents == null || isMember(communityOfPass(p)));
    return {
      id: p.id,
      name: p.name,
      priceCents: membersFree ? 0 : (p.priceCents ?? 0),
      included: p.included,
      soldOut: p.soldOut || (p.limit != null && p.heldCount >= p.limit),
      freeForMembers: membersFree,
    };
  };
  const organizerPass = (p: StoredPass): OrganizerPass => ({
    id: p.id,
    scope: p.scope,
    communityId: communityOfPass(p) ?? '',
    eventId: p.eventId,
    name: p.name,
    priceCents: p.priceCents,
    included: p.included,
    limit: p.limit,
    freeForMembers: p.freeForMembers,
    active: p.active,
    heldCount: p.heldCount,
    sellable: sellable(p),
  });
  /** Only a community's organizer sees or changes its passes; to anyone else they do not exist (404). */
  const ownEventPasses = (eventId: string) => {
    const e = find(eventId);
    if (!e || !ownedById(e.communityId)) throw new RepositoryError('not_found');
    let list = eventPasses.get(eventId);
    if (!list) eventPasses.set(eventId, (list = []));
    return list;
  };
  const ownCommunityPasses = (communityId: string) => {
    if (!ownedById(communityId)) throw new RepositoryError('not_found');
    let list = communityPasses.get(communityId);
    if (!list) communityPasses.set(communityId, (list = []));
    return list;
  };
  const findOwnPass = (passId: string) => {
    for (const o of owned) {
      const lists = [ownCommunityPasses(o.community.id), ...events.filter((e) => e.communityId === o.community.id).map((e) => ownEventPasses(e.id))];
      for (const list of lists) {
        const pass = list.find((p) => p.id === passId);
        if (pass) return { pass, list };
      }
    }
    throw new RepositoryError('not_found');
  };
  const validName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > NAME_MAX) throw new RepositoryError('invalid_input');
    return trimmed;
  };
  /** Zero is free: stored as no price. */
  const validPrice = (cents: number | null | undefined) => {
    if (cents == null || cents === 0) return null;
    if (!Number.isInteger(cents) || cents < 0) throw new RepositoryError('invalid_input');
    return cents;
  };
  const validLimit = (limit: number | null | undefined) => {
    if (limit == null) return null;
    if (!Number.isInteger(limit) || limit <= 0) throw new RepositoryError('invalid_input');
    return limit;
  };
  /** The save happened; the answer never arrives. A retry with the same key finds what was saved. */
  const lostResponse = async () => {
    if (!sim.timeoutNextSave) return;
    sim.timeoutNextSave = false;
    await later(undefined, delay);
    throw new RepositoryError('timeout');
  };
  /** Stripe is asked for once anything in the community has a price. */
  const tasksOf = (o: Owned): SetupTask[] => {
    const priced = [
      ...(communityPasses.get(o.community.id) ?? []),
      ...events.filter((e) => e.communityId === o.community.id).flatMap((e) => eventPasses.get(e.id) ?? []),
    ].some((p) => p.priceCents != null && !p.seeded);
    const asksForStripe = o.setupTasks.some((t) => t.id === CONNECT_STRIPE_TASK.id);
    return priced && !asksForStripe && !o.stripeConnected ? [...o.setupTasks, CONNECT_STRIPE_TASK] : o.setupTasks;
  };

  const overview = (o: Owned): CommunityOverview => ({
    community: o.community,
    ...o.stats,
    setupTasks: tasksOf(o),
    upcoming: events
      .filter((e) => e.communityId === o.community.id)
      .sort((a, b) => (a.fields.date ?? '9999').localeCompare(b.fields.date ?? '9999'))
      .map(organizerRow),
  });

  return {
    fake: controls,
    now: () => DEMO_NOW,

    getPreferences: () => later(preferences, delay),
    putPreferences: (next) => {
      preferences = next;
      return later(preferences, delay);
    },

    explore: (query) =>
      later(runExplore({ communities: communities(), events: allEvents().map(withPass) }, query, viewer().city), delay),

    getCard: () => {
      const { memberships } = seed;
      const card: MemberCard = {
        name: `${viewer().firstName} ${viewer().lastName}`.trim(),
        communityCount: memberships.filter((m) => m.status === 'active').length,
        memberships,
        passes: cardPasses(),
        // Short-lived, as the door expects. Real clock: the demo clock only drives event grouping.
        qr: { token: `memberly:card:${viewer().id}:${Date.now().toString(36)}`, expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString() },
      };
      return later(card, delay);
    },

    getViewer: () => later(viewer(), delay),
    getTonight: (city) =>
      later(
        sampleEvents
          .filter((e) => e.city === city)
          .map(withPass)
          .sort((a, b) => Number(b.viewerHasPass) - Number(a.viewerHasPass)),
        delay,
      ),
    getCommunityPage: (id) => later(communityPageOf(id), delay),
    getReferrals: () => {
      const { firstName, lastName } = seed.viewer;
      const code = `${firstName}${lastName}`.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const result: Referrals = { code, link: `https://withmemberly.com/r/${code.toLowerCase()}`, people: [...seed.referred] };
      return later(result, delay);
    },
    getEvent: (id) => {
      const e = allEvents().find((x) => x.id === id);
      return later(e ? { ...withPass(e), details: eventPageOf(e) } : null, delay);
    },
    getMyEvents: (scope) => {
      // A pass outranks going or saved, and puts the event on the list.
      const mine: MyEvent[] = allEvents()
        .filter((e) => relations[e.id] || passes.has(e.id))
        .map((e) => ({ ...withPass(e), relation: passes.has(e.id) ? 'pass' : relations[e.id] }));
      const now = DEMO_NOW.getTime();
      const ended = (e: MyEvent) => new Date(e.endsAt).getTime() < now;
      const result =
        scope === 'past'
          ? mine.filter(ended)
          : scope === 'saved'
            ? mine.filter((e) => e.relation === 'saved' && !ended(e))
            : mine.filter((e) => !ended(e));
      return later(result, delay);
    },
    getTopCommunities: (city) => later(communities().filter((c) => c.city === city).slice(0, 4), delay),
    getOrganizedCommunities: () => later(owned.map((o) => ({ ...o.community })), delay),
    getCommunityOverview: (communityId) => {
      const o = ownedById(communityId);
      return later(o ? overview(o) : null, delay);
    },

    getCities: () => later(sampleCities, delay),
    getOrganizerEvent: (id) => {
      const e = find(id);
      return later(e ? detail(e) : null, delay);
    },
    saveEvent: async ({ id, communityId, fields, publish }) => {
      let e = id ? find(id) : undefined;
      if (e && fields.date !== e.fields.date) {
        // The date is part of every offer. A confirmed DJ, or an offer still open, holds the event to it (GEL-1025).
        const list = bookingsByEvent[e.id] ?? [];
        const confirmed = list.find((b) => b.status === 'confirmed');
        const open = list.find((b) => b.status !== 'confirmed' && !ENDED_BOOKING.includes(b.status));
        const blocker = confirmed ?? open;
        if (blocker) {
          await later(undefined, delay);
          throw new RepositoryError(confirmed ? 'confirmed_booking' : 'open_bookings', { requestId: blocker.requestId });
        }
      }
      if (!e) {
        e = { id: `e_new_${nextId++}`, communityId, status: 'draft', salesLabel: null, fields };
        events.push(e);
      }
      e.fields = { ...fields, name: fields.name.trim() || 'Untitled event' };
      e.status = publish ? 'published' : 'draft';
      return later(detail(e), delay);
    },

    getEventBookings: async (eventId, { ifNoneMatch = null } = {}) => {
      if (sim.failBookings) {
        await later(undefined, delay);
        throw new RepositoryError('timeout');
      }
      const current = { bookings: [...(bookingsByEvent[eventId] ?? [])], etag: etagOf(eventId) };
      if (sim.staleBookings) {
        // Gelatin is slow: the backend answers with the last body it had, whatever has happened since.
        if (!staleBodies.has(eventId)) staleBodies.set(eventId, current);
        readsOf(eventId).full += 1;
        return later({ ...staleBodies.get(eventId)!, stale: true }, delay);
      }
      if (ifNoneMatch && ifNoneMatch === current.etag) {
        readsOf(eventId).notModified += 1;
        return later({ notModified: true as const }, delay);
      }
      readsOf(eventId).full += 1;
      return later(current, delay);
    },
    getDraftOffers: (eventId) => later([...offers(eventId)], delay),
    addDraftOffer: (eventId, dj) => {
      if (!offers(eventId).some((o) => o.dj.id === dj.id)) {
        // The rate comes from the catalog, not from what the caller sent.
        const row = sampleCatalog.find((c) => c.id === dj.id);
        const listed = row ? publicDj(row) : dj;
        offersByEvent[eventId] = [...offers(eventId), { dj: listed, offerCents: listed.publishedRateCents, note: '' }];
      }
      return later([...offers(eventId)], delay);
    },
    updateDraftOffer: (eventId, djId, patch) => {
      offersByEvent[eventId] = offers(eventId).map((o) => (o.dj.id === djId ? { ...o, ...patch } : o));
      return later([...offersByEvent[eventId]], delay);
    },
    removeDraftOffer: (eventId, djId) => {
      offersByEvent[eventId] = offers(eventId).filter((o) => o.dj.id !== djId);
      return later([...offersByEvent[eventId]], delay);
    },

    getTalent: (eventId, { budget = null, genre = null, cursor = null } = {}) =>
      catalog((): TalentPage => {
        const { city } = nightOf(eventId);
        if (!TALENT_CITIES.includes(city)) return { djs: [], nextCursor: null, citySupported: false, total: 0 };
        const matches = openDjs(eventId).filter(
          (dj) => (!budget || dj.band === budget) && (!genre || dj.genres.includes(genre)),
        );
        // The cursor is opaque to the app; here it is just where the next page starts.
        const start = cursor ? Number(cursor.replace('after:', '')) || 0 : 0;
        const end = start + TALENT_PAGE_SIZE;
        return {
          djs: matches.slice(start, end).map(publicDj),
          nextCursor: end < matches.length ? `after:${end}` : null,
          citySupported: true,
          total: matches.length,
        };
      }, !cursor),
    getTalentGenres: (eventId, budget) =>
      catalog(() => {
        const { city } = nightOf(eventId);
        const inBand = sampleCatalog.filter((dj) => dj.city === city && (!budget || dj.band === budget));
        return [...new Set(inBand.flatMap((dj) => dj.genres))];
      }),
    joinCityWaitlist: (city) => {
      // Idempotent: asking twice for the same city is one entry.
      waitlist.add(city);
      return later(undefined, delay);
    },

    quoteOffer: async (_eventId, _djId, offerCents) => {
      await network();
      if (!Number.isInteger(offerCents) || offerCents <= 0) throw new RepositoryError('invalid_offer');
      return later({ offerCents, ...priced(offerCents) }, delay);
    },
    createOffer: async (eventId, { djId, offerCents, note, clientOfferId }) => {
      await network();
      const key = `${eventId}:${djId}:${clientOfferId}`;
      let requestId = requestsByKey.get(key);
      if (!requestId) {
        if (!Number.isInteger(offerCents) || offerCents <= 0) throw new RepositoryError('invalid_offer');
        if (!find(eventId)) throw new RepositoryError('not_found');
        const { date } = nightOf(eventId);
        const row = sampleCatalog.find((c) => c.id === djId);
        const dj = row ? publicDj(row) : offers(eventId).find((o) => o.dj.id === djId)?.dj;
        if (!dj) throw new RepositoryError('not_found');
        if (sim.djTakenNext || takenOnSend.has(djId) || row?.takenOn?.includes(date) || refusedNights.get(djId)?.has(date)) {
          sim.djTakenNext = false;
          // Nothing is stored and no reason is ever given.
          refusedNights.set(djId, new Set([...(refusedNights.get(djId) ?? []), date]));
          await later(undefined, delay);
          throw new RepositoryError('dj_unavailable');
        }
        const open = (bookingsByEvent[eventId] ?? []).find((b) => b.dj.id === djId && OPEN_BOOKING.includes(b.status));
        if (open) throw new RepositoryError('offer_open', { requestId: open.requestId });
        requestId = `br_${dj.id.replace(/^dj_/, '')}_${nextId++}`;
        const booking: Booking = {
          requestId,
          dj,
          status: 'authorization_required',
          offerCents,
          totalCents: priced(offerCents).totalCents,
          note,
          setTime: '',
        };
        writeBookings(eventId, [...(bookingsByEvent[eventId] ?? []), booking]);
        // The offer is sent, so it is no longer a draft.
        offersByEvent[eventId] = offers(eventId).filter((o) => o.dj.id !== djId);
        requestsByKey.set(key, requestId);
      }
      if (sim.timeoutNextOffer) {
        // The request exists, but the app never hears back.
        sim.timeoutNextOffer = false;
        await later(undefined, delay);
        throw new RepositoryError('timeout');
      }
      return later({ ...findBooking(requestId)!.booking }, delay);
    },
    createPaymentSession: async (requestId) => {
      await network();
      const found = findBooking(requestId);
      if (!found) throw new RepositoryError('not_found');
      const { status, totalCents } = found.booking;
      if (status !== 'authorization_required' && status !== 'reauthorization_required') throw new RepositoryError('not_payable');
      return later(newPaymentSession({ kind: 'hold', requestId }, totalCents), delay);
    },

    getAlternates: async (requestId) => {
      const found = findBooking(requestId);
      if (!found) throw new RepositoryError('not_found');
      // Open that night in that city, minus the DJ this booking was with. Never why they passed.
      return catalog(() =>
        sim.noAlternates
          ? []
          : openDjs(found.eventId)
              .filter((dj) => dj.id !== found.booking.dj.id)
              .map(publicDj),
      );
    },
    createPortalLaunch: async (requestId) => {
      await network();
      const found = findBooking(requestId);
      if (!found) throw new RepositoryError('not_found');
      // Gelatin's portal opens only once a card hold exists.
      if (found.booking.status === 'authorization_required') throw new RepositoryError('portal_unavailable');
      const bornExpired = sim.expiredLaunches > 0;
      if (bornExpired) sim.expiredLaunches -= 1;
      const expiresAt = Date.now() + (bornExpired ? -1000 : LAUNCH_TTL_MS);
      launchCount += 1;
      const launch: PortalLaunch = {
        launchUrl: `${TEST_PORTAL_ORIGIN}/launch/lt_${launchCount}_${Date.now().toString(36)}`,
        expiresAt: new Date(expiresAt).toISOString(),
      };
      launches.set(launch.launchUrl, { requestId, expiresAt, used: false });
      return later(launch, delay);
    },

    getPassTypes: async (eventId) => {
      await network();
      // What is on sale: turned on, and sellable.
      return later((eventPasses.get(eventId) ?? []).filter((p) => p.active && sellable(p)).map(passTypeOf), delay);
    },
    createPassOrder: async (eventId, { passTypeId, quantity, idempotencyKey, expectedPriceCents }) => {
      await network();
      const existing = orders.get(ordersByKey.get(idempotencyKey) ?? '');
      if (existing) {
        // The same order and the same payment. Once paid for, there is nothing left to pay.
        const unpaid = existing.status === 'pending' && !existing.paymentConfirmed && existing.clientSecret;
        const session = unpaid ? sessions.get(existing.clientSecret!) : undefined;
        const payment =
          unpaid && session && session.expiresAt > Date.now()
            ? {
                clientSecret: existing.clientSecret!,
                publishableKey: 'pk_test_fake',
                totalCents: existing.totalCents,
                merchantDisplayName: 'Memberly',
                expiresAt: new Date(session.expiresAt).toISOString(),
              }
            : unpaid
              ? newPaymentSession({ kind: 'pass', orderId: existing.orderId }, existing.totalCents)
              : undefined;
        if (payment) existing.clientSecret = payment.clientSecret;
        return later(orderView(existing, payment), delay);
      }
      const stored = (eventPasses.get(eventId) ?? []).find((t) => t.id === passTypeId && t.active && sellable(t));
      if (!stored) throw new RepositoryError('not_found');
      if (sim.soldOutNext) {
        sim.soldOutNext = false;
        stored.soldOut = true;
      }
      if (sim.priceChangeNext && !passTypeOf(stored).freeForMembers) {
        sim.priceChangeNext = false;
        stored.priceCents = (stored.priceCents ?? 0) + 500;
      }
      const type = passTypeOf(stored);
      if (type.soldOut) {
        await later(undefined, delay);
        throw new RepositoryError('pass_unavailable');
      }
      // Free to this person: a members' pass, or a pass with no price. There is nothing to pay.
      const free = type.freeForMembers || type.priceCents === 0;
      const totalCents = free ? 0 : type.priceCents * Math.max(1, quantity);
      if (!free && expectedPriceCents !== type.priceCents) {
        await later(undefined, delay);
        throw new RepositoryError('price_changed', { totalCents });
      }
      const order: StoredOrder = {
        orderId: `po_${nextId++}`,
        eventId,
        passTypeId,
        status: 'pending',
        totalCents,
        clientSecret: null,
        paymentConfirmed: false,
      };
      orders.set(order.orderId, order);
      ordersByKey.set(idempotencyKey, order.orderId);
      if (free) {
        // Claimed: no payment step.
        order.paymentConfirmed = true;
        settle(order);
        return later(orderView(order), delay);
      }
      const payment = newPaymentSession({ kind: 'pass', orderId: order.orderId }, totalCents);
      order.clientSecret = payment.clientSecret;
      return later(orderView(order, payment), delay);
    },
    getPassOrder: async (orderId) => {
      await network();
      const order = orders.get(orderId);
      if (!order) throw new RepositoryError('not_found');
      return later(orderView(order), delay);
    },

    createCommunity: async ({ name, tagline, description, country, state, city, logo, banner, gallery, tags, links, membership, idempotencyKey }) => {
      await network();
      const key = `community:${idempotencyKey}`;
      let id = savedByKey.get(key);
      if (!id) {
        const trimmed = validName(name);
        const line = tagline.trim();
        const about = description.trim();
        const cityOk = city == null || sampleCities.some((c) => c.name === city);
        if (!line || line.length > TAGLINE_MAX || !about || about.length > DESCRIPTION_MAX || !country.trim() || !cityOk) {
          throw new RepositoryError('invalid_input');
        }
        if (!logo?.uri || !banner?.uri || gallery.length > GALLERY_MAX || tags.length > TAG_LIMIT) throw new RepositoryError('invalid_input');
        // Known tags are filed where Explore filters on them; the rest are kept as written.
        const filed = fileTags(tags);
        const tiers =
          membership.kind === 'paid'
            ? membership.tiers.map((t) => ({ name: validName(t.name), priceCents: validPrice(t.monthlyPriceCents), included: (t.included ?? '').trim() }))
            : [];
        // A paid membership has at least one tier, each with a price ("paid at $0" is not a thing) and its own name.
        const names = new Set(tiers.map((t) => t.name.toLowerCase()));
        if (membership.kind === 'paid' && (tiers.length === 0 || tiers.length > MEMBERSHIP_TIER_MAX || names.size !== tiers.length)) {
          throw new RepositoryError('invalid_input');
        }
        if (tiers.some((t) => t.priceCents == null || t.included.length > INCLUDED_MAX)) throw new RepositoryError('invalid_input');
        id = `c_new_${nextId++}`;
        owned.push({
          // The caller is the owner, and so far the only member.
          community: {
            id,
            name: trimmed,
            city: city ?? state ?? country,
            location: [city, state, country].filter(Boolean).join(', '),
            gallery: gallery.map((p) => ({ uri: p.uri })),
            links: { ...links },
            memberCount: 1,
            cover: banner,
            logo,
            tagline: line,
            description: about,
            ...filed,
            isOwner: true,
          },
          setupTasks: [],
          stats: { revenueMonthCents: 0, newMembersMonth: 0, churnPercent: null, sampleNumbers: false },
          stripeConnected: false,
        });
        communityPasses.set(
          id,
          tiers.map((t) => ({
            id: `cp_${nextId++}`,
            scope: 'community' as const,
            communityId: id!,
            eventId: null,
            name: t.name,
            priceCents: t.priceCents,
            included: t.included,
            limit: null,
            freeForMembers: false,
            active: true,
            heldCount: 0,
            soldOut: false,
            seeded: false,
          })),
        );
        savedByKey.set(key, id);
      }
      await lostResponse();
      const made = ownedById(id)!;
      const result: CreateCommunityResult = { community: { ...made.community }, setupTasks: tasksOf(made) };
      return later(result, delay);
    },
    getCommunityPasses: async (communityId) => {
      await network();
      return later(ownCommunityPasses(communityId).map(organizerPass), delay);
    },
    createCommunityPass: async (communityId, { name, monthlyPriceCents, included, memberLimit, idempotencyKey }) => {
      await network();
      const list = ownCommunityPasses(communityId);
      const key = `community-pass:${communityId}:${idempotencyKey}`;
      let pass = list.find((p) => p.id === savedByKey.get(key));
      if (!pass) {
        pass = {
          id: `cp_${nextId++}`,
          scope: 'community',
          communityId,
          eventId: null,
          name: validName(name),
          priceCents: validPrice(monthlyPriceCents),
          included: included.trim(),
          limit: validLimit(memberLimit),
          freeForMembers: false,
          active: true,
          heldCount: 0,
          soldOut: false,
          seeded: false,
        };
        list.push(pass);
        savedByKey.set(key, pass.id);
      }
      await lostResponse();
      return later(organizerPass(pass), delay);
    },
    getOrganizerEventPasses: async (eventId) => {
      await network();
      return later(ownEventPasses(eventId).map(organizerPass), delay);
    },
    createEventPass: async (eventId, { name, priceCents, included, quantity, freeForMembers, idempotencyKey }) => {
      await network();
      const list = ownEventPasses(eventId);
      const key = `event-pass:${eventId}:${idempotencyKey}`;
      let pass = list.find((p) => p.id === savedByKey.get(key));
      if (!pass) {
        pass = {
          id: `pt_${nextId++}`,
          scope: 'event',
          communityId: null,
          eventId,
          name: validName(name),
          priceCents: validPrice(priceCents),
          included: included.trim(),
          limit: validLimit(quantity),
          freeForMembers,
          active: true,
          heldCount: 0,
          soldOut: false,
          seeded: false,
        };
        list.push(pass);
        savedByKey.set(key, pass.id);
      }
      await lostResponse();
      return later(organizerPass(pass), delay);
    },
    updatePass: async (passId, patch) => {
      await network();
      const { pass } = findOwnPass(passId);
      // Check everything before anything changes.
      const next = {
        ...(patch.name !== undefined ? { name: validName(patch.name) } : null),
        ...(patch.priceCents !== undefined ? { priceCents: validPrice(patch.priceCents) } : null),
        ...(patch.limit !== undefined ? { limit: validLimit(patch.limit) } : null),
        ...(patch.included !== undefined ? { included: patch.included.trim() } : null),
        ...(patch.freeForMembers !== undefined && pass.scope === 'event' ? { freeForMembers: patch.freeForMembers } : null),
        ...(patch.active !== undefined ? { active: patch.active } : null),
      };
      Object.assign(pass, next);
      await lostResponse();
      return later(organizerPass(pass), delay);
    },
    deletePass: async (passId) => {
      await network();
      const { pass, list } = findOwnPass(passId);
      // People hold it: it can be turned off, never removed from under them.
      if (pass.heldCount > 0) throw new RepositoryError('pass_held');
      list.splice(list.indexOf(pass), 1);
      return later(undefined, delay);
    },
  };
}

/** A stable viewer id for someone who creates an account with an email that is not a test account's. */
function adHocViewerId(email: string): string {
  return `u_new_${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

type AdHocProfile = Pick<Viewer, 'id' | 'firstName' | 'lastName' | 'initials' | 'email'>;

/**
 * The fake repository: sample data standing in for Memberly's backend.
 *
 * It holds one world per account (see testAccounts.ts) and answers every call
 * from the world of whoever is signed in, so nothing one account does or sees
 * reaches another. Worlds are made the first time an account is used and last
 * until the app reloads. Before anyone signs in it answers as the existing
 * organizer, the sample person the data has always belonged to.
 *
 * In memory and per instance: milestone 8 replaces this with Memberly's backend.
 */
export function createFakeRepository(options: FakeRepositoryOptions = {}): FakeRepository {
  const delay = options.delayMs ?? 250;
  const storage = options.storage ?? createMemoryStorage();
  // In memory: signing out stops the dev flag from signing straight back in until the next reload.
  let autoSignIn = options.signedIn ?? false;
  let pending: { email: string; intent: CodeIntent; name?: string } | null = null;
  let nextToken = 1;

  const worlds = new Map<string, World>();
  /** People who created an account with some other email, by viewer id. */
  const profiles = new Map<string, AdHocProfile>();
  /** Who has finished (or skipped) onboarding during this run of the app. */
  const onboarded = new Map<string, boolean>();
  let currentId = DEFAULT_TEST_ACCOUNT.viewerId;
  // Resolved once it is known who, if anyone, is signed in.
  let sessionKnown = () => {};
  const untilSessionKnown: Promise<void> | null = options.holdUntilSession ? new Promise((resolve) => (sessionKnown = resolve)) : null;

  const worldFor = (viewerId: string): World => {
    let world = worlds.get(viewerId);
    if (!world) {
      const account = testAccountById(viewerId);
      // Anyone else starts from the new-user template under their own name: nothing joined, nothing bought.
      world = createWorld(options, account ? seedWorld(account) : seedWorld(NEW_ACCOUNT_TEMPLATE, profiles.get(viewerId) ?? { id: viewerId }));
      worlds.set(viewerId, world);
    }
    return world;
  };
  const world = () => worldFor(currentId);

  const newSession = (viewerId: string, email: string, onboardingDone: boolean): Session => ({
    token: `fake.${Date.now().toString(36)}.${nextToken++}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    viewerId,
    email,
    onboardingDone,
  });
  const store = async (session: Session) => {
    await storage.set(SESSION_KEY, JSON.stringify(session));
    currentId = session.viewerId;
    onboarded.set(session.viewerId, session.onboardingDone);
    sessionKnown();
    return session;
  };
  const readSession = async (): Promise<Session | null> => {
    const raw = await storage.get(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  };
  const signInTo = (account: TestAccount, email = account.email) =>
    store(newSession(account.viewerId, email, onboarded.get(account.viewerId) ?? account.onboardingDone));

  const session: Pick<MemberlyRepository, SessionMethod> = {
    getSession: async () => {
      let stored = await readSession();
      if (stored) {
        // Someone who made their own account: their name comes back with the session.
        if (!testAccountById(stored.viewerId) && !profiles.has(stored.viewerId)) {
          try {
            const profile = JSON.parse((await storage.get(PROFILE_KEY)) ?? 'null') as AdHocProfile | null;
            if (profile?.id === stored.viewerId) profiles.set(profile.id, profile);
          } catch {
            // No stored name: they open as a new member.
          }
        }
        currentId = stored.viewerId;
        onboarded.set(stored.viewerId, stored.onboardingDone);
      }
      if (!stored && autoSignIn) stored = await store(newSession(DEFAULT_TEST_ACCOUNT.viewerId, DEFAULT_TEST_ACCOUNT.email, true));
      sessionKnown();
      return later(stored, delay);
    },
    sendCode: ({ email, intent, name }) => {
      // A resend from Verify keeps the name Create account sent first.
      const keepName = pending?.email === email.trim() ? pending.name : undefined;
      pending = { email: email.trim(), intent, name: name ?? keepName };
      return later({ email: email.trim(), resendAfterSeconds: RESEND_SECONDS }, delay);
    },
    verifyCode: async (email, code) => {
      if (code === FAKE_CODES.expired) return later({ ok: false as const, reason: 'expired' as const, resendAfterSeconds: RESEND_SECONDS }, delay);
      if (code !== FAKE_CODES.success) return later({ ok: false as const, reason: 'wrong' as const }, delay);
      const intent = pending?.intent;
      const name = pending?.name?.trim();
      pending = null;
      // One of the test accounts, by its email, from either sheet.
      const account = testAccountByEmail(email);
      if (account) {
        await storage.remove(PROFILE_KEY);
        const signedIn = await signInTo(account);
        return later({ ok: true as const, session: signedIn, isNewUser: !signedIn.onboardingDone }, delay);
      }
      if (intent === 'sign-up') {
        // Create account with any other email: a new member under that name, with preferences still to pick.
        const viewerId = adHocViewerId(email);
        const profile: AdHocProfile = { id: viewerId, ...splitName(name || 'New member'), email: email.trim() };
        profiles.set(viewerId, profile);
        // A fresh account each time, as a real sign-up would be.
        worlds.delete(viewerId);
        await storage.set(PROFILE_KEY, JSON.stringify(profile));
        const signedIn = await store(newSession(viewerId, email.trim(), false));
        return later({ ok: true as const, session: signedIn, isNewUser: true }, delay);
      }
      // Sign in with any other email: a returning member, the existing organizer.
      await storage.remove(PROFILE_KEY);
      const signedIn = await store(newSession(DEFAULT_TEST_ACCOUNT.viewerId, email.trim(), true));
      return later({ ok: true as const, session: signedIn, isNewUser: false }, delay);
    },
    signInWithProvider: async () => {
      // The fake skips the native Google / Apple sheet and signs in the existing organizer.
      await storage.remove(PROFILE_KEY);
      return later(await store(newSession(DEFAULT_TEST_ACCOUNT.viewerId, DEFAULT_TEST_ACCOUNT.email, true)), delay);
    },
    completeOnboarding: async () => {
      const current = (await readSession()) ?? newSession(currentId, (await world().getViewer()).email, true);
      return later(await store({ ...current, onboardingDone: true }), delay);
    },
    signOut: async () => {
      autoSignIn = false;
      await storage.remove(SESSION_KEY);
      await storage.remove(PROFILE_KEY);
      // The world stays on the person who just left until someone signs in: a screen still on its way
      // out can only ever read their own data again, never the next person's or the sample organizer's.
      return later(undefined, delay);
    },
  };

  // Every other call goes to the world of whoever is signed in at the moment it is made.
  const first = world();
  const forward = <T extends object>(sample: T, target: () => T): T =>
    Object.fromEntries(
      Object.keys(sample).map((name) => [
        name,
        (...args: unknown[]) => (target()[name as keyof T] as (...a: unknown[]) => unknown)(...args),
      ]),
    ) as T;
  const { fake: firstControls, ...firstData } = first;
  const direct = forward(firstData, () => world() as typeof firstData);
  // Held calls wait for the session, then go to that person's world. `now` is the clock, not data, and stays immediate.
  const data: typeof firstData = untilSessionKnown
    ? {
        ...(Object.fromEntries(
          Object.keys(direct).map((name) => [
            name,
            (...args: unknown[]) => untilSessionKnown.then(() => (direct[name as keyof typeof direct] as (...a: unknown[]) => unknown)(...args)),
          ]),
        ) as unknown as typeof firstData),
        now: direct.now,
      }
    : direct;
  const controls: FakeControls = {
    ...forward(firstControls, () => world().fake),
    signInAs: async (accountId) => {
      const account = TEST_ACCOUNTS.find((a) => a.id === accountId);
      if (!account) throw new Error(`No test account ${accountId}`);
      await storage.remove(PROFILE_KEY);
      return later(await signInTo(account), delay);
    },
    currentViewerId: () => currentId,
  };

  return { ...data, ...session, fake: controls };
}
