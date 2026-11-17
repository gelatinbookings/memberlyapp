import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import TabsLayout from '@/app/(tabs)/_layout';
import ManageScreen, { NO_EVENTS_TITLE } from '@/app/(tabs)/manage';
import MeScreen from '@/app/(tabs)/me';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { communityInput } from '@/test-utils/communityInput';

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
jest.mock('@/lib/photos', () => ({
  pickPhoto: jest.fn(async ({ square }: { square?: boolean } = {}) => ({ uri: square ? 'file:///logo.jpg' : 'file:///banner.jpg', bytes: 1000 })),
  pickPhotos: jest.fn(async () => [{ uri: 'file:///g1.jpg', bytes: 1000 }]),
  pickCoverPhoto: jest.fn(async () => ({ uri: 'file:///cover.jpg' })),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock; back: jest.Mock; dismissTo: jest.Mock } };
const { pickPhoto, pickPhotos } = jest.requireMock('@/lib/photos') as { pickPhoto: jest.Mock; pickPhotos: jest.Mock };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));
const type = (el: Parameters<typeof fireEvent.changeText>[0], text: string) => act(async () => fireEvent.changeText(el, text));
const next = () => press(screen.getByRole('button', { name: 'Continue' }));

async function signedInAs(id: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(id);
  return repository;
}

/** Step 1: name, tagline and description. */
async function fillStory(name = 'Night Garden') {
  await type(screen.getByTestId('community-name'), name);
  await type(screen.getByTestId('community-tagline'), 'Late sets under the trees.');
  await type(screen.getByTestId('community-description'), 'A monthly night for house music outdoors.');
}

/** Steps 1 to 3 filled in, landing on Membership pricing. */
async function toPricing(name = 'Night Garden') {
  await fillStory(name);
  await next();
  await press(screen.getByTestId('community-logo'));
  await press(screen.getByTestId('community-banner'));
  await next();
  await press(screen.getByTestId('community-city'));
  await press(await screen.findByTestId('city-atl'));
  await type(screen.getByTestId('tag-field'), 'mus');
  await press(screen.getByTestId('tag-suggest-Music'));
  await next();
}

beforeEach(() => {
  jest.clearAllMocks();
  delete params.community;
});

describe('Create community · step 1, Your story', () => {
  it('shows four steps and keeps Continue disabled, saying what is missing', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    expect(await screen.findByRole('header', { name: 'Your story' })).toBeTruthy();
    expect(screen.getByLabelText('Step 1 of 4, Your story')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a name to continue' })).toBeDisabled();
    await type(screen.getByTestId('community-name'), 'Night Garden');
    expect(screen.getByRole('button', { name: 'Add a tagline to continue' })).toBeDisabled();
    await type(screen.getByTestId('community-tagline'), 'Late sets under the trees.');
    expect(screen.getByRole('button', { name: 'Add a description to continue' })).toBeDisabled();
    await type(screen.getByTestId('community-description'), 'House music outdoors.');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('makes the link from the name, and keeps a typed one to letters, numbers and dashes', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await type(await screen.findByTestId('community-name'), 'Night Garden ATL');
    expect(screen.getByText('withmemberly.com/community/night-garden-atl')).toBeTruthy();
    await type(screen.getByTestId('community-slug'), 'The Garden!');
    expect(screen.getByTestId('community-slug').props.value).toBe('the-garden-');
    expect(screen.getByText('withmemberly.com/community/the-garden')).toBeTruthy();
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
    expect(buttons.map((b) => b.text)).toEqual(['Keep editing', 'Discard']);
    await act(async () => buttons[1].onPress?.());
    expect(router.back).toHaveBeenCalledTimes(2);
    alert.mockRestore();
  });
});

describe('Create community · step 2, Your look', () => {
  it('previews the public header with the name and tagline, and needs a logo and a banner', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await fillStory();
    await next();
    expect(screen.getByLabelText('Step 2 of 4, Your look')).toBeTruthy();
    const preview = within(screen.getByTestId('header-preview'));
    expect(preview.getByText('Night Garden')).toBeTruthy();
    expect(preview.getByText('Late sets under the trees.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a logo to continue' })).toBeDisabled();

    // The logo is cropped square; the banner is not.
    await press(screen.getByRole('button', { name: 'Add a logo' }));
    expect(pickPhoto).toHaveBeenLastCalledWith({ square: true });
    expect(screen.getByTestId('preview-logo-image')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a banner to continue' })).toBeDisabled();
    await press(screen.getByRole('button', { name: 'Add banner' }));
    expect(pickPhoto).toHaveBeenLastCalledWith({ square: false });
    expect(screen.getByTestId('preview-banner-image')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Replace banner' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('turns away a logo over 2 MB and says why', async () => {
    pickPhoto.mockResolvedValueOnce({ uri: 'file:///huge.jpg', bytes: 3 * 1024 * 1024 });
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await fillStory();
    await next();
    await press(screen.getByTestId('community-logo'));
    expect(screen.getByText('That logo is over 2 MB. Choose a smaller one.')).toBeTruthy();
    expect(screen.queryByTestId('preview-logo-image')).toBeNull();
  });

  it('adds gallery photos, leaves out any over 10 MB, and removes one on request', async () => {
    pickPhotos.mockResolvedValueOnce([
      { uri: 'file:///a.jpg', bytes: 1000 },
      { uri: 'file:///big.jpg', bytes: 11 * 1024 * 1024 },
    ]);
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await fillStory();
    await next();
    await press(screen.getByRole('button', { name: 'Add gallery photos' }));
    expect(pickPhotos).toHaveBeenCalledWith(10);
    expect(screen.getByTestId('gallery-photo-0')).toBeTruthy();
    expect(screen.queryByTestId('gallery-photo-1')).toBeNull();
    expect(screen.getByText('One photo was over 10 MB and wasn’t added.')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Remove photo 1' }));
    expect(screen.queryByTestId('gallery-photo-0')).toBeNull();
  });
});

describe('Create community · step 3, How people find you', () => {
  async function toDiscovery() {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await fillStory();
    await next();
    await press(screen.getByTestId('community-logo'));
    await press(screen.getByTestId('community-banner'));
    await next();
  }

  it('starts in the United States with the city optional, and lists that country’s cities', async () => {
    await toDiscovery();
    expect(screen.getByLabelText('Step 3 of 4, How people find you')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Country, United States' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    await press(screen.getByTestId('community-country'));
    await press(await screen.findByTestId('country-Canada'));
    await press(screen.getByTestId('community-city'));
    expect(await screen.findByText('No cities listed for Canada yet. City is optional.')).toBeTruthy();
  });

  it('offers a few suggested tags, matches as you type, and takes a tag of your own', async () => {
    await toDiscovery();
    const suggested = within(screen.getByTestId('tag-suggestions'));
    expect(suggested.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Add Nightlife',
      'Add House',
      'Add Afrobeats',
      'Add Upscale',
      'Add Rooftop',
      'Add Day party',
    ]);
    await press(screen.getByRole('button', { name: 'Add House' }));
    expect(screen.getByRole('button', { name: 'Remove House' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add House' })).toBeNull();

    await type(screen.getByTestId('tag-field'), 'jaz');
    expect(screen.getByText('Matches')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Add Jazz' }));
    expect(screen.getByTestId('tag-field').props.value).toBe('');

    await type(screen.getByTestId('tag-field'), 'Vinyl only!');
    await press(screen.getByRole('button', { name: 'Add your own tag, Vinyl only' }));
    expect(screen.getByRole('button', { name: 'Remove Vinyl only' })).toBeTruthy();
    expect(screen.getByText('3 of 10')).toBeTruthy();

    // Return adds what's typed, in the known spelling; a tap on a chosen tag removes it.
    await type(screen.getByTestId('tag-field'), 'rooftop');
    await act(async () => fireEvent(screen.getByTestId('tag-field'), 'submitEditing'));
    expect(screen.getByRole('button', { name: 'Remove Rooftop' })).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Remove House' }));
    expect(screen.queryByRole('button', { name: 'Remove House' })).toBeNull();
  });

  it('keeps social links and the referral code folded until asked, and won’t continue past a bad link', async () => {
    await toDiscovery();
    expect(screen.queryByTestId('link-instagram')).toBeNull();
    await press(screen.getByRole('button', { name: 'Social links, optional' }));
    await type(screen.getByTestId('link-instagram'), 'instagram nightgarden');
    expect(screen.getByText('Enter the full link, starting with https://')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fix the Instagram link to continue' })).toBeDisabled();
    await type(screen.getByTestId('link-instagram'), 'https://instagram.com/nightgarden');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();

    await press(screen.getByRole('button', { name: 'Referral code, optional' }));
    await type(screen.getByTestId('community-referral-code'), 'jordan reese!');
    expect(screen.getByTestId('community-referral-code').props.value).toBe('JORDANREESE');
  });
});

describe('Create community · step 4, Membership pricing', () => {
  it('Free to join shows no tiers; Paid starts with one tier called Member and the Stripe helper', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await toPricing();
    expect(screen.getByRole('header', { name: 'Membership pricing' })).toBeTruthy();
    expect(screen.getByLabelText('Step 4 of 4, Membership pricing')).toBeTruthy();
    expect(screen.queryByTestId('tier-editor')).toBeNull();
    expect(screen.getByRole('button', { name: 'Create community' })).toBeEnabled();

    await press(screen.getByTestId('membership-paid'));
    expect(screen.getByRole('header', { name: 'Your membership' })).toBeTruthy();
    expect(screen.getByTestId('tier-name-0').props.value).toBe('Member');
    expect(screen.getByText(new RegExp(STRIPE_HELPER))).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Add a price for Member to create' })).toBeDisabled();
    await type(screen.getByTestId('tier-price-0'), '25');
    expect(screen.getByRole('button', { name: 'Create community' })).toBeEnabled();
    await type(screen.getByTestId('tier-name-0'), '');
    expect(screen.getByRole('button', { name: 'Name your membership to create' })).toBeDisabled();
  });

  it('adds tiers in the moment, each needing its own name and price, and removes any while more than one', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await toPricing();
    await press(screen.getByTestId('membership-paid'));
    await type(screen.getByTestId('tier-price-0'), '25');
    await press(screen.getByRole('button', { name: 'Add a tier' }));
    expect(screen.getByRole('header', { name: 'Tier 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Name tier 2 to create' })).toBeDisabled();
    await type(screen.getByTestId('tier-name-1'), 'member');
    await type(screen.getByTestId('tier-price-1'), '60');
    expect(screen.getByRole('button', { name: 'Give each tier its own name' })).toBeDisabled();
    await type(screen.getByTestId('tier-name-1'), 'VIP');
    expect(screen.getByRole('button', { name: 'Create community' })).toBeEnabled();

    for (let i = 0; i < 3; i++) await press(screen.getByRole('button', { name: 'Add a tier' }));
    expect(screen.queryByRole('button', { name: 'Add a tier' })).toBeNull();
    for (const i of [4, 3, 2]) await press(screen.getByTestId(`tier-remove-${i}`));
    expect(screen.getByRole('button', { name: 'Remove VIP' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a tier' })).toBeTruthy();
  });

  it('Back steps through and keeps everything entered', async () => {
    await renderWithProviders(<CreateCommunityScreen />, { repository: await signedInAs('existing-member') });
    await toPricing('Kept Name');
    await press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'City (optional), Atlanta, GA' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove Music' })).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('preview-logo-image')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('community-name').props.value).toBe('Kept Name');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('creates it once with everything entered, makes the person an organizer and opens its Manage', async () => {
    const repository = await signedInAs('existing-member');
    expect((await repository.getViewer()).roles).toEqual(['member']);
    await renderWithProviders(<CreateCommunityScreen />, { repository });
    await toPricing();
    await press(screen.getByTestId('membership-paid'));
    await type(screen.getByTestId('tier-price-0'), '25');
    await press(screen.getByRole('button', { name: 'Add a tier' }));
    await type(screen.getByTestId('tier-name-1'), 'VIP');
    await type(screen.getByTestId('tier-price-1'), '60');
    await type(screen.getByTestId('tier-included-1'), 'Guest list plus one');
    await press(screen.getByRole('button', { name: 'Create community' }));

    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledTimes(1));
    const [communities, viewer] = await Promise.all([repository.getOrganizedCommunities(), repository.getViewer()]);
    expect(communities).toHaveLength(1);
    expect(communities[0]).toMatchObject({
      name: 'Night Garden',
      tagline: 'Late sets under the trees.',
      city: 'Atlanta',
      type: 'Music',
      memberCount: 1,
      logo: { uri: 'file:///logo.jpg' },
      cover: { uri: 'file:///banner.jpg' },
    });
    expect(viewer.roles).toContain('organizer');
    expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/manage', params: { community: communities[0].id } });
    // Each tier is a membership pass, in order, waiting on Stripe.
    const passes = await repository.getCommunityPasses(communities[0].id);
    expect(passes).toEqual([
      expect.objectContaining({ name: 'Member', priceCents: 2500, sellable: false }),
      expect.objectContaining({ name: 'VIP', priceCents: 6000, included: 'Guest list plus one', sellable: false }),
    ]);
  });

  it('a failed save keeps the entries and offers Try again; the retry makes one community, not two', async () => {
    const repository = await signedInAs('existing-member');
    await renderWithProviders(<CreateCommunityScreen />, { repository });
    await toPricing();
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
    await toPricing();
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
    const { community } = await repository.createCommunity(
      communityInput({
        membership: membership === 'paid' ? { kind: 'paid', tiers: [{ name: 'Member', monthlyPriceCents: 2500 }] } : { kind: 'free' },
        idempotencyKey: `k-${membership}`,
      }),
    );
    return { repository, community };
  }

  it('the Manage tab appears', async () => {
    const repository = await signedInAs('existing-member');
    await renderWithProviders(<TabsLayout />, { repository });
    await waitFor(() => expect(screen.getAllByTestId('tab-me').length).toBeGreaterThan(0));
    expect(screen.queryAllByTestId('tab-manage')).toHaveLength(0);
    screen.unmount();

    await repository.createCommunity(communityInput());
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
    const { community } = await repository.createCommunity(communityInput({ idempotencyKey: 'k2' }));
    params.community = community.id;
    await renderWithProviders(<ManageScreen />, { repository });
    expect(await screen.findByRole('header', { name: 'Night Garden' })).toBeTruthy();
    expect(screen.getByTestId('manage-community-c_second_sundays')).toBeTruthy();
    await press(screen.getByTestId('manage-tiers'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/passes', params: { id: community.id } });
  });
});
