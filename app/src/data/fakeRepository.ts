/**
 * Sample data for the design build. Every name, count and dollar figure here
 * is invented for demonstration, matching the design canvas.
 */
import type { MemberlyRepository } from './repository';
import { runExplore } from '@/features/explore/filters';
import { addDays, endsNextMorning, formatIsoDate, zonedIso } from '@/lib/dates';

import type {
  Booking,
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
  Preferences,
  Session,
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
  },
};

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
};

export function createFakeRepository(options: FakeRepositoryOptions = {}): MemberlyRepository {
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
  const bookingsByEvent: Record<string, Booking[]> = { e_warehouse_friday: bookings };
  const offersByEvent = seedDraftOffers();
  let nextId = 1;

  const find = (id: string) => events.find((e) => e.id === id);
  const offers = (eventId: string) => (offersByEvent[eventId] ??= []);

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
      later(runExplore({ communities: sampleCommunities, events: allEvents() }, query, sampleViewer.city), delay),

    getCard: () => {
      const memberships = cardMemberships();
      const card: MemberCard = {
        name: `${viewer().firstName} ${viewer().lastName}`.trim(),
        communityCount: memberships.filter((m) => m.status === 'active').length,
        memberships,
        // Short-lived, as the door expects. Real clock: the demo clock only drives event grouping.
        qr: { token: `memberly:card:${sampleViewer.id}:${Date.now().toString(36)}`, expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString() },
      };
      return later(card, delay);
    },

    getViewer: () => later(viewer(), delay),
    getTonight: (city) =>
      later(sampleEvents.filter((e) => e.city === city).sort((a, b) => Number(b.viewerHasPass) - Number(a.viewerHasPass)), delay),
    getEvent: (id) => later(allEvents().find((e) => e.id === id) ?? null, delay),
    getMyEvents: (scope) => {
      const mine: MyEvent[] = allEvents()
        .filter((e) => relations[e.id])
        .map((e) => ({ ...e, relation: relations[e.id] }));
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
    updateDraftOffer: (eventId, djId, patch) => {
      offersByEvent[eventId] = offers(eventId).map((o) => (o.dj.id === djId ? { ...o, ...patch } : o));
      return later([...offersByEvent[eventId]], delay);
    },
    removeDraftOffer: (eventId, djId) => {
      offersByEvent[eventId] = offers(eventId).filter((o) => o.dj.id !== djId);
      return later([...offersByEvent[eventId]], delay);
    },
  };
}
