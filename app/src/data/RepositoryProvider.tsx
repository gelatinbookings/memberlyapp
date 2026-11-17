import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { keepPreviousData, useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { POLL_INTERVAL_MS, shouldPoll } from '@/features/booking/status';
import { secureStorage } from '@/lib/secureStorage';

import { isCatalogUnavailable } from './errors';
import { createFakeRepository } from './fakeRepository';
import type { MemberlyRepository } from './repository';
import type {
  Booking,
  BudgetBand,
  Community,
  Dj,
  DraftOffer,
  DraftOfferPatch,
  ExploreQuery,
  KeyValueStorage,
  MyEventsScope,
  OrganizerEvent,
  Preferences,
  SaveEventInput,
  TalentFilters,
} from './types';

type Services = { repository: MemberlyRepository; storage: KeyValueStorage };

const RepositoryContext = createContext<Services | null>(null);

/** Dev bypass for the sign-in gate: start signed in as the sample viewer. See README. */
export const FAKE_SIGNED_IN = process.env.EXPO_PUBLIC_FAKE_SIGNED_IN === '1';

export function RepositoryProvider({
  repository,
  storage = secureStorage,
  children,
}: {
  repository?: MemberlyRepository;
  /** Secure storage for the session and the cached card. Tests pass memory storage. */
  storage?: KeyValueStorage;
  children: ReactNode;
}) {
  const value = useMemo(
    // The app's own repository answers nothing until it has read who is signed in.
    () => ({ repository: repository ?? createFakeRepository({ storage, signedIn: FAKE_SIGNED_IN, holdUntilSession: true }), storage }),
    [repository, storage],
  );
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

function useServices(): Services {
  const services = useContext(RepositoryContext);
  if (!services) throw new Error('useRepository must be used inside RepositoryProvider');
  return services;
}

export function useRepository(): MemberlyRepository {
  return useServices().repository;
}

/** Secure key-value storage on this device. */
export function useStorage(): KeyValueStorage {
  return useServices().storage;
}

export const queryKeys = {
  viewer: ['viewer'] as const,
  tonight: (city: string) => ['tonight', city] as const,
  event: (id: string) => ['event', id] as const,
  myEvents: (scope: MyEventsScope) => ['my-events', scope] as const,
  preferences: ['preferences'] as const,
  explore: (q: ExploreQuery) => ['explore', q] as const,
  card: ['member-card'] as const,
  topCommunities: (city: string) => ['top-communities', city] as const,
  organized: ['organized-communities'] as const,
  overview: (id: string) => ['community-overview', id] as const,
  cities: ['cities'] as const,
  organizerEvent: (id: string) => ['organizer-event', id] as const,
  bookings: (eventId: string) => ['event-bookings', eventId] as const,
  bookingsMeta: (eventId: string) => ['event-bookings-meta', eventId] as const,
  alternates: (requestId: string) => ['alternates', requestId] as const,
  draftOffers: (eventId: string) => ['draft-offers', eventId] as const,
  talent: (eventId: string, f: TalentFilters) => ['talent', eventId, f.budget, f.genre] as const,
  talentCount: (eventId: string, f: TalentFilters) => ['talent-count', eventId, f.budget, f.genre] as const,
  talentGenres: (eventId: string, budget: BudgetBand | null) => ['talent-genres', eventId, budget] as const,
  cityWaitlist: (city: string) => ['city-waitlist', city] as const,
  offerQuote: (eventId: string, djId: string, offerCents: number) => ['offer-quote', eventId, djId, offerCents] as const,
  passTypes: (eventId: string) => ['pass-types', eventId] as const,
  communityPasses: (communityId: string) => ['community-passes', communityId] as const,
  eventPasses: (eventId: string) => ['organizer-event-passes', eventId] as const,
};

export function useViewer() {
  const repo = useRepository();
  return useQuery({ queryKey: queryKeys.viewer, queryFn: () => repo.getViewer() });
}

export function useTonight(city: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.tonight(city ?? ''),
    queryFn: () => repo.getTonight(city ?? ''),
    enabled: !!city,
  });
}

export function useEvent(id: string) {
  const repo = useRepository();
  return useQuery({ queryKey: queryKeys.event(id), queryFn: () => repo.getEvent(id) });
}

export function useMyEvents(scope: MyEventsScope) {
  const repo = useRepository();
  return useQuery({ queryKey: queryKeys.myEvents(scope), queryFn: () => repo.getMyEvents(scope) });
}

export function usePreferences() {
  const repo = useRepository();
  return useQuery({ queryKey: queryKeys.preferences, queryFn: () => repo.getPreferences() });
}

export function useSavePreferences() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Preferences) => repo.putPreferences(p),
    onSuccess: (p) => qc.setQueryData(queryKeys.preferences, p),
  });
}

/** Explore results and the live count. Keeps the last results on screen while the next load runs. */
export function useExplore(query: ExploreQuery | null) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.explore(query ?? { text: '', category: 'All', filters: { kind: 'communities', location: '', communityTypes: [], genres: [], vibes: [] } }),
    queryFn: () => repo.explore(query!),
    enabled: !!query,
    placeholderData: keepPreviousData,
  });
}

export function useTopCommunities(city: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.topCommunities(city ?? ''),
    queryFn: () => repo.getTopCommunities(city ?? ''),
    enabled: !!city,
  });
}

export function useOrganizedCommunities() {
  const repo = useRepository();
  return useQuery({ queryKey: queryKeys.organized, queryFn: () => repo.getOrganizedCommunities() });
}

export function useCommunityOverview(id: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.overview(id ?? ''),
    queryFn: () => repo.getCommunityOverview(id ?? ''),
    enabled: !!id,
  });
}

export function useCities() {
  const repo = useRepository();
  return useQuery({ queryKey: queryKeys.cities, queryFn: () => repo.getCities(), staleTime: Infinity });
}

/** An event as the organizer edits it. Pass undefined (a new event) to skip the read. */
export function useOrganizerEvent(id: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.organizerEvent(id ?? ''),
    queryFn: () => repo.getOrganizerEvent(id ?? ''),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Booking status (GEL-1022)

/**
 * What the app remembers about its last read of an event's bookings: the ETag
 * to send back, whether that body was the backend's last known one (`stale`),
 * whether the latest read failed, and when a current answer last arrived.
 */
export type BookingsMeta = { etag: string | null; stale: boolean; failed: boolean; freshAt: number | null };

/**
 * One read of an event's bookings, conditional on the last ETag. A
 * "not modified" answer hands back the very list already in the cache, so
 * nothing that shows it renders again. Every read of bookings goes through
 * this: the Lineup's poll, a refresh after a payment, a return from Gelatin.
 */
export function eventBookingsFetcher(qc: QueryClient, repo: MemberlyRepository, eventId: string): () => Promise<Booking[]> {
  const key = queryKeys.bookings(eventId);
  const metaKey = queryKeys.bookingsMeta(eventId);
  return async () => {
    const held = qc.getQueryData<Booking[]>(key);
    const meta = qc.getQueryData<BookingsMeta>(metaKey);
    let answer;
    try {
      // The ETag is only sent with a body to go back to.
      answer = await repo.getEventBookings(eventId, { ifNoneMatch: held ? (meta?.etag ?? null) : null });
      // The cache was cleared while the call was out: ask again in full.
      if ('notModified' in answer && !qc.getQueryData<Booking[]>(key)) answer = await repo.getEventBookings(eventId);
    } catch (error) {
      if (held) qc.setQueryData<BookingsMeta>(metaKey, { etag: meta?.etag ?? null, stale: meta?.stale ?? false, freshAt: meta?.freshAt ?? null, failed: true });
      throw error;
    }
    const now = Date.now();
    if ('notModified' in answer) {
      qc.setQueryData<BookingsMeta>(metaKey, { etag: meta?.etag ?? null, stale: false, failed: false, freshAt: now });
      return qc.getQueryData<Booking[]>(key) ?? [];
    }
    qc.setQueryData<BookingsMeta>(metaKey, {
      etag: answer.etag,
      stale: !!answer.stale,
      failed: false,
      // A stale body is no newer than the last current one.
      freshAt: answer.stale ? (meta?.freshAt ?? null) : now,
    });
    return answer.bookings;
  };
}

/** Read an event's bookings now, whatever the cache holds, and put the answer in the cache. */
export function fetchEventBookings(qc: QueryClient, repo: MemberlyRepository, eventId: string): Promise<Booking[]> {
  return qc.fetchQuery({ queryKey: queryKeys.bookings(eventId), queryFn: eventBookingsFetcher(qc, repo, eventId), staleTime: 0 });
}

/**
 * An event's bookings. With `live`, the list polls every 5 seconds, only
 * while a booking is `requested` or `negotiating`; the Lineup passes `live`
 * while it is the screen in front. Polling pauses in the background and
 * offline (the query client follows AppState and the connection) and reads
 * once at once on the way back, because a live list is never treated as fresh.
 */
export function useEventBookings(eventId: string | undefined, { live = false }: { live?: boolean } = {}) {
  const repo = useRepository();
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.bookings(eventId ?? ''),
    queryFn: eventBookingsFetcher(qc, repo, eventId ?? ''),
    enabled: !!eventId,
    ...(live
      ? {
          staleTime: 0,
          refetchInterval: (query: { state: { data?: Booking[] } }) =>
            query.state.data?.some((b) => shouldPoll(b.status)) ? POLL_INTERVAL_MS : false,
          refetchIntervalInBackground: false,
        }
      : null),
  });
}

const NO_META: BookingsMeta = { etag: null, stale: false, failed: false, freshAt: null };

/**
 * Whether the bookings on screen may be behind (a stale body, a failed
 * refresh, or no connection), and when a current answer last arrived. While
 * all is well it gives the same value every time, so a quiet poll renders nothing.
 */
export function useBookingsFreshness(eventId: string | undefined, offline = false): { behind: boolean; since: number | null } {
  const meta = useQuery({
    queryKey: queryKeys.bookingsMeta(eventId ?? ''),
    // Written by eventBookingsFetcher; never fetched.
    queryFn: () => NO_META,
    enabled: false,
    gcTime: Infinity,
    select: (m: BookingsMeta) => {
      const behind = m.stale || m.failed || (offline && m.freshAt != null);
      return { behind, since: behind ? m.freshAt : null };
    },
  });
  return meta.data ?? { behind: false, since: null };
}

/** DJs open on the same night as a booking that passed, expired or was cancelled (GEL-1023). */
export function useAlternates(requestId: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.alternates(requestId ?? ''),
    queryFn: () => repo.getAlternates(requestId ?? ''),
    enabled: !!requestId,
    staleTime: 0,
    retry: talentRetry,
  });
}

export function useDraftOffers(eventId: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.draftOffers(eventId ?? ''),
    queryFn: () => repo.getDraftOffers(eventId ?? ''),
    enabled: !!eventId,
  });
}

/** Save as draft or Create & publish. Refreshes Manage; leaves bookings alone. */
export function useSaveEvent() {
  const repo = useRepository();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveEventInput) => repo.saveEvent(input),
    onSuccess: (event) => {
      qc.setQueryData(queryKeys.organizerEvent(event.id), event);
      qc.invalidateQueries({ queryKey: ['community-overview'] });
    },
  });
}

/** Add, edit or remove an unsent offer. The cache updates at once so tapping and typing never wait. */
export function useDraftOfferActions(eventId: string) {
  const repo = useRepository();
  const qc = useQueryClient();
  const key = queryKeys.draftOffers(eventId);
  // Several adds and removes can be in flight; only the last answer replaces what is on screen.
  const inFlight = useRef(0);
  const settle = (offers: DraftOffer[]) => {
    if (inFlight.current === 0) qc.setQueryData(key, offers);
    qc.invalidateQueries({ queryKey: ['community-overview'] });
  };
  const send = (request: Promise<DraftOffer[]>) => {
    inFlight.current += 1;
    return request
      .then(
        (offers) => {
          inFlight.current -= 1;
          settle(offers);
        },
        (error) => {
          inFlight.current -= 1;
          // Put back what the server has, so a failed add or remove does not linger.
          if (inFlight.current === 0) qc.invalidateQueries({ queryKey: key });
          throw error;
        },
      );
  };
  return {
    /** From Browse talent. The offer starts at the published rate; a private rate starts empty. */
    add: (dj: Dj) => {
      qc.setQueryData<DraftOffer[]>(key, (prev = []) =>
        prev.some((o) => o.dj.id === dj.id) ? prev : [...prev, { dj, offerCents: dj.publishedRateCents, note: '' }],
      );
      return send(repo.addDraftOffer(eventId, dj));
    },
    update: (djId: string, patch: DraftOfferPatch) => {
      qc.setQueryData<DraftOffer[]>(key, (prev) => prev?.map((o) => (o.dj.id === djId ? { ...o, ...patch } : o)));
      return repo.updateDraftOffer(eventId, djId, patch).then(() => undefined);
    },
    remove: (djId: string) => {
      qc.setQueryData<DraftOffer[]>(key, (prev) => prev?.filter((o) => o.dj.id !== djId));
      return send(repo.removeDraftOffer(eventId, djId));
    },
  };
}

// ---------------------------------------------------------------------------
// Browse talent (GEL-1012 to GEL-1015)

/** A 503 from the catalog is shown at once with Try again; anything else gets one quiet retry. */
function talentRetry(failureCount: number, error: unknown): boolean {
  return !isCatalogUnavailable(error) && failureCount < 1;
}

const TALENT_STALE_MS = 60_000;

/**
 * DJs open on the event's night in its city, paged by cursor. Keyed by event
 * and filters; the city and date are the repository's business, not the screen's.
 */
export function useTalent(eventId: string, filters: TalentFilters) {
  const repo = useRepository();
  return useInfiniteQuery({
    queryKey: queryKeys.talent(eventId, filters),
    queryFn: ({ pageParam }) => repo.getTalent(eventId, { ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: TALENT_STALE_MS,
    retry: talentRetry,
  });
}

/**
 * How many DJs a set of filters would show, for "Show 3 DJs" and the
 * loosening buttons. Undefined when the server does not count.
 */
export function useTalentCount(eventId: string, filters: TalentFilters, enabled = true, keepPrevious = false) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.talentCount(eventId, filters),
    queryFn: async () => (await repo.getTalent(eventId, filters)).total ?? null,
    enabled,
    staleTime: TALENT_STALE_MS,
    retry: talentRetry,
    // The sheet's button keeps its last number while the next one is counted.
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });
}

/** Genres for the Filters sheet: the event's city and the chosen budget band. */
export function useTalentGenres(eventId: string, budget: BudgetBand | null, enabled = true) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.talentGenres(eventId, budget),
    queryFn: () => repo.getTalentGenres(eventId, budget),
    enabled,
    staleTime: 10 * 60_000,
    retry: talentRetry,
    placeholderData: keepPreviousData,
  });
}

/** Notify me for a city Gelatin does not book yet. Asked once; remembered for the session. */
export function useCityWaitlist(city: string | undefined) {
  const repo = useRepository();
  const qc = useQueryClient();
  const key = queryKeys.cityWaitlist(city ?? '');
  const joined = useQuery({ queryKey: key, queryFn: () => false, enabled: false, staleTime: Infinity, gcTime: Infinity });
  // Set on the first tap, before any re-render, so a double tap is still one call.
  const asked = useRef(false);
  const join = useMutation({
    mutationFn: () => repo.joinCityWaitlist(city ?? ''),
    onSuccess: () => qc.setQueryData(key, true),
    // A failed call may be tried again.
    onError: () => {
      asked.current = false;
    },
  });
  return {
    joined: joined.data === true,
    pending: join.isPending,
    failed: join.isError,
    join: () => {
      if (!city || joined.data === true || asked.current) return;
      asked.current = true;
      join.mutate();
    },
  };
}

// ---------------------------------------------------------------------------
// Offers and passes (GEL-1018, GEL-1036)

/**
 * The server's figures for one offer before it is sent: fee, Gelatin service
 * fee and the total to hold. Asked again whenever the fee changes.
 */
export function useOfferQuote(eventId: string, djId: string | undefined, offerCents: number | null | undefined) {
  const repo = useRepository();
  const ready = !!djId && offerCents != null && offerCents > 0;
  return useQuery({
    queryKey: queryKeys.offerQuote(eventId, djId ?? '', offerCents ?? 0),
    queryFn: () => repo.quoteOffer(eventId, djId!, offerCents!),
    enabled: ready,
    staleTime: 60_000,
    retry: false,
  });
}

/** The event's pass types, for the Get a pass sheet and the footer's Sold out. */
export function usePassTypes(eventId: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.passTypes(eventId ?? ''),
    queryFn: () => repo.getPassTypes(eventId ?? ''),
    enabled: !!eventId,
  });
}

// ---------------------------------------------------------------------------
// Communities and pass setup (GEL-1056, GEL-1057)

/** A community's passes (its memberships), as its organizer sees them. */
export function useCommunityPasses(communityId: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.communityPasses(communityId ?? ''),
    queryFn: () => repo.getCommunityPasses(communityId ?? ''),
    enabled: !!communityId,
  });
}

/** An event's passes as its organizer sees them, turned-off ones included. */
export function useOrganizerEventPasses(eventId: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.eventPasses(eventId ?? ''),
    queryFn: () => repo.getOrganizerEventPasses(eventId ?? ''),
    enabled: !!eventId,
  });
}

export type OrganizerUpcomingEvent = OrganizerEvent & { community: Community };

/**
 * Every upcoming event across the communities the viewer runs, each with its
 * community, in the order Manage lists them. For "Add a pass for an event".
 */
export function useOrganizerUpcomingEvents(): { events: OrganizerUpcomingEvent[]; isPending: boolean; isError: boolean; refetch: () => void } {
  const repo = useRepository();
  const organized = useOrganizedCommunities();
  const communities = organized.data ?? [];
  const overviews = useQueries({
    queries: communities.map((c) => ({ queryKey: queryKeys.overview(c.id), queryFn: () => repo.getCommunityOverview(c.id) })),
  });
  const events = overviews.flatMap((o, i) => (o.data?.upcoming ?? []).map((e) => ({ ...e, community: communities[i] })));
  return {
    events,
    isPending: organized.isPending || overviews.some((o) => o.isPending),
    isError: organized.isError || overviews.some((o) => o.isError),
    refetch: () => {
      organized.refetch();
      overviews.forEach((o) => o.refetch());
    },
  };
}

/**
 * After a community is created: the viewer is an organizer now, so who they
 * are, what they run and Manage are all read again before the app moves on.
 */
export async function refreshAfterCommunity(qc: QueryClient): Promise<void> {
  qc.invalidateQueries({ queryKey: ['community-overview'] });
  await Promise.all([qc.refetchQueries({ queryKey: queryKeys.viewer }), qc.refetchQueries({ queryKey: queryKeys.organized })]);
}

/** After a pass is added, changed, turned off or removed: its lists, what members see, and the setup tasks. */
export function refreshAfterPassSetup(qc: QueryClient, pass: { communityId: string; eventId: string | null }): Promise<void> {
  qc.invalidateQueries({ queryKey: ['community-overview'] });
  if (pass.eventId) qc.invalidateQueries({ queryKey: queryKeys.passTypes(pass.eventId) });
  return qc.invalidateQueries({
    queryKey: pass.eventId ? queryKeys.eventPasses(pass.eventId) : queryKeys.communityPasses(pass.communityId),
  });
}
