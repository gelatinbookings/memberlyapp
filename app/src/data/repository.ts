import type {
  AuthProviderName,
  Booking,
  City,
  Community,
  CommunityOverview,
  CreateCommunityInput,
  CreateCommunityPassInput,
  CreateCommunityResult,
  CreateEventPassInput,
  CreateOfferInput,
  CreatePassOrderInput,
  DraftOffer,
  DraftOfferPatch,
  Dj,
  EventBookingsAnswer,
  BudgetBand,
  ExploreQuery,
  ExploreResult,
  MemberCard,
  MemberEvent,
  MyEvent,
  MyEventsScope,
  OfferQuote,
  OrganizerEventDetail,
  OrganizerPass,
  PassOrder,
  PassType,
  PaymentSession,
  PortalLaunch,
  Preferences,
  SaveEventInput,
  SendCodeInput,
  SendCodeResult,
  Session,
  TalentPage,
  TalentQuery,
  UpdatePassInput,
  VerifyCodeResult,
  Viewer,
} from './types';

/**
 * Everything the app reads goes through this interface. The fake
 * implementation backs milestones 1–7; milestone 8 adds an implementation
 * that calls Memberly's backend (never Gelatin directly).
 */
export interface MemberlyRepository {
  /** The clock the app groups events by. Real implementation: new Date(). */
  now(): Date;

  // Session (GEL-998). The implementation keeps tokens in secure storage.

  /** The stored session, or null when signed out. HTTP: reads secure storage, refreshes if near expiry. */
  getSession(): Promise<Session | null>;
  /** Email a 4-digit code. HTTP: POST /app/auth/email-code */
  sendCode(input: SendCodeInput): Promise<SendCodeResult>;
  /** Check the code; on success the session is stored. HTTP: POST /app/auth/verify */
  verifyCode(email: string, code: string): Promise<VerifyCodeResult>;
  /** Google or Apple: the native sign-in runs first, then HTTP: POST /app/auth/google | /app/auth/apple */
  signInWithProvider(provider: AuthProviderName): Promise<Session>;
  /** Preferences and permissions are finished or skipped. HTTP: PATCH /app/me {onboarded: true} */
  completeOnboarding(): Promise<Session>;
  /** Clears stored tokens. HTTP: POST /app/auth/sign-out */
  signOut(): Promise<void>;

  // Preferences (GEL-1000)

  /** HTTP: GET /app/me/preferences */
  getPreferences(): Promise<Preferences>;
  /** Replaces all four lists. HTTP: PUT /app/me/preferences */
  putPreferences(preferences: Preferences): Promise<Preferences>;

  // Explore (GEL-1003)

  /** Search and filters with the live count. HTTP: GET /app/explore?q=&kind=&location=&type=&genre=&vibe= */
  explore(query: ExploreQuery): Promise<ExploreResult>;

  // My Memberly Card (GEL-1005)

  /** Name, memberships and a short-lived QR token. HTTP: GET /app/me/card */
  getCard(): Promise<MemberCard>;

  getViewer(): Promise<Viewer>;
  getTonight(city: string): Promise<MemberEvent[]>;
  getEvent(id: string): Promise<MemberEvent | null>;
  /** The member's events in one scope, each with pass / going / saved. HTTP: GET /app/me/events?scope= */
  getMyEvents(scope: MyEventsScope): Promise<MyEvent[]>;
  getTopCommunities(city: string): Promise<Community[]>;
  getOrganizedCommunities(): Promise<Community[]>;
  getCommunityOverview(communityId: string): Promise<CommunityOverview | null>;

  // Organizer: Create New Event (GEL-1008, GEL-1010)

  /** Cities an event can be set in, each with its IANA zone. */
  getCities(): Promise<City[]>;
  /** An event as the organizer edits it. HTTP: GET /app/organizer/events/:id */
  getOrganizerEvent(id: string): Promise<OrganizerEventDetail | null>;
  /**
   * Create or update an event; `publish` decides draft or live.
   * HTTP: POST /app/organizer/events, PATCH /app/organizer/events/:id {publish}.
   * Never touches bookings and never waits on them.
   * A changed date on an event with bookings is refused (GEL-1025): throws
   * RepositoryError `confirmed_booking` (409) when a DJ is confirmed for the
   * current date, or `open_bookings` (409) while offers for it are still open.
   * Each carries the `requestId` of a booking that blocks the change.
   */
  saveEvent(input: SaveEventInput): Promise<OrganizerEventDetail>;

  // Organizer: Lineup (GEL-1009)

  /**
   * Booking requests on the event, with the ETag for this body. Pass the last
   * ETag as `ifNoneMatch` and an unchanged lineup answers `{ notModified: true }`
   * with no body. `stale: true` means the backend answered with the last body
   * it had. Unknown statuses pass through untouched.
   * HTTP: GET /app/events/:id/bookings with If-None-Match; 304 → notModified.
   */
  getEventBookings(eventId: string, options?: { ifNoneMatch?: string | null }): Promise<EventBookingsAnswer>;
  /** DJs added to the lineup whose offers are not sent yet (fee and note). */
  getDraftOffers(eventId: string): Promise<DraftOffer[]>;
  /** Add a DJ from Browse talent. The offer starts at the published rate, or empty for a private rate. */
  addDraftOffer(eventId: string, dj: Dj): Promise<DraftOffer[]>;
  updateDraftOffer(eventId: string, djId: string, patch: DraftOfferPatch): Promise<DraftOffer[]>;
  removeDraftOffer(eventId: string, djId: string): Promise<DraftOffer[]>;

  // Organizer: Browse talent (GEL-1011 to GEL-1015)

  /**
   * DJs open on the event's night in the event's city, one page at a time.
   * The city and the date come from the stored event, never from the caller.
   * HTTP: GET /app/events/:id/talent?budget=&genre=&cursor=&limit=
   * Throws CatalogUnavailableError on 503 catalog_unavailable.
   */
  getTalent(eventId: string, query?: TalentQuery): Promise<TalentPage>;
  /**
   * Genres to offer in the Filters sheet, for the event's city and one budget band (or any).
   * HTTP: GET /app/talent/genres?city=&budget=, the city resolved from the event.
   */
  getTalentGenres(eventId: string, budget: BudgetBand | null): Promise<string[]>;
  /** Notify me when Gelatin opens in a city. Idempotent per organizer and city. HTTP: POST /app/talent/city-waitlist {city} */
  joinCityWaitlist(city: string): Promise<void>;

  // Organizer: offers and the card hold (GEL-1016, GEL-1018 to GEL-1020)

  /**
   * What an offer would hold, before it is sent: the fee, the Gelatin service
   * fee and the server's total. The review sheet shows these; the app never
   * works a total out. HTTP: not in GEL-1016 yet (see README, open questions).
   */
  quoteOffer(eventId: string, djId: string, offerCents: number): Promise<OfferQuote>;
  /**
   * Create the booking request for one DJ. Idempotent by `clientOfferId`: a
   * repeat returns the original request. The request starts
   * `authorization_required`; the DJ sees nothing until the card is held.
   * HTTP: POST /app/events/:id/offers {dj_id, offer_cents, note, client_offer_id}
   * Throws RepositoryError `dj_unavailable` (409, never with a reason),
   * `offer_open` (409, another offer to this DJ is open), `invalid_offer` (400).
   */
  createOffer(eventId: string, input: CreateOfferInput): Promise<Booking>;
  /**
   * What the payment sheet needs to hold the card for one request. Each call
   * returns a fresh session. HTTP: POST /app/bookings/:request_id/payment-session
   * Throws RepositoryError `not_payable` (409) unless the request is
   * `authorization_required` or `reauthorization_required`.
   */
  createPaymentSession(requestId: string): Promise<PaymentSession>;

  // Organizer: after the first payment (GEL-1021, GEL-1023, GEL-1024)

  /**
   * DJs open on the same night in the same city as a booking that passed,
   * expired or was cancelled. Never a reason, a message or any history.
   * HTTP: GET /app/bookings/:request_id/alternates
   * Throws CatalogUnavailableError on 503 catalog_unavailable.
   */
  getAlternates(requestId: string): Promise<Dj[]>;
  /**
   * A single-use way into Gelatin's portal for one booking, valid for 60
   * seconds. Call it at the moment the organizer opens Gelatin, once per
   * opening; never ahead of time, and never keep, cache or log the answer.
   * HTTP: POST /app/bookings/:request_id/portal-launch
   * Throws RepositoryError `portal_unavailable` (409) before any card hold exists.
   */
  createPortalLaunch(requestId: string): Promise<PortalLaunch>;

  // Member: Get a pass (GEL-1035, GEL-1036)

  /** The event's pass types, from Memberly's pass setup. HTTP: GET /app/events/:id/pass-types */
  getPassTypes(eventId: string): Promise<PassType[]>;
  /**
   * Order a pass. Idempotent by `idempotencyKey`: a repeat returns the same
   * order and payment. A members-free pass comes back `paid` with no payment.
   * HTTP: POST /app/events/:id/pass-orders {pass_type_id, quantity, idempotency_key}
   * Throws RepositoryError `pass_unavailable` (409) and `price_changed` (409, with the new total).
   */
  createPassOrder(eventId: string, input: CreatePassOrderInput): Promise<PassOrder>;
  /** HTTP: GET /app/pass-orders/:id */
  getPassOrder(orderId: string): Promise<PassOrder>;

  // Organizer: create a community and set up passes (GEL-1056, GEL-1057; backend GEL-1058)

  /**
   * Create a community; the caller becomes its owner and an organizer at
   * once. Idempotent by `idempotencyKey`: a repeat returns the same community.
   * A paid membership with no connected Stripe account saves, and the setup
   * tasks include Connect Stripe.
   * HTTP: POST /app/organizer/communities {name, city, type, description?, cover_upload_id?, membership, idempotency_key}
   * Throws RepositoryError `invalid_input` (400).
   */
  createCommunity(input: CreateCommunityInput): Promise<CreateCommunityResult>;
  /**
   * A community's passes (its memberships), as the organizer sees them, turned-off ones included.
   * HTTP: GET /app/organizer/communities/:id/passes. `not_found` (404) for anyone who is not its organizer.
   */
  getCommunityPasses(communityId: string): Promise<OrganizerPass[]>;
  /**
   * Add a community pass. Idempotent by `idempotencyKey`.
   * HTTP: POST /app/organizer/communities/:id/passes {name, monthly_price_cents | null, included, member_limit?, idempotency_key}
   */
  createCommunityPass(communityId: string, input: CreateCommunityPassInput): Promise<OrganizerPass>;
  /**
   * An event's passes as the organizer sees them, turned-off ones included.
   * The ones on sale are what `getPassTypes(eventId)` gives members.
   * HTTP: GET /app/organizer/events/:id/passes
   */
  getOrganizerEventPasses(eventId: string): Promise<OrganizerPass[]>;
  /**
   * Add an event pass. Idempotent by `idempotencyKey`.
   * HTTP: POST /app/organizer/events/:id/passes {name, price_cents | null, included, quantity?, free_for_members, idempotency_key}
   */
  createEventPass(eventId: string, input: CreateEventPassInput): Promise<OrganizerPass>;
  /** Edit a pass, or turn it off or on. HTTP: PATCH /app/organizer/passes/:id {…fields, active} */
  updatePass(passId: string, patch: UpdatePassInput): Promise<OrganizerPass>;
  /**
   * Remove a pass nobody holds. Throws RepositoryError `pass_held` (409) once
   * anyone holds it: turn it off instead.
   * HTTP: not listed in GEL-1058, which only has PATCH {active}. See README, open questions.
   */
  deletePass(passId: string): Promise<void>;
}
