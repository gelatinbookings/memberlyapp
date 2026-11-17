import { Alert } from 'react-native';
import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import ManageScreen from '@/app/manage';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import { communityInput } from '@/test-utils/communityInput';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { STRIPE_DONE_TITLE, STRIPE_LEAVE_TITLE, STRIPE_TEST_NOTE, StripeConnectScreen } from '../StripeConnectScreen';

const params: { community?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => params,
}));

/** A community with a paid tier, so Manage asks for Stripe. */
async function paidCommunity(): Promise<{ repository: FakeRepository; id: string }> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs('existing-member');
  const { community } = await repository.createCommunity(
    communityInput({ membership: { kind: 'paid', tiers: [{ name: 'Member', monthlyPriceCents: 1500 }] } }),
  );
  return { repository, id: community.id };
}

const press = async (el: Parameters<typeof fireEvent.press>[0]) => {
  await act(async () => fireEvent.press(el));
};
const next = async () => press(await screen.findByTestId('stripe-continue'));

beforeEach(() => jest.clearAllMocks());

describe('Connect Stripe', () => {
  it('Manage’s Connect opens Stripe onboarding for that community', async () => {
    const { repository, id } = await paidCommunity();
    params.community = id;
    await renderWithProviders(<ManageScreen />, { repository });
    await press(await screen.findByTestId('setup-stripe'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/stripe', params: { id } });
  });

  it('walks Stripe’s steps on test data, then the account is connected and the setup task is gone', async () => {
    const { repository, id } = await paidCommunity();
    expect((await repository.getCommunityOverview(id))?.setupTasks.map((t) => t.title)).toEqual(['Connect Stripe']);
    await renderWithProviders(<StripeConnectScreen communityId={id} />, { repository });

    expect(await screen.findByText(STRIPE_TEST_NOTE)).toBeTruthy();
    expect(screen.getByText('Test mode')).toBeTruthy();
    await next();

    // Verify: send a code, then the test code.
    await press(await screen.findByTestId('stripe-send-code'));
    expect(screen.getByTestId('stripe-continue')).toBeDisabled();
    await press(screen.getByTestId('stripe-test-code'));
    await next();

    await press(await screen.findByText('Company'));
    await next();
    expect(await screen.findByText('Company representative')).toBeTruthy();
    await next();
    expect(await screen.findByText('Where should payouts go?')).toBeTruthy();
    await next();

    const review = await screen.findByTestId('stripe-review-card');
    expect(within(review).getByText('STRIPE TEST BANK ••••6789')).toBeTruthy();
    expect(within(review).getByText(/^Company · /)).toBeTruthy();

    await press(screen.getByTestId('stripe-submit'));
    expect(await screen.findByText(STRIPE_DONE_TITLE, {}, { timeout: 4000 })).toBeTruthy();
    expect(await repository.getStripeAccount(id)).toEqual({
      status: 'connected',
      payoutsTo: 'STRIPE TEST BANK ••••6789',
      payoutSchedule: 'Weekly, on Mondays',
    });
    expect((await repository.getCommunityOverview(id))?.setupTasks).toEqual([]);
    // Paid tiers go on sale once Stripe is connected.
    expect((await repository.getCommunityPasses(id)).every((p) => p.sellable)).toBe(true);

    await press(screen.getByTestId('stripe-done'));
    expect(router.back).toHaveBeenCalled();
  }, 15000);

  it('leaving partway asks first, and Manage then offers to finish', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.find((b) => b.style === 'destructive')?.onPress?.());
    const { repository, id } = await paidCommunity();
    await renderWithProviders(<StripeConnectScreen communityId={id} />, { repository });
    await next();
    await press(screen.getByRole('button', { name: 'Close Stripe setup' }));
    expect(Alert.alert).toHaveBeenCalledWith(STRIPE_LEAVE_TITLE, expect.any(String), expect.any(Array));
    expect((await repository.getStripeAccount(id)).status).toBe('incomplete');
    const [task] = (await repository.getCommunityOverview(id))?.setupTasks ?? [];
    expect(task).toMatchObject({ id: 'stripe', title: 'Finish Stripe setup', actionLabel: 'Finish' });
  });

  it('offline: says Stripe couldn’t open and changes nothing', async () => {
    const { repository, id } = await paidCommunity();
    repository.fake.simulate({ offline: true });
    await renderWithProviders(<StripeConnectScreen communityId={id} />, { repository });
    expect(await screen.findByText('Couldn’t open Stripe')).toBeTruthy();
    repository.fake.simulate({ offline: false });
    expect((await repository.getStripeAccount(id)).status).toBe('not_connected');
  });
});
