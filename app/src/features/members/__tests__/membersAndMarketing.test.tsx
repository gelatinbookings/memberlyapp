import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import ManageScreen from '@/app/manage';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { MarketingScreen, NO_MEMBERS_TO_MESSAGE, SENT_NOTICE } from '../MarketingScreen';
import { MembersScreen, noMatchLine, ONLY_YOU_TITLE, PAST_DUE_LABEL } from '../MembersScreen';

const params: { community?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => params,
}));

const SUNDAYS = 'c_second_sundays';
const PORCHLIGHT = 'c_porchlight';
const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));
const type = async (el: Parameters<typeof fireEvent.changeText>[0], text: string) => {
  await act(async () => fireEvent.changeText(el, text));
};

async function as(id: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(id);
  return repository;
}

beforeEach(() => jest.clearAllMocks());

describe('Manage', () => {
  it('Members and Marketing open their screens, not a placeholder', async () => {
    const repository = await as('existing-organizer');
    params.community = SUNDAYS;
    await renderWithProviders(<ManageScreen />, { repository });
    await press(await screen.findByTestId('manage-members'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/members', params: { id: SUNDAYS } });
    await press(screen.getByTestId('manage-marketing'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/marketing', params: { id: SUNDAYS } });
  });
});

describe('Members', () => {
  it('lists everyone, the organizer first, with tiers to filter by and a search', async () => {
    const repository = await as('existing-organizer');
    await renderWithProviders(<MembersScreen communityId={SUNDAYS} />, { repository });
    expect(await screen.findByText('Second Sundays · 1,204 members')).toBeTruthy();
    expect(screen.getByLabelText(/^Jordan .*, you, Owner/)).toBeTruthy();
    expect(screen.getAllByText(PAST_DUE_LABEL).length).toBeGreaterThan(0);
    expect(screen.getByTestId('members-tier-Inner Circle')).toBeTruthy();

    await press(screen.getByTestId('members-tier-Inner Circle'));
    await waitFor(() => expect(screen.getByTestId('members-matching')).toHaveTextContent(/matches/));
    const tiers = (await repository.getCommunityMembers(SUNDAYS, { tier: 'Inner Circle' })).members.map((m) => m.tier);
    expect(new Set(tiers)).toEqual(new Set(['Inner Circle']));

    await type(screen.getByTestId('members-search'), 'zzz');
    expect(await screen.findByText(noMatchLine('zzz'), {}, { timeout: 2000 })).toBeTruthy();
  });

  it('pages through 30 at a time', async () => {
    const repository = await as('existing-organizer');
    await renderWithProviders(<MembersScreen communityId={SUNDAYS} />, { repository });
    await screen.findByTestId('members-more');
    expect(screen.getAllByTestId(/^member-/)).toHaveLength(30);
    await press(screen.getByTestId('members-more'));
    await waitFor(() => expect(screen.getAllByTestId(/^member-/)).toHaveLength(60));
  });

  it('a community with only its organizer says so and points to Marketing', async () => {
    const repository = await as('new-organizer');
    await renderWithProviders(<MembersScreen communityId={PORCHLIGHT} />, { repository });
    expect(await screen.findByText(ONLY_YOU_TITLE)).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Open Marketing' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/marketing', params: { id: PORCHLIGHT } });
  });
});

describe('Marketing', () => {
  it('shows the page link and what was sent, and sends an announcement to one tier after asking', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.find((b) => b.text === 'Send')?.onPress?.());
    const repository = await as('existing-organizer');
    await renderWithProviders(<MarketingScreen communityId={SUNDAYS} />, { repository });
    expect(await screen.findByTestId('marketing-link')).toHaveTextContent('withmemberly.com/c/c_second_sundays');
    expect(screen.getByTestId('announcement-an_sundays_2')).toBeTruthy();

    await press(await screen.findByTestId('audience-Inner Circle'));
    await type(screen.getByTestId('announcement-body'), 'Doors at 9 this Friday.');
    const send = screen.getByTestId('announcement-send');
    expect(send).toHaveTextContent(/^Send to [\d,]+ members$/);
    await press(send);

    expect(Alert.alert).toHaveBeenCalled();
    expect(await screen.findByText(SENT_NOTICE)).toBeTruthy();
    const [latest] = (await repository.getCommunityMarketing(SUNDAYS)).announcements;
    expect(latest).toMatchObject({ body: 'Doors at 9 this Friday.', audienceLabel: 'Inner Circle', sentLabel: 'Just now' });
    expect(await screen.findByText('Doors at 9 this Friday.')).toBeTruthy();
  });

  it('with no members yet, there is no one to message', async () => {
    const repository = await as('new-organizer');
    await renderWithProviders(<MarketingScreen communityId={PORCHLIGHT} />, { repository });
    expect(await screen.findByText(NO_MEMBERS_TO_MESSAGE)).toBeTruthy();
    expect(within(screen.getByTestId('marketing')).queryByTestId('announcement-send')).toBeNull();
  });
});
