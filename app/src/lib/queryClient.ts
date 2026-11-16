import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';

import { subscribeOnline } from './network';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        // Polling (refetchInterval) stops while the app is in the background,
        // because focus follows AppState below.
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
      },
    },
  });
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

/**
 * Ties TanStack Query's notion of "focused" to the app being foregrounded:
 * background pauses polling, resume refetches stale queries once.
 */
export function useAppStateFocus(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);
}

/**
 * Ties TanStack Query's notion of "online" to the device's connection: reads
 * pause while offline and run again by themselves when the connection returns.
 */
export function useOnlineSync(): void {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) => subscribeOnline(setOnline));
  }, []);
}

const subscribeToOnline = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/** Whether reads can run right now, as TanStack Query sees it. */
export function useQueryOnline(): boolean {
  return useSyncExternalStore(subscribeToOnline, isOnline, isOnline);
}
