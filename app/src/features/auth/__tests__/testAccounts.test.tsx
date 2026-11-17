import { useEffect } from 'react';
import { Text } from 'react-native';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import SignInSheet from '@/app/(auth)/sign-in';
import EventsScreen, { EMPTY_SCOPE, NOTHING_YET } from '@/app/(tabs)/events';
import HomeScreen from '@/app/(tabs)/index';
import ManageScreen, { NO_COMMUNITY_TITLE, NO_EVENTS_LINE, NO_EVENTS_TITLE, NO_NUMBERS_LINE, SAMPLE_NUMBERS_LINE } from '@/app/(tabs)/manage';
import MeScreen, { START_COMMUNITY } from '@/app/(tabs)/me';
import { createFakeRepository, createMemoryStorage, SESSION_KEY, type FakeRepository } from '@/data/fakeRepository';
import { useEventBookings, useOrganizedCommunities, useViewer } from '@/data/RepositoryProvider';
import type { MemberlyRepository } from '@/data/repository';
import { TEST_ACCOUNTS, type TestAccountId } from '@/data/testAccounts';
import type { MemberCard, Session } from '@/data/types';
import { CARD_CACHE_KEY, loadCachedCard, saveCachedCard } from '@/features/card/cardCache';
import { CardView, NO_MEMBERSHIPS_TITLE } from '@/features/card/CardView';
import { ensurePendingOffer, listPendingOffers } from '@/features/offers/pendingOffers';
import { ensurePendingPassOrder, listPendingPassOrders } from '@/features/passes/pendingPassOrders';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { useAuth } from '../AuthProvider';
import { TEST_ACCOUNTS_NOTE, TEST_ACCOUNTS_TITLE } from '../components/TestAccountsSheet';
import { claimDevice, DEVICE_OWNER_KEY } from '../deviceOwner';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-qrcode-svg', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return function QRCode(props: { value: string }) {
    return <View testID="qr" accessibilityLabel={props.value} />;
  };
});

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** A repository signed in as one of the test accounts. */
async function signedInAs(id: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(id);
  return repository;
}

const ALL: TestAccountId[] = ['new-user', 'new-organizer', 'existing-organizer', 'existing-member'];

beforeEach(() => jest.clearAllMocks());

describe('the Test accounts sheet on Sign in', () => {
  it('lists the four accounts by label and description, marked as test data', async () => {
    await renderWithProviders(<SignInSheet />, { signedIn: false });
    await press(await screen.findByRole('link', { name: `Running on sample data. ${TEST_ACCOUNTS_TITLE}` }));
    const sheet = within(await screen.findByTestId('test-accounts'));
    expect(sheet.getByRole('header', { name: TEST_ACCOUNTS_TITLE })).toBeTruthy();
    expect(sheet.getByText('Test data')).toBeTruthy();
    expect(sheet.getByText(TEST_ACCOUNTS_NOTE)).toBeTruthy();
    for (const account of TEST_ACCOUNTS) {
      const row = within(sheet.getByTestId(`test-account-${account.id}`));
      expect(row.getByText(account.label)).toBeTruthy();
      expect(row.getByText(account.description)).toBeTruthy();
    }
    expect(sheet.getAllByTestId(/^test-account-/)).toHaveLength(4);
  });

  it.each(ALL)('signs in as %s when it is tapped', async (id) => {
    const storage = createMemoryStorage();
    const repository = createFakeRepository({ delayMs: 0, storage });
    await renderWithProviders(<SignInSheet />, { repository, storage });
    await press(await screen.findByRole('link', { name: /Test accounts$/ }));
    await press(await screen.findByTestId(`test-account-${id}`));
    const account = TEST_ACCOUNTS.find((a) => a.id === id)!;
    await waitFor(() => expect(repository.fake.currentViewerId()).toBe(account.viewerId));
    const stored = JSON.parse((await storage.get(SESSION_KEY)) ?? 'null') as Session | null;
    expect(stored).toMatchObject({ viewerId: account.viewerId, onboardingDone: account.onboardingDone });
    await waitFor(async () => expect(await storage.get(DEVICE_OWNER_KEY)).toBe(account.viewerId));
  });

  it('is not there when the repository is not the sample one', async () => {
    // What a real repository looks like to the app: the same calls, and no fake controls.
    const { fake: _fake, ...real } = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<SignInSheet />, { repository: real as MemberlyRepository });
    expect(await screen.findByRole('button', { name: 'Send verification code' })).toBeTruthy();
    expect(screen.queryByText(/Test accounts/)).toBeNull();
    expect(screen.queryByText(/sample data/i)).toBeNull();
    expect(screen.queryByTestId('test-accounts')).toBeNull();
  });

  it('does not depend on a development build: the only switch is the repository', () => {
    const source = jest.requireActual<typeof import('fs')>('fs').readFileSync(require.resolve('../components/TestAccountsSheet'), 'utf8');
    expect(source).not.toMatch(/__DEV__/);
    const provider = jest.requireActual<typeof import('fs')>('fs').readFileSync(require.resolve('../AuthProvider'), 'utf8');
    expect(provider).not.toMatch(/__DEV__/);
  });
});

describe('Home for each account', () => {
  const cases: [TestAccountId, string, string, string, string][] = [
    ['new-user', 'Alex', 'No communities yet', 'No passes yet', 'Top tonight: Warehouse Friday'],
    ['new-organizer', 'Sam', 'No communities yet', 'No passes yet', 'Top tonight: Warehouse Friday'],
    ['existing-organizer', 'Jordan', '3 communities', '1 pass tonight', 'Your pass: Warehouse Friday'],
    ['existing-member', 'Dana', '2 communities', '1 pass tonight', 'Your pass: Warehouse Friday'],
  ];
  it.each(cases)('%s: greets %s, with "%s", "%s" and the right photo card', async (id, firstName, communities, passLine, featured) => {
    await renderWithProviders(<HomeScreen />, { repository: await signedInAs(id) });
    const card = within(await screen.findByTestId('home-member-card'));
    expect(screen.getByRole('header', { name: new RegExp(firstName) })).toBeTruthy();
    expect(card.getByText(communities)).toBeTruthy();
    expect(card.getByText(passLine)).toBeTruthy();
    expect(screen.getByTestId('home-featured').props.accessibilityLabel).toContain(featured);
    // What else is on tonight is the same shared list for everyone.
    expect(screen.getByText('Also tonight')).toBeTruthy();
  });
});

describe('Events for each account', () => {
  it.each(['new-user', 'new-organizer'] as const)('%s: says nothing is coming up, with the way to Explore', async (id) => {
    await renderWithProviders(<EventsScreen />, { repository: await signedInAs(id) });
    expect(await screen.findByTestId('events-empty-upcoming')).toBeTruthy();
    expect(screen.getByText(EMPTY_SCOPE.upcoming)).toBeTruthy();
    expect(screen.getByText(NOTHING_YET)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Find something in Explore' })).toBeTruthy();
    expect(screen.queryByText(/0 passes/)).toBeNull();
    await press(screen.getByText('Saved'));
    expect(await screen.findByText(EMPTY_SCOPE.saved)).toBeTruthy();
  });

  it('existing organizer: the pass and the two nights they are going to, as before', async () => {
    await renderWithProviders(<EventsScreen />, { repository: await signedInAs('existing-organizer') });
    expect(await screen.findByText('1 pass · 2 you’re going to')).toBeTruthy();
    for (const name of ['Warehouse Friday', 'Rooftop Hours', 'Long Table', 'Daylight']) expect(screen.getByText(name)).toBeTruthy();
  });

  it('existing member: their own two passes and one night out', async () => {
    await renderWithProviders(<EventsScreen />, { repository: await signedInAs('existing-member') });
    expect(await screen.findByText('2 passes · 1 you’re going to')).toBeTruthy();
    for (const name of ['Warehouse Friday', 'Rooftop Hours', 'Daylight', 'Listening Session']) expect(screen.getByText(name)).toBeTruthy();
    expect(screen.queryByText('Long Table')).toBeNull();
  });
});

describe('My Memberly Card for each account', () => {
  it.each(['new-user', 'new-organizer'] as const)('%s: the card works, and memberships have a real empty state', async (id) => {
    await renderWithProviders(<CardView />, { repository: await signedInAs(id) });
    expect(await screen.findByTestId('member-card')).toBeTruthy();
    expect(screen.getByText('Member · no communities yet')).toBeTruthy();
    const empty = within(screen.getByTestId('card-no-memberships'));
    expect(empty.getByText(NO_MEMBERSHIPS_TITLE)).toBeTruthy();
    expect(empty.getByRole('link', { name: 'Find a community in Explore' })).toBeTruthy();
    expect(screen.queryByTestId('card-passes')).toBeNull();
    expect(screen.queryByText('Second Sundays')).toBeNull();
  });

  it('existing organizer: four memberships and tonight’s pass, as before', async () => {
    await renderWithProviders(<CardView />, { repository: await signedInAs('existing-organizer') });
    expect(await screen.findByText('Jordan Reese')).toBeTruthy();
    expect(screen.getByText('Member · 3 communities')).toBeTruthy();
    for (const name of ['Second Sundays', 'Supper Club ATL', 'Rooftop Society', 'Bass Church']) expect(screen.getByText(name)).toBeTruthy();
    expect(within(screen.getByTestId('card-passes')).getByText('Warehouse Friday')).toBeTruthy();
    expect(screen.queryByTestId('card-no-memberships')).toBeNull();
  });

  it('existing member: their memberships and both passes', async () => {
    await renderWithProviders(<CardView />, { repository: await signedInAs('existing-member') });
    expect(await screen.findByText('Dana Whitfield')).toBeTruthy();
    expect(screen.getByText('Member · 2 communities')).toBeTruthy();
    for (const name of ['Second Sundays', 'Supper Club ATL', 'Day Party Collective']) expect(screen.getByText(name)).toBeTruthy();
    const passes = within(screen.getByTestId('card-passes'));
    expect(passes.getByText('Warehouse Friday')).toBeTruthy();
    expect(passes.getByText('Daylight')).toBeTruthy();
    expect(screen.queryByText('Rooftop Society')).toBeNull();
  });
});

describe('Manage for each account', () => {
  it('new organizer: the community, Finish setting up, real zeros and "No events yet" with New event', async () => {
    await renderWithProviders(<ManageScreen />, { repository: await signedInAs('new-organizer') });
    expect(await screen.findByRole('header', { name: 'Porchlight Social' })).toBeTruthy();
    expect(screen.getByText('Atlanta · 1 member')).toBeTruthy();
    expect(screen.getByText('Finish setting up')).toBeTruthy();
    expect(screen.getByText('Connect Stripe')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeTruthy();
    // Honest numbers, not sample ones.
    expect(screen.getByText('$0')).toBeTruthy();
    expect(screen.getByText('+0')).toBeTruthy();
    expect(screen.getByText('–')).toBeTruthy();
    expect(screen.getByText(NO_NUMBERS_LINE)).toBeTruthy();
    expect(screen.queryByText(SAMPLE_NUMBERS_LINE)).toBeNull();
    const empty = within(screen.getByTestId('manage-no-events'));
    expect(empty.getByText(NO_EVENTS_TITLE)).toBeTruthy();
    expect(empty.getByText(NO_EVENTS_LINE)).toBeTruthy();
    // One New event, and it opens Create New Event.
    expect(screen.getAllByRole('button', { name: 'New event' })).toHaveLength(1);
    await press(empty.getByRole('button', { name: 'New event' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/new', params: { community: 'c_porchlight' } });
    expect(screen.queryByText('Warehouse Friday')).toBeNull();
  });

  it('existing organizer: Second Sundays with its events and the sample numbers, as before', async () => {
    await renderWithProviders(<ManageScreen />, { repository: await signedInAs('existing-organizer') });
    expect(await screen.findByRole('header', { name: 'Second Sundays' })).toBeTruthy();
    expect(screen.getByText('Atlanta · 1,204 members')).toBeTruthy();
    expect(screen.getByText('$4,320')).toBeTruthy();
    expect(screen.getByText('+38')).toBeTruthy();
    expect(screen.getByText('1.2%')).toBeTruthy();
    expect(screen.getByText(SAMPLE_NUMBERS_LINE)).toBeTruthy();
    for (const name of ['Warehouse Friday', 'Long Table', 'Late Service', 'Sunday Sessions']) expect(screen.getByText(name)).toBeTruthy();
    expect(screen.getByText('Lineup: 1 confirmed · 1 waiting · 1 to pay')).toBeTruthy();
    expect(screen.queryByTestId('manage-no-events')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'New event' })).toHaveLength(1);
  });

  it.each(['new-user', 'existing-member'] as const)('%s: runs no community, and Manage says so instead of loading forever', async (id) => {
    await renderWithProviders(<ManageScreen />, { repository: await signedInAs(id) });
    expect(await screen.findByText(NO_COMMUNITY_TITLE)).toBeTruthy();
    expect(screen.queryByLabelText('Loading your community')).toBeNull();
    expect(screen.queryByText('Second Sundays')).toBeNull();
  });
});

describe('Me for each account', () => {
  it.each(['existing-member', 'new-user'] as const)('%s: offers Start a community, which opens Create community, and has nothing to manage', async (id) => {
    const repository = await signedInAs(id);
    await renderWithProviders(<MeScreen />, { repository });
    const viewer = await repository.getViewer();
    expect(await screen.findByText(`${viewer.firstName} ${viewer.lastName}`)).toBeTruthy();
    const row = await screen.findByTestId('start-community');
    expect(within(row).getByText(START_COMMUNITY)).toBeTruthy();
    expect(screen.queryByText('You organize')).toBeNull();
    await press(row);
    expect(router.push).toHaveBeenCalledWith('/organizer/communities/new');
  });

  it.each(['new-organizer', 'existing-organizer'] as const)('%s: has no Start a community row', async (id) => {
    const repository = await signedInAs(id);
    await renderWithProviders(<MeScreen />, { repository });
    const viewer = await repository.getViewer();
    expect(await screen.findByText(`${viewer.firstName} ${viewer.lastName}`)).toBeTruthy();
    // Everything Me reads has arrived.
    await screen.findByText(/passes$|pass$/);
    await waitFor(async () => expect(screen.queryAllByText('You organize')).toHaveLength((await repository.getOrganizedCommunities()).length));
    expect(screen.queryByTestId('start-community')).toBeNull();
    expect(screen.queryByText(START_COMMUNITY)).toBeNull();
  });

  it('organizers see the community they run under You organize', async () => {
    await renderWithProviders(<MeScreen />, { repository: await signedInAs('new-organizer') });
    expect(await screen.findByText('You organize')).toBeTruthy();
    expect(screen.getByText('Porchlight Social')).toBeTruthy();
    expect(screen.getByText('Owner · 1 member')).toBeTruthy();
  });
});

describe('switching accounts', () => {
  /** A screen's worth of reads, and the app's sign-in and sign-out. */
  let auth: ReturnType<typeof useAuth>;
  let cache: QueryClient;
  function Probe() {
    const a = useAuth();
    const qc = useQueryClient();
    const viewer = useViewer();
    const organized = useOrganizedCommunities();
    const bookings = useEventBookings('e_warehouse_friday');
    useEffect(() => {
      auth = a;
      cache = qc;
    }, [a, qc]);
    return (
      <Text testID="probe">
        {[a.status, viewer.data?.firstName ?? '…', (organized.data ?? []).map((c) => c.name).join('+') || 'none', `${bookings.data?.length ?? '…'} bookings`].join(' | ')}
      </Text>
    );
  }
  const shown = () => screen.getByTestId('probe').props.children as string;
  const cached = () => JSON.stringify(cache.getQueryCache().getAll().map((q) => q.state.data));

  it('leaves nothing of the last account in the cache, on sign-out and on the next sign-in', async () => {
    const storage = createMemoryStorage();
    const repository = createFakeRepository({ delayMs: 0, storage });
    await renderWithProviders(<Probe />, { repository, storage });
    await waitFor(() => expect(shown()).toContain('signedOut'));

    await act(async () => auth.signInAsTestAccount('existing-organizer'));
    await waitFor(() => expect(shown()).toBe('signedIn | Jordan | Second Sundays | 3 bookings'));
    expect(cached()).toContain('br_blkmtn');

    await act(async () => auth.signOut());
    await waitFor(() => expect(shown()).toContain('signedOut'));

    await act(async () => auth.signInAsTestAccount('existing-member'));
    await waitFor(() => expect(shown()).toBe('signedIn | Dana | none | 0 bookings'));
    expect(cached()).not.toMatch(/Jordan|br_blkmtn|br_koyo|Reese/);

    // Straight from one account to another, with no sign-out between.
    await act(async () => auth.signInAsTestAccount('new-organizer'));
    await waitFor(() => expect(shown()).toBe('signedIn | Sam | Porchlight Social | 0 bookings'));
    expect(cached()).not.toMatch(/Dana|Whitfield|Jordan|Second Sundays/);

    await act(async () => auth.signInAsTestAccount('existing-organizer'));
    await waitFor(() => expect(shown()).toBe('signedIn | Jordan | Second Sundays | 3 bookings'));
    expect(cached()).not.toMatch(/Porchlight|Sam/);
  });

  it('never shows the next person the last person’s screens while one signs out and the other signs in', async () => {
    const storage = createMemoryStorage();
    const repository = createFakeRepository({ delayMs: 0, storage });
    await renderWithProviders(<Probe />, { repository, storage });
    await act(async () => auth.signInAsTestAccount('existing-member'));
    await waitFor(() => expect(shown()).toContain('Dana'));
    const seen: string[] = [];
    const watch = setInterval(() => seen.push(shown()), 1);
    await act(async () => auth.signOut());
    await act(async () => auth.signInAsTestAccount('new-user'));
    await waitFor(() => expect(shown()).toContain('Alex'));
    clearInterval(watch);
    // Dana, then Alex. Never the sample organizer in between.
    expect(seen.join(' ')).not.toMatch(/Jordan|Second Sundays/);
  });
});

describe('what the phone keeps for one person', () => {
  const card: MemberCard = {
    name: 'Jordan Reese',
    communityCount: 3,
    memberships: [],
    qr: { token: 'memberly:card:cached', expiresAt: new Date(Date.now() + 3600_000).toISOString() },
  };
  async function phoneOf(viewerId: string) {
    const storage = createMemoryStorage();
    await claimDevice(storage, viewerId);
    await saveCachedCard(storage, card);
    await ensurePendingOffer(storage, { eventId: 'e_late_service', djId: 'dj_koyo', offerCents: 45000, note: '' }, { queued: true });
    await ensurePendingPassOrder(storage, { eventId: 'e_rooftop_hours', passTypeId: 'pt_rooftop_general' });
    return storage;
  }

  it('is cleared when a different person signs in: offline card, queued offers, unsettled pass orders', async () => {
    const storage = await phoneOf('u_jordan');
    await claimDevice(storage, 'u_test_member');
    expect(await storage.get(CARD_CACHE_KEY)).toBeNull();
    expect(await loadCachedCard(storage)).toBeNull();
    expect(await listPendingOffers(storage)).toEqual([]);
    expect(await listPendingPassOrders(storage)).toEqual([]);
    expect(await storage.get(DEVICE_OWNER_KEY)).toBe('u_test_member');
  });

  it('is kept when the same person signs back in, so a queued offer goes out under the id it already has', async () => {
    const storage = await phoneOf('u_jordan');
    const [before] = await listPendingOffers(storage);
    await claimDevice(storage, 'u_jordan');
    expect(await loadCachedCard(storage)).toMatchObject({ name: 'Jordan Reese' });
    expect((await listPendingOffers(storage))[0].clientOfferId).toBe(before.clientOfferId);
    expect(await listPendingPassOrders(storage)).toHaveLength(1);
  });

  it('is kept for a session restored at launch on a phone with no owner recorded, and cleared for a sign-in', async () => {
    const restored = createMemoryStorage();
    await saveCachedCard(restored, card);
    await claimDevice(restored, 'u_jordan', { atLaunch: true });
    expect(await loadCachedCard(restored)).not.toBeNull();
    expect(await restored.get(DEVICE_OWNER_KEY)).toBe('u_jordan');

    const signedIn = createMemoryStorage();
    await saveCachedCard(signedIn, card);
    await claimDevice(signedIn, 'u_test_member');
    expect(await loadCachedCard(signedIn)).toBeNull();
  });
});
