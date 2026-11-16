/**
 * Sample data for the design build. Every name, count and dollar figure here
 * is invented for demonstration, matching the design canvas.
 */
import type { MemberlyRepository } from './repository';
import { runExplore } from '@/features/explore/filters';
import { addDays, endsNextMorning, formatEventDate, formatIsoDate, zonedIso, type IsoDate } from '@/lib/dates';

import { CatalogUnavailableError, RepositoryError } from './errors';
import type {
  Booking,
  BudgetBand,
  CardPass,
  City,
  Community,
  CommunityOverview,
  DraftOffer,
  Dj,
  CodeIntent,
  EventFields,
  EventRelation,
  KeyValueStorage,
  MemberCard,
  MemberEvent,
  MyEvent,
  OrganizerEvent,
  OrganizerEventDetail,
  PassOrder,
  PassType,
  PaymentSession,
  Preferences,
  Session,
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

export const sampleViewer: Viewer = {
  id: 'u_jordan',
  firstName: 'Jordan',
  lastName: 'Reese',
  initials: 'JR',
  email: 'jordan@secondsundays.example',
  city: 'Atlanta',
  roles: ['member', 'organizer'],
  communityCount: 3,
};

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
};

const NO_SIMULATION: FakeSimulation = {
  offline: false,
  djTakenNext: false,
  timeoutNextOffer: false,
  expiredSessions: 0,
  slowPassOrder: false,
  soldOutNext: false,
  priceChangeNext: false,
};

export type FakePaymentOutcome = { status: 'succeeded' } | { status: 'failed'; message: string };

/**
 * What only the fake has: switches for edge states, and the part the payment
 * provider plays. The test payment sheet calls `confirmPayment` where the real
 * sheet would confirm with the provider and the backend would hear about it.
 */
export type FakeControls = {
  simulate(patch: Partial<FakeSimulation>): void;
  /** The payment went through: a hold moves its request to `requested`; a pass order heads for `paid`. */
  confirmPayment(clientSecret: string): Promise<FakePaymentOutcome>;
  /** A declined card. Nothing is held, charged or sent. */
  declinePayment(clientSecret: string): Promise<FakePaymentOutcome>;
  /** Mark every paid-for pass order `paid` now, as the backend's webhook would. */
  settlePassOrders(): void;
  /** How many booking requests exist on an event. */
  requestCount(eventId: string): number;
  /** How many pass orders exist. */
  passOrderCount(): number;
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

/** A booking that still holds the DJ for the night. */
const OPEN_BOOKING: Booking['status'][] = ['authorization_required', 'requested', 'negotiating', 'reauthorization_required', 'confirmed'];

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
    publicLineup: [],
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
    publicLineup: [],
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
    publicLineup: [],
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
  publicLineup: [],
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
    publicLineup: [],
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
    publicLineup: [],
    mapPin: { x: 0.3, y: 0.4 },
    category: 'Workshops',
    genres: [],
    vibes: ['Intimate'],
  },
];

const allEvents = (): MemberEvent[] => [...sampleEvents, dayparty, ...exploreOnlyEvents];

/** How the sample viewer relates to each event on the Events tab. */
const relations: Record<string, EventRelation> = {
  e_warehouse_friday: 'pass',
  e_rooftop_hours: 'going',
  e_long_table: 'going',
  e_daylight: 'saved',
};

/** Jordan's picks: 11 in all, the number Me shows. */
export const samplePreferences: Preferences = {
  eventTypes: ['Nightlife', 'Concerts', 'Day parties'],
  genres: ['House', 'Afrobeats', 'R&B', 'Amapiano'],
  vibes: ['Underground', 'Rooftop'],
  themes: ['Food & drink', 'Culture'],
};

const EMPTY_PREFERENCES: Preferences = { eventTypes: [], genres: [], vibes: [], themes: [] };

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

function toDetail(e: StoredEvent): OrganizerEventDetail {
  const { date, startTime, endTime, city } = e.fields;
  const timeZone = city?.timeZone ?? null;
  const timed = !!(date && startTime && endTime && timeZone);
  return {
    ...e.fields,
    id: e.id,
    communityId: e.communityId,
    communityName: sampleCommunities.find((c) => c.id === e.communityId)?.name ?? '',
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
function cardMemberships(): MemberCard['memberships'] {
  const by = (id: string) => sampleCommunities.find((c) => c.id === id)!;
  const row = (id: string, tierLabel: string, status: 'active' | 'expired') => {
    const c = by(id);
    return { communityId: c.id, communityName: c.name, cover: c.cover, tierLabel, status };
  };
  return [
    row('c_second_sundays', 'Inner Circle · renews Dec 1', 'active'),
    row('c_supper_club', 'Table member', 'active'),
    row('c_rooftop', 'Free tier', 'active'),
    row('c_bass_church', 'Lapsed Oct 31 · renew in the web app', 'expired'),
  ];
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
};

export function createFakeRepository(options: FakeRepositoryOptions = {}): FakeRepository {
  const delay = options.delayMs ?? 250;
  const storage = options.storage ?? createMemoryStorage();
  // In memory: signing out stops the dev flag from signing straight back in until the next reload.
  let autoSignIn = options.signedIn ?? false;
  let pending: { email: string; intent: CodeIntent; name?: string } | null = null;
  let profile: Pick<Viewer, 'firstName' | 'lastName' | 'initials' | 'email'> | null = null;
  let preferences: Preferences = samplePreferences;
  let nextToken = 1;

  const newSession = (email: string, onboardingDone: boolean): Session => ({
    token: `fake.${Date.now().toString(36)}.${nextToken++}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    viewerId: sampleViewer.id,
    email,
    onboardingDone,
  });
  const store = async (session: Session) => {
    await storage.set(SESSION_KEY, JSON.stringify(session));
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
  const viewer = (): Viewer => ({ ...sampleViewer, ...profile });
  const events = seedEvents();
  // Copies, so a hold in one repository never shows in another.
  const bookingsByEvent: Record<string, Booking[]> = { e_warehouse_friday: bookings.map((b) => ({ ...b })) };
  const offersByEvent = seedDraftOffers();
  let nextId = 1;

  // --- Offers, holds and passes -------------------------------------------
  const sim: FakeSimulation = { ...NO_SIMULATION, ...options.simulation };
  const takenOnSend = new Set(options.takenOnSend ?? [TAKEN_ON_SEND_DJ_ID]);
  /** Nights a DJ turned out to be taken on, learnt when an offer was refused. */
  const refusedNights = new Map<string, Set<IsoDate>>();
  /** `<event>:<dj>:<client_offer_id>` → request id: the Idempotency-Key the backend sends Gelatin. */
  const requestsByKey = new Map<string, string>();
  const sessions = new Map<string, StoredSession>();
  const passTypes = seedPassTypes();
  const orders = new Map<string, StoredOrder>();
  const ordersByKey = new Map<string, string>();
  /** Event id → the pass the viewer holds. */
  const passes = new Map<string, string>(
    allEvents()
      .filter((e) => e.viewerHasPass)
      .map((e) => [e.id, 'General pass']),
  );
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
  const setBookingStatus = (requestId: string, status: Booking['status']) => {
    const found = findBooking(requestId);
    if (!found) return;
    bookingsByEvent[found.eventId] = bookingsByEvent[found.eventId].map((b) => (b.requestId === requestId ? { ...b, status } : b));
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
    const type = (passTypes[o.eventId] ?? []).find((t) => t.id === o.passTypeId);
    passes.set(o.eventId, type?.name ?? 'Pass');
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

  const controls: FakeControls = {
    simulate: (patch) => {
      Object.assign(sim, patch);
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
  };

  const find = (id: string) => events.find((e) => e.id === id);
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

  const overview = (): CommunityOverview => ({
    community: sampleCommunities[0],
    revenueMonthCents: 432000,
    newMembersMonth: 38,
    churnPercent: 1.2,
    setupTasks: [
      {
        id: 'stripe',
        title: 'Connect Stripe',
        detail: 'So you can receive payments from paid tiers.',
        actionLabel: 'Connect',
      },
    ],
    upcoming: events
      .filter((e) => e.communityId === sampleCommunities[0].id)
      .sort((a, b) => (a.fields.date ?? '9999').localeCompare(b.fields.date ?? '9999'))
      .map(organizerRow),
  });

  return {
    fake: controls,
    now: () => DEMO_NOW,

    getSession: async () => {
      let session = await readSession();
      if (session && !profile) {
        const raw = await storage.get(PROFILE_KEY);
        if (raw) profile = JSON.parse(raw);
      }
      if (!session && autoSignIn) session = await store(newSession(sampleViewer.email, true));
      return later(session, delay);
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
      // Create account makes a new member who still has preferences to pick; sign in is a returning one.
      const isNewUser = pending?.intent === 'sign-up';
      const name = pending?.name?.trim();
      if (isNewUser) {
        profile = { ...splitName(name || 'New member'), email };
        await storage.set(PROFILE_KEY, JSON.stringify(profile));
        preferences = EMPTY_PREFERENCES;
      } else {
        // A returning member is the sample viewer, whatever email was typed.
        profile = null;
        await storage.remove(PROFILE_KEY);
      }
      pending = null;
      const session = await store(newSession(email, !isNewUser));
      return later({ ok: true as const, session, isNewUser }, delay);
    },
    signInWithProvider: async () => {
      // The fake skips the native Google / Apple sheet and signs in the sample viewer.
      profile = null;
      await storage.remove(PROFILE_KEY);
      return later(await store(newSession(sampleViewer.email, true)), delay);
    },
    completeOnboarding: async () => {
      const current = (await readSession()) ?? newSession(viewer().email, true);
      return later(await store({ ...current, onboardingDone: true }), delay);
    },
    signOut: async () => {
      autoSignIn = false;
      profile = null;
      await storage.remove(SESSION_KEY);
      await storage.remove(PROFILE_KEY);
      return later(undefined, delay);
    },

    getPreferences: () => later(preferences, delay),
    putPreferences: (next) => {
      preferences = next;
      return later(preferences, delay);
    },

    explore: (query) =>
      later(runExplore({ communities: sampleCommunities, events: allEvents().map(withPass) }, query, sampleViewer.city), delay),

    getCard: () => {
      const memberships = cardMemberships();
      const card: MemberCard = {
        name: `${viewer().firstName} ${viewer().lastName}`.trim(),
        communityCount: memberships.filter((m) => m.status === 'active').length,
        memberships,
        passes: cardPasses(),
        // Short-lived, as the door expects. Real clock: the demo clock only drives event grouping.
        qr: { token: `memberly:card:${sampleViewer.id}:${Date.now().toString(36)}`, expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString() },
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
    getEvent: (id) => {
      const e = allEvents().find((x) => x.id === id);
      return later(e ? withPass(e) : null, delay);
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
    getTopCommunities: (city) => later(sampleCommunities.filter((c) => c.city === city).slice(0, 4), delay),
    getOrganizedCommunities: () => later(sampleCommunities.filter((c) => c.isOwner), delay),
    getCommunityOverview: (communityId) =>
      later(communityId === sampleCommunities[0].id ? overview() : null, delay),

    getCities: () => later(sampleCities, delay),
    getOrganizerEvent: (id) => {
      const e = find(id);
      return later(e ? toDetail(e) : null, delay);
    },
    saveEvent: ({ id, communityId, fields, publish }) => {
      let e = id ? find(id) : undefined;
      if (!e) {
        e = { id: `e_new_${nextId++}`, communityId, status: 'draft', salesLabel: null, fields };
        events.push(e);
      }
      e.fields = { ...fields, name: fields.name.trim() || 'Untitled event' };
      e.status = publish ? 'published' : 'draft';
      return later(toDetail(e), delay);
    },

    getEventBookings: (eventId) => later([...(bookingsByEvent[eventId] ?? [])], delay),
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
        bookingsByEvent[eventId] = [...(bookingsByEvent[eventId] ?? []), booking];
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

    getPassTypes: async (eventId) => {
      await network();
      return later((passTypes[eventId] ?? []).map((t) => ({ ...t })), delay);
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
      const type = (passTypes[eventId] ?? []).find((t) => t.id === passTypeId);
      if (!type) throw new RepositoryError('not_found');
      if (sim.soldOutNext) {
        sim.soldOutNext = false;
        type.soldOut = true;
      }
      if (sim.priceChangeNext && !type.freeForMembers) {
        sim.priceChangeNext = false;
        type.priceCents += 500;
      }
      if (type.soldOut) {
        await later(undefined, delay);
        throw new RepositoryError('pass_unavailable');
      }
      const totalCents = type.freeForMembers ? 0 : type.priceCents * Math.max(1, quantity);
      if (!type.freeForMembers && expectedPriceCents !== type.priceCents) {
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
      if (type.freeForMembers) {
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
  };
}
