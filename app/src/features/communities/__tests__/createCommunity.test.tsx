import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import TabsLayout from '@/app/(tabs)/_layout';
import ManageScreen, { NO_EVENTS_TITLE } from '@/app/(tabs)/manage';
import MeScreen from '@/app/(tabs)/me';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { CREATE_FAILED, STRIPE_HELPER } from '../communityForm';
import { CreateCommunityScreen } from '../CreateCommunityScreen';

const params: { community?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => params,
}));
jest.mock('expo-router/ui', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Pass = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  const Trigger = ({ name, children }: { name: string; href?: string; asChild?: boolean; children?: React.ReactNode }) => (
    <View testID={`tab-${name}`}>{children}</View>
  );
  return { Tabs: Pass, TabSlot: () => null, TabList: Pass, TabTrigger: Trigger };
});
jest.mock('@/lib/photos', () => ({ pickCoverPhoto: jest.fn(async () => ({ uri: 'file:///cover.jpg' })) }));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock; back: jest.Mock; dismissTo: jest.Mock } };
const { pickCoverPhoto } = jest.requireMock('@/lib/photos') as { pickCoverPhoto: jest.Mock };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));
const type = (el: Parameters<typeof fireEvent.changeText>[0], text: string) => act(async () => fireEvent.changeText(el, text));

async function signedInAs(id: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(id);
  return repository;
}

/** Fill step 1 with a name, Atlanta and Music. */
async function fillDetails(name = 'Night Garden') {
  await type(screen.getByTestId('community-name'), name);
  await press(screen.getByTestId('community-city'));
  await press(await screen.findByTestId('city-atl'));
  await press(screen.getByTestId('community-type-Music'));
}

beforeEach(() => {
  jest.clearAllMocks();
  delete params.community;
});

describe('Create community · step 1, Community details', () => {
  it('shows the step header and keeps Continue disabled, saying what is missing', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    expect(await screen.findByRole('header', { name: 'Community details' })).toBeTruthy();
    expect(screen.getByLabelText('Step 1 of 2, Community details')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a name to continue' })).toBeDisabled();
    await type(screen.getByTestId('community-name'), 'Night Garden');
    expect(screen.getByRole('button', { name: 'Choose a city to continue' })).toBeDisabled();
    await press(screen.getByTestId('community-city'));
    await press(await screen.findByTestId('city-atl'));
    expect(screen.getByRole('button', { name: 'Choose a type to continue' })).toBeDisabled();
    await press(screen.getByTestId('community-type-Music'));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('offers the six Explore types and an optional cover from the photo library', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    for (const t of ['Nightlife', 'Food & wine', 'Music', 'Networking', 'Art', 'Wellness']) {
      expect(await screen.findByTestId(`community-type-${t}`)).toBeTruthy();
    }
    expect(screen.getByText('Optional. You can add one later.')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Add a cover photo, optional' }));
    expect(pickCoverPhoto).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('community-cover-image')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByTestId('community-cover-image')).toBeNull();
  });

  it('closing with nothing entered leaves at once; with entries it asks before discarding', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await press(await screen.findByRole('button', { name: 'Back' }));
    expect(alert).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);

    await type(screen.getByTestId('community-name'), 'Night Garden');
    await press(screen.getByRole('button', { name: 'Back' }));
    expect(alert).toHaveBeenCalledWith('Discard this community?', expect.any(String), expect.any(Array));
    expect(router.back).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0][2]!;
    // Keep editing changes nothing; Discard leaves.
    expect(buttons.map((b) => b.text)).toEqual(['Keep editing', 'Discard']);
    await act(async () => buttons[1].onPress?.());
    expect(router.back).toHaveBeenCalledTimes(2);
    alert.mockRestore();
  });
});

describe('Create community · step 2, Membership pricing', () => {
  it('Free to join shows no price; Paid shows a name defaulting to Member, a monthly price and the Stripe helper', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await fillDetails();
    await press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('header', { name: 'Membership pricing' })).toBeTruthy();
    expect(screen.getByLabelText('Step 2 of 2, Membership pricing')).toBeTruthy();
    expect(screen.queryByTestId('membership-price')).toBeNull();
    expect(screen.getByRole('button', { name: 'Create community' })).toBeEnabled();

    await press(screen.getByTestId('membership-paid'));
    expect(screen.getByTestId('membership-name').props.value).toBe('Member');
    expect(screen.getByText(STRIPE_HELPER)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a monthly price to create' })).toBeDisabled();
    await type(screen.getByTestId('membership-price'), '25');
    expect(screen.getByRole('button', { name: 'Create community' })).toBeEnabled();
    await type(screen.getByTestId('membership-name'), '');
    expect(screen.getByRole('button', { name: 'Add a membership name to create' })).toBeDisabled();
  });

  it('Back keeps what step 1 holds', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await fillDetails('Kept Name');
    await press(screen.getByRole('button', { name: 'Continue' }));
    await press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('community-name').props.value).toBe('Kept Name');
    expect(screen.getByRole('button', { name: 'City, Atlanta, GA' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('creates it once, makes the person an organizer and opens its Manage', async () => {
    const repository = await signedInAs('existing-member');
    expect((await repository.getViewer()).roles).toEqual(['member']);
    await renderWithProviders(<CreateCommunityScreen />, { repository });
    await fillDetails();
    await press(screen.getByRole('button', { name: 'Continue' }));
    await press(screen.getByTestId('membership-paid'));
    await type(screen.getByTestId('membership-price'), '25');
    await press(screen.getByRole('button', { name: 'Create community' }));

    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledTimes(1));
    const [communities, viewer] = await Promise.all([repository.getOrganizedCommunities(), repository.getViewer()]);
    expect(communities).toHaveLength(1);
    expect(communities[0]).toMatchObject({ name: 'Night Garden', city: 'Atlanta', type: 'Music', memberCount: 1, cover: null });
    expect(viewer.roles).toContain('organizer');
    expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/manage', params: { community: communities[0].id } });
    // The paid membership is its first pass, waiting on Stripe.
    const passes = await repository.getCommunityPasses(communities[0].id);
    expect(passes).toEqual([expect.objectContaining({ name: 'Member', priceCents: 2500, sellable: false })]);
  });

  it('a failed save keeps the entries and offers Try again; the retry makes one community, not two', async () => {
    const repository = await signedInAs('existing-member');
    await renderWithProviders(<CreateCommunityScreen />, { repository });
    await fillDetails();
    await press(screen.getByRole('button', { name: 'Continue' }));
    // Saved on the server, but the answer is lost.
    repository.fake.simulate({ timeoutNextSave: true });
    await press(screen.getByRole('button', { name: 'Create community' }));
    expect(await screen.findByText(CREATE_FAILED)).toBeTruthy();
    expect(router.dismissTo).not.toHaveBeenCalled();
    await press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledTimes(1));
    expect(await repository.getOrganizedCommunities()).toHaveLength(1);
  });

  it('offline: the error names the recovery and nothing is created', async () => {
    const repository = await signedInAs('existing-member');
    await renderWithProviders(<CreateCommunityScreen />, { repository });
    await fillDetails();
    await press(screen.getByRole('button', { name: 'Continue' }));
    repository.fake.simulate({ offline: true });
    await press(screen.getByRole('button', { name: 'Create community' }));
    expect(await screen.findByText(CREATE_FAILED)).toBeTruthy();
    repository.fake.simulate({ offline: false });
    expect(await repository.getOrganizedCommunities()).toHaveLength(0);
  });
});

describe('after creating a community', () => {
  async function created(membership: 'free' | 'paid') {
    const repository = await signedInAs('existing-member');
    const { community } = await repository.createCommunity({
      name: 'Night Garden',
      city: 'Atlanta',
      type: 'Music',
      cover: null,
      membership: membership === 'paid' ? { kind: 'paid', name: 'Member', monthlyPriceCents: 2500 } : { kind: 'free' },
      idempotencyKey: `k-${membership}`,
    });
    return { repository, community };
  }

  it('the Manage tab appears', async () => {
    const repository = await signedInAs('existing-member');
    await renderWithProviders(<TabsLayout />, { repository });
    await waitFor(() => expect(screen.getAllByTestId('tab-me').length).toBeGreaterThan(0));
    expect(screen.queryAllByTestId('tab-manage')).toHaveLength(0);
    screen.unmount();

    await repository.createCommunity({ name: 'Night Garden', city: 'Atlanta', type: 'Music', cover: null, membership: { kind: 'free' }, idempotencyKey: 'k' });
    await renderWithProviders(<TabsLayout />, { repository });
    await waitFor(() => expect(screen.queryAllByTestId('tab-manage').length).toBeGreaterThan(0));
  });

  it('Me lists it under You organize and no longer offers Start a community', async () => {
    const { repository } = await created('free');
    await renderWithProviders(<MeScreen />, { repository });
    expect(await screen.findByText('You organize')).toBeTruthy();
    expect(screen.getByText('Night Garden')).toBeTruthy();
    expect(screen.getByText('Owner · 1 member')).toBeTruthy();
    expect(screen.queryByTestId('start-community')).toBeNull();
  });

  it('Manage opens on it with "No events yet" and New event; a paid membership shows Connect Stripe', async () => {
    const { repository, community } = await created('paid');
    params.community = community.id;
    await renderWithProviders(<ManageScreen />, { repository });
    expect(await screen.findByRole('header', { name: 'Night Garden' })).toBeTruthy();
    expect(screen.getByText(NO_EVENTS_TITLE)).toBeTruthy();
    const setup = within(screen.getByTestId('manage-setup'));
    expect(setup.getByText('Finish setting up')).toBeTruthy();
    expect(setup.getByText('Connect Stripe')).toBeTruthy();
    await press(within(screen.getByTestId('manage-no-events')).getByRole('button', { name: 'New event' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/new', params: { community: community.id } });
  });

  it('a free community has nothing to finish setting up', async () => {
    const { repository, community } = await created('free');
    params.community = community.id;
    await renderWithProviders(<ManageScreen />, { repository });
    expect(await screen.findByRole('header', { name: 'Night Garden' })).toBeTruthy();
    expect(screen.queryByTestId('manage-setup')).toBeNull();
  });

  it('it is the creator’s alone: no other test account sees it', async () => {
    const { repository } = await created('free');
    for (const other of ['new-user', 'new-organizer', 'existing-organizer'] as const) {
      await repository.fake.signInAs(other);
      const names = (await repository.getOrganizedCommunities()).map((c) => c.name);
      expect(names).not.toContain('Night Garden');
    }
    await repository.fake.signInAs('existing-member');
    expect((await repository.getOrganizedCommunities()).map((c) => c.name)).toEqual(['Night Garden']);
  });

  it('with two communities, Manage switches between them and Tiers opens the chosen one’s passes', async () => {
    const repository = await signedInAs('existing-organizer');
    const { community } = await repository.createCommunity({
      name: 'Night Garden',
      city: 'Atlanta',
      type: 'Music',
      cover: null,
      membership: { kind: 'free' },
      idempotencyKey: 'k2',
    });
    params.community = community.id;
    await renderWithProviders(<ManageScreen />, { repository });
    expect(await screen.findByRole('header', { name: 'Night Garden' })).toBeTruthy();
    expect(screen.getByTestId('manage-community-c_second_sundays')).toBeTruthy();
    await press(screen.getByTestId('manage-tiers'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/passes', params: { id: community.id } });
  });
});
