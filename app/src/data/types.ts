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
  /** The banner (4:1). Null for a community without one: screens show a muted tile. */
  cover: ImageAsset | null;
  /** The square logo, when the community has one. */
  logo?: ImageAsset | null;
  /** One line shown under the name. */
  tagline?: string;
  isOwner?: boolean;
  /** A short description, when the organizer wrote one. */
  description?: string;
  /** Explore taxonomy: community type, the event types it runs, its sound and its vibe. */
  /** Tags the organizer wrote that aren't in the taxonomy. */
  customTags?: string[];
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
  /** A short bio, when the catalog has one. */
  bio?: string | null;
};

// ---------------------------------------------------------------------------
// Talent catalog (GEL-1011, GEL-1012). Proxied from Gelatin by Memberly's backend.

/** Gelatin's budget bands, exactly as the API accepts them. Private-rate DJs still sit in a band. */
export type BudgetBand = 'under_300' | '300_to_600' | '600_to_1000' | '1000_plus';

/** One budget band or any; one genre or any. */
export type TalentFilters = { budget: BudgetBand | null; genre: string | null };

export type TalentQuery = Partial<TalentFilters> & {
  /** Opaque; from the previous page's `nextCursor`. */
  cursor?: string | null;
};

/** One page of DJs open on the event's night in the event's city. */
export type TalentPage = {
  djs: Dj[];
  /** Null on the last page. */
  nextCursor: string | null;
  /** False when Gelatin has no coverage in the event's city (`city_supported`). */
  citySupported: boolean;
  /** How many DJs match in all, when the server counts them. */
  total?: number;
};

/**
 * A booking's status as the server sends it. The eight the app knows, or
 * anything Gelatin adds later: an unknown one passes through untouched and
 * reads "Checking status" (GEL-1022).
 */
export type AnyBookingStatus = BookingStatus | (string & {});

export type Booking = {
  requestId: string;
  dj: Dj;
  status: AnyBookingStatus;
  offerCents: number;
  /** Server-calculated. The app never computes this. */
  totalCents: number;
  note: string;
  setTime: string;
  /** The DJ's new price after a counter (reauthorization_required), when Gelatin sends it. */
  newOfferCents?: number | null;
};

/**
 * An event's bookings with the ETag that names this exact body (GEL-1021).
 * `stale` is set when Gelatin was slow and the backend answered with the last
 * body it had.
 */
export type EventBookings = { bookings: Booking[]; etag: string; stale?: boolean };

/** `notModified` is HTTP 304: the body the app already holds is still current. */
export type EventBookingsAnswer = { notModified: true } | EventBookings;

/**
 * A way into Gelatin's portal for one booking: single use, valid for 60
 * seconds. Asked for at the moment it is opened and never kept, cached or logged.
 */
export type PortalLaunch = { launchUrl: string; expiresAt: string };

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
  /** Omitted for the United States. */
  country?: string;
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

// ---------------------------------------------------------------------------
// Sending an offer and holding the card (GEL-1016, GEL-1018, GEL-1019)

/**
 * What an offer would hold, itemised by the server before anything is sent.
 * The app shows these lines as given and never adds them up.
 */
export type OfferQuote = {
  offerCents: number;
  serviceFeeCents: number;
  /** The amount held on the card. Server-calculated. */
  totalCents: number;
};

/** Body of POST /app/events/:id/offers. Fee plus note only. */
export type CreateOfferInput = {
  djId: string;
  offerCents: number;
  note: string;
  /**
   * Generated on the device and kept in secure storage until the response
   * arrives, so a retry after a timeout or a cold start is the same request.
   */
  clientOfferId: string;
};

/**
 * What the native payment sheet needs, as Memberly's backend returns it for a
 * card hold or a pass order. No customer and no ephemeral key: cards are never saved.
 */
export type PaymentSession = {
  clientSecret: string;
  /** Set per session, never bundled with the app. */
  publishableKey: string;
  stripeAccountId?: string;
  /** Server-calculated. The only amount the payment sheet shows. */
  totalCents: number;
  merchantDisplayName: string;
  /** ISO 8601. An expired session is replaced by asking for a new one. */
  expiresAt: string;
};

// ---------------------------------------------------------------------------
// Get a pass (GEL-1035, GEL-1036)

export type PassType = {
  id: string;
  name: string;
  /** From Memberly's pass setup. Shown as "$30". */
  priceCents: number;
  /** One line of what the pass includes. */
  included: string;
  soldOut: boolean;
  /** Members claim it in one tap; there is no payment step. */
  freeForMembers: boolean;
};

export type PassOrderStatus = 'pending' | 'paid' | 'failed';

/** Body of POST /app/events/:id/pass-orders. */
export type CreatePassOrderInput = {
  passTypeId: string;
  quantity: number;
  /** Generated on the device and kept until the order settles, so a retry is the same order. */
  idempotencyKey: string;
  /** The price the member was shown. The server answers `price_changed` when it no longer holds. */
  expectedPriceCents: number;
};

export type PassOrder = {
  orderId: string;
  status: PassOrderStatus;
  /** Server-calculated; 0 for a members-free pass. */
  totalCents: number;
  /** Present while the order still needs paying. A members-free pass comes back `paid` with none. */
  payment?: PaymentSession;
};

// ---------------------------------------------------------------------------
// Create community and pass setup (GEL-1056, GEL-1057; backend GEL-1058)

/** A task on Manage's "Finish setting up" card. */
export type SetupTask = { id: string; title: string; detail: string; actionLabel: string };

/** How people join: free, or a named membership at a monthly price. */
/** One paid membership tier, as the organizer sets it up. */
export type MembershipTierInput = { name: string; monthlyPriceCents: number; included?: string };

/** Free to join, or one or more paid tiers (each becomes a community pass). */
export type MembershipInput = { kind: 'free' } | { kind: 'paid'; tiers: MembershipTierInput[] };

/** Body of POST /app/organizer/communities. */
/** The social links a community can show on its public page. */
export type SocialNetwork = 'instagram' | 'facebook' | 'x' | 'tiktok' | 'youtube' | 'linkedin';

/** A photo picked on the phone. The HTTP repository uploads it first and sends its upload id. */
export type PickedPhoto = { uri: string };

/** The web's Create New Community, step 1 and 2, as one request. */
export type CreateCommunityInput = {
  name: string;
  /** One line shown under the name. */
  tagline: string;
  /** The end of withmemberly.com/community/…; the server makes it unique. Omitted: made from the name. */
  slug?: string;
  /** The community description, plain text. */
  description: string;
  country: string;
  /** State or province, when known. */
  state?: string;
  /** A city name from `getCities()`, when chosen. */
  city?: string;
  /** Square logo. */
  logo: PickedPhoto;
  /** 4:1 banner. */
  banner: PickedPhoto;
  /** Up to 10 photos. */
  gallery: PickedPhoto[];
  /**
   * Discovery tags, up to 10. Known ones come from the Explore taxonomy and the
   * server files them as type, genres and vibes; others are kept as written.
   */
  tags: string[];
  links: Partial<Record<SocialNetwork, string>>;
  referralCode?: string;
  membership: MembershipInput;
  /** Made on the device and reused on a retry, so a community is never created twice. */
  idempotencyKey: string;
};

export type CreateCommunityResult = { community: Community; setupTasks: SetupTask[] };

/** A pass as its organizer sees it: a community pass is a membership, an event pass is entry to one event. */
export type OrganizerPass = {
  id: string;
  scope: 'community' | 'event';
  communityId: string;
  /** Set for an event pass. */
  eventId: string | null;
  name: string;
  /** Null is free. A community pass's price is monthly. Whole dollars, in cents. */
  priceCents: number | null;
  /** One line of what the pass includes. */
  included: string;
  /** A member limit (community) or a quantity (event). Null is no limit. */
  limit: number | null;
  /** Event passes only: members of the community get it free. */
  freeForMembers: boolean;
  /** False once turned off: nobody new can get it. */
  active: boolean;
  /** How many people hold it. Above zero, it can be turned off but not deleted. */
  heldCount: number;
  /** False while it has a price and the community's Stripe account is not connected. */
  sellable: boolean;
};

/** Body of POST /app/organizer/communities/:id/passes. */
export type CreateCommunityPassInput = {
  name: string;
  monthlyPriceCents: number | null;
  included: string;
  memberLimit?: number | null;
  idempotencyKey: string;
};

/** Body of POST /app/organizer/events/:id/passes. */
export type CreateEventPassInput = {
  name: string;
  priceCents: number | null;
  included: string;
  quantity?: number | null;
  freeForMembers: boolean;
  idempotencyKey: string;
};

/** Body of PATCH /app/organizer/passes/:id. Only what is given changes. */
export type UpdatePassInput = Partial<Pick<OrganizerPass, 'name' | 'priceCents' | 'included' | 'limit' | 'freeForMembers' | 'active'>>;

export type CommunityOverview = {
  community: Community;
  revenueMonthCents: number;
  newMembersMonth: number;
  /** Null until there are members who could have left. */
  churnPercent: number | null;
  /** True while the figures are placeholders rather than the community's own. */
  sampleNumbers: boolean;
  setupTasks: SetupTask[];
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
  cover: ImageAsset | null;
  /** "Inner Circle · renews Dec 1", "Free tier". */
  tierLabel: string;
  status: 'active' | 'expired';
};

/** A pass on the member's card. */
export type CardPass = {
  eventId: string;
  eventName: string;
  /** "General pass" */
  passName: string;
  /** "Fri, Nov 20" */
  whenLabel: string;
};

export type MemberCard = {
  name: string;
  /** Active memberships: "Member · 3 communities". */
  communityCount: number;
  memberships: Membership[];
  /** Passes for upcoming events, newest first. Absent on a card cached before passes were listed. */
  passes?: CardPass[];
  /** What the door scans. Short-lived; the app may show a cached one offline until it expires. */
  qr: { token: string; expiresAt: string };
};
