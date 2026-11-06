import type { BookingStatus } from '@/features/booking/status';
import type { Draw } from '@/features/booking/money';
import type { IsoDate, WallTime } from '@/lib/dates';

/** A bundled image (require) now; a remote { uri } once data is live. */
export type ImageAsset = number | { uri: string };

export type Role = 'member' | 'organizer';

export type Viewer = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  email: string;
  city: string;
  roles: Role[];
  communityCount: number;
};

export type Community = {
  id: string;
  name: string;
  city: string;
  memberCount: number;
  cover: ImageAsset;
  isOwner?: boolean;
  /** Explore taxonomy: community type, the event types it runs, its sound and its vibe. */
  type?: string;
  categories?: string[];
  genres?: string[];
  vibes?: string[];
};

export type LineupSlot = {
  /** Public surfaces show confirmed DJs only, or TBA when the organizer allows it. */
  djName: string | null;
  djPhoto?: ImageAsset;
  genres?: string;
  setTime: string;
  tier?: DjTier;
};

export type MemberEvent = {
  id: string;
  name: string;
  communityId: string;
  communityName: string;
  cover: ImageAsset;
  /** ISO 8601 with the venue's offset. */
  startsAt: string;
  endsAt: string;
  timeZone: string;
  neighborhood: string;
  city: string;
  distanceMiles?: number;
  /** Price label from Memberly's pass setup, e.g. "From $30" or "Members". */
  priceLabel: string;
  viewerHasPass: boolean;
  description: string;
  publicLineup: LineupSlot[];
  mapPin: { x: number; y: number };
  /** Explore taxonomy: event type ("Nightlife", "Dinners"…), genres and vibes. */
  category?: string;
  genres?: string[];
  vibes?: string[];
};

export type DjTier = 'Verified' | 'Top performer' | 'Resident' | 'City pillar';

export type Dj = {
  id: string;
  name: string;
  initials: string;
  photo?: ImageAsset;
  tier: DjTier;
  genres: string[];
  publishedRateCents: number | null;
  draw: Draw;
};

export type Booking = {
  requestId: string;
  dj: Dj;
  status: BookingStatus;
  offerCents: number;
  /** Server-calculated. The app never computes this. */
  totalCents: number;
  note: string;
  setTime: string;
  /** The DJ's new price after a counter (reauthorization_required), when Gelatin sends it. */
  newOfferCents?: number | null;
};

export type OrganizerEvent = {
  id: string;
  name: string;
  cover: ImageAsset | null;
  dateLabel: string;
  salesLabel: string;
  status: EventStatus;
  bookings: Booking[];
  /** DJs added to the lineup whose offers have not been sent. */
  addedDjCount: number;
};

/** A city an event can be in. Its zone is the venue's zone for every time on the event. */
export type City = {
  id: string;
  name: string;
  region: string;
  /** IANA, e.g. "America/New_York". */
  timeZone: string;
};

export type EventStatus = 'draft' | 'published';

/** What Create New Event edits. Date and times are wall-clock at the venue. */
export type EventFields = {
  name: string;
  tagline: string;
  description: string;
  cover: ImageAsset | null;
  date: IsoDate | null;
  startTime: WallTime | null;
  endTime: WallTime | null;
  venue: string;
  city: City | null;
};

export type OrganizerEventDetail = EventFields & {
  id: string;
  communityId: string;
  communityName: string;
  status: EventStatus;
  /** The venue's IANA zone; null until a city is set. */
  timeZone: string | null;
  /** ISO 8601 with the venue's offset, once date, times and city are set. */
  startsAt: string | null;
  endsAt: string | null;
};

export type SaveEventInput = {
  /** Absent for a new event. */
  id?: string;
  communityId: string;
  fields: EventFields;
  /** True for Create & publish. Publishing never reads or waits on bookings. */
  publish: boolean;
};

/** A DJ added to the lineup with an offer that has not been sent yet. Fee plus note only. */
export type DraftOffer = {
  dj: Dj;
  /** Whole dollars in cents; null until the organizer enters a fee. */
  offerCents: number | null;
  note: string;
};

export type DraftOfferPatch = Partial<Pick<DraftOffer, 'offerCents' | 'note'>>;

export type CommunityOverview = {
  community: Community;
  revenueMonthCents: number;
  newMembersMonth: number;
  churnPercent: number;
  setupTasks: { id: string; title: string; detail: string; actionLabel: string }[];
  upcoming: OrganizerEvent[];
};

// ---------------------------------------------------------------------------
// Session (GEL-998). The repository owns the session; tokens live in secure storage.

export type AuthProviderName = 'google' | 'apple';

/** What sendCode was asked for: a new account or signing back in. */
export type CodeIntent = 'sign-up' | 'sign-in';

export type Session = {
  /** Opaque bearer token. HTTP: access token; refresh lives beside it in secure storage. */
  token: string;
  /** ISO 8601. The app refreshes before this. */
  expiresAt: string;
  viewerId: string;
  email: string;
  /** False until preferences and permissions are finished or skipped (F1 steps 5–6). */
  onboardingDone: boolean;
};

export type SendCodeInput = { email: string; intent: CodeIntent; name?: string };

export type SendCodeResult = {
  email: string;
  /** Seconds until Resend is allowed. */
  resendAfterSeconds: number;
};

export type VerifyCodeResult =
  | { ok: true; session: Session; isNewUser: boolean }
  /** `expired`: the server already sent a fresh code; the countdown restarts. */
  | { ok: false; reason: 'wrong' }
  | { ok: false; reason: 'expired'; resendAfterSeconds: number };

/** A key-value store for small secrets: expo-secure-store in the app, memory in tests. */
export type KeyValueStorage = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Preferences (GEL-1000). Same taxonomy as the web profile's Preferences tab.

export type Preferences = {
  eventTypes: string[];
  genres: string[];
  vibes: string[];
  themes: string[];
};

// ---------------------------------------------------------------------------
// Explore (GEL-1003)

export type ExploreKind = 'communities' | 'events';

export type ExploreFilters = {
  kind: ExploreKind;
  /** "Near me", a city name, or "Anywhere". */
  location: string;
  communityTypes: string[];
  genres: string[];
  vibes: string[];
};

export type ExploreQuery = {
  text: string;
  /** The chip row above the sections: "All", "Nightlife", … */
  category: string;
  filters: ExploreFilters;
};

export type ExploreResult = {
  communities: Community[];
  events: MemberEvent[];
  /** Matches for `filters.kind`, the number on "Show 12 communities". */
  count: number;
};

// ---------------------------------------------------------------------------
// My events (GEL-1005)

export type MyEventsScope = 'upcoming' | 'past' | 'saved';

/** Pass: bought or claimed. Going: RSVP'd. Saved: bookmarked to decide later. */
export type EventRelation = 'pass' | 'going' | 'saved';

export type MyEvent = MemberEvent & { relation: EventRelation };

// ---------------------------------------------------------------------------
// My Memberly Card (GEL-1005, F4)

export type Membership = {
  communityId: string;
  communityName: string;
  cover: ImageAsset;
  /** "Inner Circle · renews Dec 1", "Free tier". */
  tierLabel: string;
  status: 'active' | 'expired';
};

export type MemberCard = {
  name: string;
  /** Active memberships: "Member · 3 communities". */
  communityCount: number;
  memberships: Membership[];
  /** What the door scans. Short-lived; the app may show a cached one offline until it expires. */
  qr: { token: string; expiresAt: string };
};
