import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { Share } from 'react-native';

import MeScreen from '@/app/(tabs)/me';
import ReferralsScreen, { REFERRALS_EMPTY } from '@/app/referrals';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

async function as(account: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(account);
  return repository;
}

beforeEach(() => jest.clearAllMocks());

describe('Referrals', () => {
  it('shows the viewer’s code and link, and shares them', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const repository = await as('existing-member');
    const { firstName, lastName } = await repository.getViewer();
    const code = `${firstName}${lastName}`.toUpperCase();
    await renderWithProviders(<ReferralsScreen />, { repository });
    expect(await screen.findByTestId('referral-code')).toHaveTextContent(code);
    expect(screen.getByText(`withmemberly.com/r/${code.toLowerCase()}`)).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Share your link' }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining(code), url: `https://withmemberly.com/r/${code.toLowerCase()}` }));
    share.mockRestore();
  });

  it('lists the people who joined with the code, and who started a community', async () => {
    await renderWithProviders(<ReferralsScreen />, { repository: await as('existing-organizer') });
    const people = within(await screen.findByTestId('referrals-people'));
    expect(people.getByText('4 joined')).toBeTruthy();
    expect(people.getByLabelText('Tasha Green, Started Southside Run Club')).toBeTruthy();
    expect(people.getByLabelText('Marcus Lee, Joined Nov 3')).toBeTruthy();
  });

  it('says what to do when nobody has joined yet', async () => {
    await renderWithProviders(<ReferralsScreen />, { repository: await as('new-user') });
    expect(await screen.findByText(REFERRALS_EMPTY)).toBeTruthy();
  });

  it('never shows an amount or reward', async () => {
    await renderWithProviders(<ReferralsScreen />, { repository: await as('existing-organizer') });
    await screen.findByTestId('referrals-people');
    expect(screen.queryByText(/\$|%|earn|reward|commission/i)).toBeNull();
  });

  it('opens from Me, whose row counts who joined', async () => {
    await renderWithProviders(<MeScreen />, { repository: await as('existing-organizer') });
    const row = await screen.findByRole('button', { name: /Referrals/ });
    expect(await within(row).findByText('4 joined')).toBeTruthy();
    await press(row);
    expect(router.push).toHaveBeenCalledWith('/referrals');
  });
});
