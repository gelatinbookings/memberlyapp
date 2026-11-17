import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';
import KitScreen from '@/app/kit';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { NEEDS_COMMUNITY } from '@/features/passSetup/passForm';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { CREATE_ROWS, NO_UPCOMING_EVENTS } from '../CreateSheet';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

async function signedInAs(id: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(id);
  return repository;
}

/** Home, with the Create sheet opened from the "+". */
async function openCreate(repository: FakeRepository) {
  await renderWithProviders(<HomeScreen />, { repository });
  await press(await screen.findByRole('button', { name: 'Create' }));
  const sheet = within(await screen.findByTestId('create-sheet'));
  // What the sheet reads (communities, their events) has arrived.
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  return sheet;
}

const FREE_MEMBERSHIP = { kind: 'free' } as const;

beforeEach(() => jest.clearAllMocks());

describe('the "+" on Home', () => {
  it('is a button VoiceOver reads as Create, at least 44pt', async () => {
    await renderWithProviders(<HomeScreen />, { repository: await signedInAs('existing-organizer') });
    const fab = await screen.findByRole('button', { name: 'Create' });
    expect(fab.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: 56, height: 56 })]));
  });

  it('is shown in the Parts kit', async () => {
    await renderWithProviders(<KitScreen />);
    expect(await screen.findByTestId('kit-fab')).toBeTruthy();
    expect(screen.getByText('Floating action button')).toBeTruthy();
  });

  it('opens Create with three rows, each with a title and one line', async () => {
    const sheet = await openCreate(await signedInAs('existing-organizer'));
    expect(sheet.getByRole('header', { name: 'Create' })).toBeTruthy();
    for (const row of Object.values(CREATE_ROWS)) {
      expect(sheet.getByRole('button', { name: `${row.title}. ${row.line}` })).toBeEnabled();
    }
    expect(sheet.queryByText(NEEDS_COMMUNITY)).toBeNull();
  });

  it('closes on a tap on the dim and changes nothing', async () => {
    const repository = await signedInAs('existing-organizer');
    await openCreate(repository);
    await press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('create-sheet')).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    expect(await repository.getOrganizedCommunities()).toHaveLength(1);
  });

  it('Create community opens the create-community flow', async () => {
    const sheet = await openCreate(await signedInAs('existing-organizer'));
    await press(sheet.getByTestId('create-community'));
    expect(router.push).toHaveBeenCalledWith('/organizer/communities/new');
    expect(screen.queryByTestId('create-sheet')).toBeNull();
  });
});

describe('an organizer with one community', () => {
  it('Add event opens Create New Event for that community', async () => {
    const sheet = await openCreate(await signedInAs('new-organizer'));
    await press(sheet.getByTestId('create-event'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/new', params: { community: 'c_porchlight' } });
  });

  it('Add pass → A community skips the list and opens pass setup for it', async () => {
    const sheet = await openCreate(await signedInAs('new-organizer'));
    await press(sheet.getByTestId('create-pass'));
    expect(sheet.getByRole('header', { name: 'Add a pass for' })).toBeTruthy();
    await press(sheet.getByTestId('create-pass-community'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/passes/new', params: { community: 'c_porchlight' } });
  });

  it('Add pass → An event with no events says so and offers New event', async () => {
    const sheet = await openCreate(await signedInAs('new-organizer'));
    await press(sheet.getByTestId('create-pass'));
    await press(sheet.getByTestId('create-pass-event'));
    expect(await sheet.findByText(NO_UPCOMING_EVENTS)).toBeTruthy();
    await press(sheet.getByRole('button', { name: 'New event' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/new', params: { community: 'c_porchlight' } });
  });

  it('Add pass → An event lists upcoming events (cover, name, date) and opens pass setup for the one chosen', async () => {
    const sheet = await openCreate(await signedInAs('existing-organizer'));
    await press(sheet.getByTestId('create-pass'));
    await press(sheet.getByTestId('create-pass-event'));
    const row = await sheet.findByTestId('create-pass-event-e_warehouse_friday');
    expect(within(row).getByText('Warehouse Friday')).toBeTruthy();
    expect(within(row).getByText('Fri, Nov 20')).toBeTruthy();
    await press(row);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/passes/new', params: { event: 'e_warehouse_friday' } });
  });

  it('a back arrow returns from the second step to the three rows', async () => {
    const sheet = await openCreate(await signedInAs('existing-organizer'));
    await press(sheet.getByTestId('create-pass'));
    await press(sheet.getByRole('button', { name: 'Back' }));
    expect(sheet.getByRole('header', { name: 'Create' })).toBeTruthy();
    expect(sheet.getByTestId('create-community')).toBeTruthy();
  });

  it('opens at the three rows again after it was closed part-way', async () => {
    await openCreate(await signedInAs('existing-organizer'));
    await press(screen.getByTestId('create-pass'));
    await press(screen.getByRole('button', { name: 'Close' }));
    await press(screen.getByRole('button', { name: 'Create' }));
    expect(within(await screen.findByTestId('create-sheet')).getByRole('header', { name: 'Create' })).toBeTruthy();
  });
});

describe('an organizer with several communities', () => {
  async function twoCommunities() {
    const repository = await signedInAs('existing-organizer');
    const { community } = await repository.createCommunity({
      name: 'Night Garden',
      city: 'Atlanta',
      type: 'Music',
      cover: null,
      membership: FREE_MEMBERSHIP,
      idempotencyKey: 'k-garden',
    });
    return { repository, second: community.id };
  }

  it('Add event asks "Add an event for" and opens Create New Event for the one chosen', async () => {
    const { repository, second } = await twoCommunities();
    const sheet = await openCreate(repository);
    await press(sheet.getByTestId('create-event'));
    expect(sheet.getByRole('header', { name: 'Add an event for' })).toBeTruthy();
    expect(sheet.getByText('Second Sundays')).toBeTruthy();
    expect(sheet.getByText('Night Garden')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
    await press(sheet.getByTestId(`create-event-for-${second}`));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/new', params: { community: second } });
  });

  it('Add pass → A community lists them to choose from', async () => {
    const { repository, second } = await twoCommunities();
    const sheet = await openCreate(repository);
    await press(sheet.getByTestId('create-pass'));
    await press(sheet.getByTestId('create-pass-community'));
    expect(sheet.getByText('Choose a community.')).toBeTruthy();
    expect(sheet.getByTestId('create-pass-for-c_second_sundays')).toBeTruthy();
    await press(sheet.getByTestId(`create-pass-for-${second}`));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/passes/new', params: { community: second } });
  });
});

describe('someone who runs no community', () => {
  it.each(['existing-member', 'new-user'] as const)('%s: Create community works; Add event and Add pass are disabled and say why', async (id) => {
    const sheet = await openCreate(await signedInAs(id));
    await waitFor(() => expect(sheet.getByText(NEEDS_COMMUNITY)).toBeTruthy());
    expect(sheet.getByTestId('create-event')).toBeDisabled();
    expect(sheet.getByTestId('create-pass')).toBeDisabled();
    await press(sheet.getByTestId('create-event'));
    await press(sheet.getByTestId('create-pass'));
    expect(router.push).not.toHaveBeenCalled();
    expect(sheet.getByRole('header', { name: 'Create' })).toBeTruthy();
    await press(sheet.getByTestId('create-community'));
    expect(router.push).toHaveBeenCalledWith('/organizer/communities/new');
  });
});
