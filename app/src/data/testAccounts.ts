/**
 * The four test accounts on the sample (fake) backend: one person for each
 * stage of the product. Everything here is invented. The emails are on the
 * reserved `.test` domain, so none can belong to anyone; the sample code
 * (1234) signs any of them in, and so does the Test accounts sheet on Sign in.
 *
 * This file is the one place that says who each account is and what they see.
 * The fake repository builds a separate world for each from it, so nothing one
 * account does shows up for another. Ids here (communities, events) name rows
 * in the fake's shared catalog and in its organizer seeds.
 */
import type { Preferences } from './types';

export type TestAccountId = 'new-user' | 'new-organizer' | 'existing-organizer' | 'existing-member';

/** A membership on the Memberly Card. `communityId` names a community in the shared catalog. */
export type SeedMembership = { communityId: string; tierLabel: string; status: 'active' | 'expired' };

/** A setup task on Manage's "Finish setting up" card. */
export type SeedSetupTask = { id: string; title: string; detail: string; actionLabel: string };

export type TestAccount = {
  id: TestAccountId;
  /** Becomes `Session.viewerId` and `Viewer.id`. */
  viewerId: string;
  /** How the account is named on the Test accounts sheet. */
  label: string;
  /** One line on what signing in as it shows. */
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  /** False: signing in lands on Preferences step 1. */
  onboardingDone: boolean;
  preferences: Preferences;
  memberships: SeedMembership[];
  /** Passes held, by event id. They put the event on Home, Events and the Card. */
  passes: { eventId: string; passName: string }[];
  /** Events on the Events tab that are not passes: going, or saved to decide later. */
  events: Record<string, 'going' | 'saved'>;
  /** The community they run, or null: no Manage tab. */
  organizes: null | {
    /** A community in the shared catalog, or a new one with just these fields. */
    community: { id: string; name: string; city: string; memberCount: number };
    setupTasks: SeedSetupTask[];
    /** This month's numbers. `sample` marks invented figures; a new community has real zeros and no churn yet. */
    stats: { revenueMonthCents: number; newMembersMonth: number; churnPercent: number | null; sample: boolean };
    /** Events on Manage, by id, from the fake's organizer seeds. Their bookings and unsent offers come with them. */
    eventIds: string[];
  };
};

const NO_PREFERENCES: Preferences = { eventTypes: [], genres: [], vibes: [], themes: [] };

const CONNECT_STRIPE: SeedSetupTask = {
  id: 'stripe',
  title: 'Connect Stripe',
  detail: 'So you can receive payments from paid tiers.',
  actionLabel: 'Connect',
};

/** 1. Has just made an account: onboarding still to do, nothing joined, nothing bought. */
const NEW_USER: TestAccount = {
  id: 'new-user',
  viewerId: 'u_test_new_user',
  label: 'New user · account created',
  description: 'Just signed up. Lands on Preferences; no memberships, no passes.',
  email: 'new.user@memberly.test',
  firstName: 'Alex',
  lastName: 'Morgan',
  city: 'Atlanta',
  onboardingDone: false,
  preferences: NO_PREFERENCES,
  memberships: [],
  passes: [],
  events: {},
  organizes: null,
};

/** 2. Has just created a community: setup to finish, no events, no members beyond themselves. */
const NEW_ORGANIZER: TestAccount = {
  id: 'new-organizer',
  viewerId: 'u_test_new_organizer',
  label: 'New organizer · setup to finish',
  description: 'A new community with no events yet. Manage shows what’s left to set up.',
  email: 'new.organizer@memberly.test',
  firstName: 'Sam',
  lastName: 'Carter',
  city: 'Atlanta',
  onboardingDone: true,
  preferences: { eventTypes: ['Nightlife', 'Dinners', 'Day parties'], genres: ['House', 'R&B'], vibes: ['Intimate'], themes: [] },
  memberships: [],
  passes: [],
  events: {},
  organizes: {
    community: { id: 'c_porchlight', name: 'Porchlight Social', city: 'Atlanta', memberCount: 1 },
    setupTasks: [CONNECT_STRIPE],
    stats: { revenueMonthCents: 0, newMembersMonth: 0, churnPercent: null, sample: false },
    eventIds: [],
  },
};

/**
 * 3. The sample person the app has always opened as: Second Sundays with
 * Warehouse Friday live and bookings in motion, Sunday Sessions in every
 * status, and their own passes and memberships. Continue with Google and
 * Continue with Apple sign in this account.
 */
const EXISTING_ORGANIZER: TestAccount = {
  id: 'existing-organizer',
  viewerId: 'u_jordan',
  label: 'Existing organizer · active booking and event',
  description: 'Runs Second Sundays. Warehouse Friday is live with DJs in motion.',
  email: 'jordan@secondsundays.test',
  firstName: 'Jordan',
  lastName: 'Reese',
  city: 'Atlanta',
  onboardingDone: true,
  // 11 picks in all, the number Me shows.
  preferences: {
    eventTypes: ['Nightlife', 'Concerts', 'Day parties'],
    genres: ['House', 'Afrobeats', 'R&B', 'Amapiano'],
    vibes: ['Underground', 'Rooftop'],
    themes: ['Food & drink', 'Culture'],
  },
  memberships: [
    { communityId: 'c_second_sundays', tierLabel: 'Inner Circle · renews Dec 1', status: 'active' },
    { communityId: 'c_supper_club', tierLabel: 'Table member', status: 'active' },
    { communityId: 'c_rooftop', tierLabel: 'Free tier', status: 'active' },
    { communityId: 'c_bass_church', tierLabel: 'Lapsed Oct 31 · renew in the web app', status: 'expired' },
  ],
  passes: [{ eventId: 'e_warehouse_friday', passName: 'General pass' }],
  events: { e_rooftop_hours: 'going', e_long_table: 'going', e_daylight: 'saved' },
  organizes: {
    community: { id: 'c_second_sundays', name: 'Second Sundays', city: 'Atlanta', memberCount: 1204 },
    setupTasks: [CONNECT_STRIPE],
    stats: { revenueMonthCents: 432000, newMembersMonth: 38, churnPercent: 1.2, sample: true },
    eventIds: ['e_warehouse_friday', 'e_long_table', 'e_late_service', 'e_sunday_sessions', 'e_river_street'],
  },
};

/** 4. A member with passes and memberships who runs nothing: no Manage tab, and Me offers Start a community. */
const EXISTING_MEMBER: TestAccount = {
  id: 'existing-member',
  viewerId: 'u_test_member',
  label: 'Existing member · no community yet',
  description: 'Has passes and memberships. No Manage tab; Me offers Start a community.',
  email: 'member@memberly.test',
  firstName: 'Dana',
  lastName: 'Whitfield',
  city: 'Atlanta',
  onboardingDone: true,
  preferences: { eventTypes: ['Nightlife', 'Dinners', 'Concerts'], genres: ['R&B', 'House', 'Afrobeats'], vibes: ['Upscale', 'Intimate'], themes: ['Food & drink'] },
  memberships: [
    { communityId: 'c_second_sundays', tierLabel: 'Member · renews Dec 14', status: 'active' },
    { communityId: 'c_supper_club', tierLabel: 'Table member', status: 'active' },
    { communityId: 'c_daylight', tierLabel: 'Lapsed Sep 30 · renew in the web app', status: 'expired' },
  ],
  passes: [
    { eventId: 'e_warehouse_friday', passName: 'Member pass' },
    { eventId: 'e_daylight', passName: 'General pass' },
  ],
  events: { e_rooftop_hours: 'going', e_listening_session: 'saved' },
  organizes: null,
};

/** In the order the Test accounts sheet lists them. */
export const TEST_ACCOUNTS: readonly TestAccount[] = [NEW_USER, NEW_ORGANIZER, EXISTING_ORGANIZER, EXISTING_MEMBER];

/** The account the sample data has always been: also who Continue with Google and Apple sign in. */
export const DEFAULT_TEST_ACCOUNT = EXISTING_ORGANIZER;

/** What someone who creates an account with any other email starts from: nothing joined, onboarding to do. */
export const NEW_ACCOUNT_TEMPLATE = NEW_USER;

export function testAccountById(id: string): TestAccount | undefined {
  return TEST_ACCOUNTS.find((a) => a.id === id || a.viewerId === id);
}

export function testAccountByEmail(email: string): TestAccount | undefined {
  const wanted = email.trim().toLowerCase();
  return TEST_ACCOUNTS.find((a) => a.email === wanted);
}
