import { act, fireEvent, screen, within } from '@testing-library/react-native';

import EventScreen from '@/app/event/[id]';
import { sampleEvents } from '@/data/fakeRepository';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { LINEUP_SOON_TITLE, PublicLineup } from '../PublicLineup';

const params = { id: 'e_warehouse_friday' };
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

async function open(eventId: string, account: TestAccountId) {
  params.id = eventId;
  await renderWithProviders(<EventScreen />, { repository: await as(account) });
  await screen.findByRole('header', { name: 'Event details' });
}

beforeEach(() => jest.clearAllMocks());

describe('the event page', () => {
  it('shows the badges, the host, and the details the server sent', async () => {
    await open('e_rooftop_hours', 'new-user');
    expect(screen.getByText('Nightlife')).toBeTruthy();
    expect(screen.getAllByText('Free for members').length).toBeGreaterThan(1);
    expect(screen.getByRole('link', { name: 'Hosted by Rooftop Society, verified' })).toBeTruthy();
    const details = within(screen.getByTestId('event-details'));
    expect(details.getByText('Skyline Terrace')).toBeTruthy();
    expect(details.getByText('75 Peachtree Pl NE, Atlanta, GA 30309')).toBeTruthy();
    expect(details.getByText(/guests from \$30/)).toBeTruthy();
  });

  it('keeps the Gelatin lineup: confirmed DJs and TBA, with no fees', async () => {
    await open('e_warehouse_friday', 'existing-organizer');
    const lineup = within(screen.getByTestId('event-lineup'));
    expect(lineup.getByText('DJs booked through Gelatin')).toBeTruthy();
    expect(lineup.getByText('KOYO')).toBeTruthy();
    expect(lineup.getByText('TBA')).toBeTruthy();
    expect(lineup.queryByText(/\$/)).toBeNull();
  });

  it('shows who’s going, About with its links, member perks and the host community', async () => {
    await open('e_warehouse_friday', 'existing-organizer');
    expect(screen.getByLabelText('Ada Okafor, Faith Gowen, Simone Hart, Carmen Reyes, and 86 more going')).toBeTruthy();
    expect(screen.getByRole('link', { name: '@secondsundaysatl' })).toBeTruthy();
    expect(within(screen.getByTestId('event-perks')).getByText('Skip the line')).toBeTruthy();
    const card = within(screen.getByTestId('event-host-card'));
    expect(card.getByText('Second Sundays')).toBeTruthy();
    await press(card.getByRole('button', { name: 'Visit community' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/community/[id]', params: { id: 'c_second_sundays' } });
  });
});

describe('the pinned bar', () => {
  it('free for members, not a member yet: the guest price, Become a member and Get a pass', async () => {
    await open('e_rooftop_hours', 'new-user');
    const bar = within(screen.getByTestId('event-footer'));
    expect(bar.getByText('$30')).toBeTruthy();
    expect(bar.getByText('Free for members · guests from $30')).toBeTruthy();
    expect(bar.getByRole('button', { name: 'Become a member' })).toBeTruthy();
    await press(bar.getByRole('button', { name: 'Get a pass' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/event/[id]/pass', params: { id: 'e_rooftop_hours' } });
  });

  it('already a member: just Get a pass', async () => {
    await open('e_rooftop_hours', 'existing-organizer');
    const bar = within(screen.getByTestId('event-footer'));
    expect(bar.queryByRole('button', { name: 'Become a member' })).toBeNull();
    expect(bar.getByRole('button', { name: 'Get a pass' })).toBeTruthy();
  });

  it('members only, not a member: Free, and joining is the way in', async () => {
    await open('e_night_service', 'new-user');
    expect(screen.getAllByText('Members only').length).toBeGreaterThan(1);
    const bar = within(screen.getByTestId('event-footer'));
    expect(bar.getByText('Free')).toBeTruthy();
    expect(bar.queryByRole('button', { name: 'Get a pass' })).toBeNull();
    await press(bar.getByRole('button', { name: 'Become a member' }));
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/later', params: expect.objectContaining({ title: 'Join Bass Church' }) }));
  });

  it('sales ended: Sales ended, disabled', async () => {
    await open('e_clay_and_wine', 'new-user');
    expect(screen.getAllByText('Sales ended').length).toBeGreaterThan(0);
    expect(within(screen.getByTestId('event-footer')).getByRole('button', { name: 'Sales ended' })).toBeDisabled();
  });

  it('with a pass: Show my pass', async () => {
    await open('e_warehouse_friday', 'existing-organizer');
    expect(within(screen.getByTestId('event-footer')).getByRole('button', { name: 'Show my pass' })).toBeTruthy();
  });
});

describe('PublicLineup', () => {
  it('every sample event has a lineup', () => {
    for (const e of sampleEvents) expect(e.publicLineup.length).toBeGreaterThan(0);
  });

  it('says Lineup coming soon before anyone is confirmed, and keeps the section', async () => {
    await renderWithProviders(<PublicLineup slots={[]} />);
    expect(screen.getByRole('header', { name: 'Lineup' })).toBeTruthy();
    expect(screen.getByText(LINEUP_SOON_TITLE)).toBeTruthy();
  });

  it('shows a TBA-only lineup on the event page', async () => {
    await open('e_listening_session', 'new-user');
    const lineup = within(screen.getByTestId('event-lineup'));
    expect(lineup.getByText('TBA')).toBeTruthy();
    expect(lineup.getByText('7 to 9')).toBeTruthy();
  });
});
