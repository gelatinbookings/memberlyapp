import { act, fireEvent, screen, within } from '@testing-library/react-native';

import CommunityScreen from '@/app/community/[id]';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { communityInput } from '@/test-utils/communityInput';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

const params = { id: 'c_rooftop' };
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => params,
}));
const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

async function as(account: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(account);
  return repository;
}

async function open(id: string, repository: FakeRepository) {
  params.id = id;
  await renderWithProviders(<CommunityScreen />, { repository });
  await screen.findByRole('header', { name: 'Upcoming events' });
}

beforeEach(() => jest.clearAllMocks());

describe('the community page', () => {
  it('shows the profile: name, verified, tagline, members, location, About, tags and links', async () => {
    await open('c_rooftop', await as('new-user'));
    expect(screen.getByRole('header', { name: 'Rooftop Society' })).toBeTruthy();
    expect(screen.getByLabelText('Verified')).toBeTruthy();
    expect(screen.getByText('Skyline nights with a members-first guest list.')).toBeTruthy();
    expect(screen.getByText('410 members')).toBeTruthy();
    expect(screen.getByText('Atlanta, GA, United States')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Tags' })).toBeTruthy();
    expect(within(screen.getByTestId('community-links')).getByRole('link', { name: 'Instagram, instagram.com/rooftopsocietyatl' })).toBeTruthy();
  });

  it('lists its upcoming events, each opening its event page', async () => {
    await open('c_rooftop', await as('new-user'));
    await press(within(screen.getByTestId('community-events')).getByTestId('event-row-e_rooftop_hours'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/event/[id]', params: { id: 'e_rooftop_hours' } });
  });

  it('lists the memberships as the server words them; not a member: Become a member', async () => {
    await open('c_rooftop', await as('new-user'));
    const tiers = within(screen.getByTestId('community-memberships'));
    expect(tiers.getByText('Free tier')).toBeTruthy();
    expect(tiers.getByText('$35 a month')).toBeTruthy();
    expect(tiers.getByText('Free to join')).toBeTruthy();
    const bar = within(screen.getByTestId('community-footer'));
    await press(bar.getByRole('button', { name: 'Become a member' }));
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/later', params: expect.objectContaining({ title: 'Join Rooftop Society' }) }));
  });

  it('a member sees their tier marked and Show my card', async () => {
    await open('c_rooftop', await as('existing-organizer'));
    expect(within(screen.getByTestId('community-tier-cp_rooftop_free')).getByText('Your tier')).toBeTruthy();
    const bar = within(screen.getByTestId('community-footer'));
    expect(bar.getByText('You’re a member')).toBeTruthy();
    await press(bar.getByRole('button', { name: 'Show my card' }));
    expect(router.push).toHaveBeenCalledWith('/card');
  });

  it('a community made in the app shows what its organizer entered, and its owner gets Manage', async () => {
    const repository = await as('existing-member');
    const { community } = await repository.createCommunity(
      communityInput({
        links: { instagram: 'https://instagram.com/nightgarden' },
        gallery: [{ uri: 'file:///g1.jpg' }],
        membership: { kind: 'paid', tiers: [{ name: 'Member', monthlyPriceCents: 2500 }] },
        idempotencyKey: 'k-page',
      }),
    );
    await open(community.id, repository);
    expect(screen.getByText('Late sets under the trees.')).toBeTruthy();
    expect(screen.getByText('Atlanta, GA, United States')).toBeTruthy();
    expect(screen.getByTestId('community-gallery')).toBeTruthy();
    expect(within(screen.getByTestId('community-memberships')).getByText('$25 a month')).toBeTruthy();
    const bar = within(screen.getByTestId('community-footer'));
    expect(bar.getByText('You run this community')).toBeTruthy();
    await press(bar.getByRole('button', { name: 'Manage' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/manage', params: { community: community.id } });
  });

  it('says so when the community isn’t there', async () => {
    params.id = 'c_missing';
    await renderWithProviders(<CommunityScreen />, { repository: await as('new-user') });
    expect(await screen.findByText('This community isn’t available')).toBeTruthy();
  });
});
