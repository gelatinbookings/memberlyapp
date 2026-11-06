import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { secureStorage } from '@/lib/secureStorage';

import { createFakeRepository } from './fakeRepository';
import type { MemberlyRepository } from './repository';
import type { DraftOffer, DraftOfferPatch, ExploreQuery, KeyValueStorage, MyEventsScope, Preferences, SaveEventInput } from './types';

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
    () => ({ repository: repository ?? createFakeRepository({ storage, signedIn: FAKE_SIGNED_IN }), storage }),
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
  draftOffers: (eventId: string) => ['draft-offers', eventId] as const,
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

export function useEventBookings(eventId: string | undefined) {
  const repo = useRepository();
  return useQuery({
    queryKey: queryKeys.bookings(eventId ?? ''),
    queryFn: () => repo.getEventBookings(eventId ?? ''),
    enabled: !!eventId,
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

/** Edit or remove an unsent offer. The cache updates at once so typing never waits. */
export function useDraftOfferActions(eventId: string) {
  const repo = useRepository();
  const qc = useQueryClient();
  const key = queryKeys.draftOffers(eventId);
  const settle = (offers: DraftOffer[]) => {
    qc.setQueryData(key, offers);
    qc.invalidateQueries({ queryKey: ['community-overview'] });
  };
  return {
    update: (djId: string, patch: DraftOfferPatch) => {
      qc.setQueryData<DraftOffer[]>(key, (prev) => prev?.map((o) => (o.dj.id === djId ? { ...o, ...patch } : o)));
      return repo.updateDraftOffer(eventId, djId, patch).then(() => undefined);
    },
    remove: (djId: string) => {
      qc.setQueryData<DraftOffer[]>(key, (prev) => prev?.filter((o) => o.dj.id !== djId));
      return repo.removeDraftOffer(eventId, djId).then(settle);
    },
  };
}
