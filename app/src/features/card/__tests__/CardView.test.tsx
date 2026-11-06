import { screen } from '@testing-library/react-native';

import { createFakeRepository, createMemoryStorage } from '@/data/fakeRepository';
import type { MemberCard } from '@/data/types';
import { useOnline } from '@/lib/network';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { CARD_CACHE_KEY, loadCachedCard } from '../cardCache';
import { CardView, OFFLINE_LINE } from '../CardView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-qrcode-svg', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return function QRCode(props: { value: string }) {
    return <View testID="qr" accessibilityLabel={props.value} />;
  };
});

const cached = (expiresInMs: number): MemberCard => ({
  name: 'Jordan Reese',
  communityCount: 3,
  memberships: [],
  qr: { token: 'memberly:card:cached', expiresAt: new Date(Date.now() + expiresInMs).toISOString() },
});

function offlineRepo() {
  const repo = createFakeRepository({ delayMs: 0 });
  repo.getCard = () => Promise.reject(new Error('Network request failed'));
  return repo;
}

describe('My Memberly Card', () => {
  afterEach(() => jest.mocked(useOnline).mockReturnValue(true));

  it('shows the card, name, communities and memberships online, and caches it', async () => {
    const storage = createMemoryStorage();
    await renderWithProviders(<CardView />, { storage });
    expect(await screen.findByText('Member · 3 communities')).toBeTruthy();
    expect(screen.getByText('Scan at the door')).toBeTruthy();
    expect(screen.getAllByText('Active').length).toBe(3);
    expect(screen.getByText('Expired')).toBeTruthy();
    expect(screen.queryByText(OFFLINE_LINE)).toBeNull();
    expect(screen.queryByText(/Wallet/)).toBeNull(); // hidden until the wallet decision
    expect(await loadCachedCard(storage)).not.toBeNull();
  });

  it('shows the cached token with “Shown offline” when the server can’t be reached', async () => {
    const storage = createMemoryStorage({ [CARD_CACHE_KEY]: JSON.stringify(cached(3600_000)) });
    await renderWithProviders(<CardView />, { storage, repository: offlineRepo() });
    expect(await screen.findByText(OFFLINE_LINE)).toBeTruthy();
    expect(screen.getByTestId('qr').props.accessibilityLabel).toBe('memberly:card:cached');
  });

  it('uses the cache straight away when the phone is offline', async () => {
    jest.mocked(useOnline).mockReturnValue(false);
    const storage = createMemoryStorage({ [CARD_CACHE_KEY]: JSON.stringify(cached(3600_000)) });
    await renderWithProviders(<CardView />, { storage });
    expect(await screen.findByText(OFFLINE_LINE)).toBeTruthy();
  });

  it('never shows an expired cached token', async () => {
    const storage = createMemoryStorage({ [CARD_CACHE_KEY]: JSON.stringify(cached(-1000)) });
    await renderWithProviders(<CardView />, { storage, repository: offlineRepo() });
    expect(await screen.findByText('Your card needs a connection')).toBeTruthy();
    expect(screen.queryByTestId('qr')).toBeNull();
  });
});
