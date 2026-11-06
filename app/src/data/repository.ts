import type {
  AuthProviderName,
  Booking,
  City,
  Community,
  CommunityOverview,
  DraftOffer,
  DraftOfferPatch,
  ExploreQuery,
  ExploreResult,
  MemberCard,
  MemberEvent,
  MyEvent,
  MyEventsScope,
  OrganizerEventDetail,
  Preferences,
  SaveEventInput,
  SendCodeInput,
  SendCodeResult,
  Session,
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
   */
  saveEvent(input: SaveEventInput): Promise<OrganizerEventDetail>;

  // Organizer: Lineup (GEL-1009)

  /** Booking requests on the event. HTTP: GET /app/events/:id/bookings */
  getEventBookings(eventId: string): Promise<Booking[]>;
  /** DJs added to the lineup whose offers are not sent yet (fee and note). */
  getDraftOffers(eventId: string): Promise<DraftOffer[]>;
  updateDraftOffer(eventId: string, djId: string, patch: DraftOfferPatch): Promise<DraftOffer[]>;
  removeDraftOffer(eventId: string, djId: string): Promise<DraftOffer[]>;
}
