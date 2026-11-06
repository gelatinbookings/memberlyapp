import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createFakeRepository, createMemoryStorage } from '@/data/fakeRepository';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import type { MemberlyRepository } from '@/data/repository';
import type { KeyValueStorage } from '@/data/types';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { EventDraftProvider, type EventDraft } from '@/features/events/EventDraftProvider';
import { ThemeProvider } from '@/theme/theme';

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, left: 0, right: 0, bottom: 34 },
};

/** Renders a screen with the app's providers on a fresh fake repository (no delay), signed in by default. */
export function renderWithProviders(
  ui: ReactElement,
  {
    repository,
    draft = null,
    storage = createMemoryStorage(),
    signedIn = true,
  }: { repository?: MemberlyRepository; draft?: EventDraft | null; storage?: KeyValueStorage; signedIn?: boolean } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const repo = repository ?? createFakeRepository({ delayMs: 0, storage, signedIn });
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={queryClient}>
        <RepositoryProvider repository={repo} storage={storage}>
          <AuthProvider>
            <ThemeProvider>
              <EventDraftProvider initial={draft}>{ui}</EventDraftProvider>
            </ThemeProvider>
          </AuthProvider>
        </RepositoryProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
