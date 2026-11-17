import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { RepositoryError } from '@/data/errors';
import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import type { TestAccountId } from '@/data/testAccounts';
import { EMPTY_FIELDS } from '@/features/events/completeness';
import { ACCESS_EMPTY_SUMMARY, EventFormScreen } from '@/features/events/EventFormScreen';
import { PassSheet } from '@/features/passes/PassSheet';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { PARENT_UNAVAILABLE_DETAIL, PARENT_UNAVAILABLE_TITLE, STRIPE_NOTICE, passesSummary } from '../passForm';
import { PassFormScreen } from '../PassFormScreen';
import { NO_PASSES_TITLE, PassListScreen, WAITING_ON_STRIPE } from '../PassListScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), setParams: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock; back: jest.Mock; dismissTo: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));
const type = (el: Parameters<typeof fireEvent.changeText>[0], text: string) => act(async () => fireEvent.changeText(el, text));

async function signedInAs(id: TestAccountId): Promise<FakeRepository> {
  const repository = createFakeRepository({ delayMs: 0 });
  await repository.fake.signInAs(id);
  return repository;
}

const SUNDAYS = 'c_second_sundays';
const PORCHLIGHT = 'c_porchlight';
/** Second Sundays' event with no passes yet. */
const LATE_SERVICE = 'e_late_service';

beforeEach(() => jest.clearAllMocks());

describe('a community pass (a membership)', () => {
  it('the first pass on a community with none: name, Free or Monthly, included, member limit; Save says why it is disabled', async () => {
    const repository = await signedInAs('new-organizer');
    await renderWithProviders(<PassFormScreen scope="community" parentId={PORCHLIGHT} />, { repository });
    expect(await screen.findByRole('header', { name: 'Community pass' })).toBeTruthy();
    expect(await screen.findByText('Porchlight Social')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a name to save' })).toBeDisabled();
    expect(screen.queryByTestId('pass-free-for-members')).toBeNull();

    await type(screen.getByTestId('pass-name'), 'Regular');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await press(screen.getByTestId('pass-paid'));
    expect(screen.getByRole('button', { name: 'Enter a price to save' })).toBeDisabled();
    await type(screen.getByTestId('pass-price'), '0');
    expect(screen.getByRole('button', { name: 'Enter a price to save' })).toBeDisabled();
    await type(screen.getByTestId('pass-price'), '15');
    await type(screen.getByTestId('pass-included'), 'Entry to every Porchlight night');
    await type(screen.getByTestId('pass-limit'), '0');
    expect(screen.getByRole('button', { name: 'Enter a member limit above 0' })).toBeDisabled();
    await type(screen.getByTestId('pass-limit'), '100');
    await press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/organizer/communities/[id]/passes', params: { id: PORCHLIGHT } }));
    expect(await repository.getCommunityPasses(PORCHLIGHT)).toEqual([
      expect.objectContaining({ name: 'Regular', priceCents: 1500, included: 'Entry to every Porchlight night', limit: 100, active: true, sellable: false }),
    ]);
  });

  it('a free pass needs nothing and is on sale at once', async () => {
    const repository = await signedInAs('new-organizer');
    await renderWithProviders(<PassFormScreen scope="community" parentId={PORCHLIGHT} />, { repository });
    await type(await screen.findByTestId('pass-name'), 'Friend');
    await press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalled());
    expect(await repository.getCommunityPasses(PORCHLIGHT)).toEqual([expect.objectContaining({ name: 'Friend', priceCents: null, sellable: true })]);
  });

  it('Tiers: empty, then one pass; a paid pass waits on Stripe with the notice and the Connect Stripe task', async () => {
    const repository = await signedInAs('new-organizer');
    await renderWithProviders(<PassListScreen scope="community" parentId={PORCHLIGHT} />, { repository });
    expect(await screen.findByText(NO_PASSES_TITLE)).toBeTruthy();
    await press(screen.getByTestId('passes-add-first'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/passes/new', params: { community: PORCHLIGHT } });
    screen.unmount();

    await repository.createCommunityPass(PORCHLIGHT, { name: 'Regular', monthlyPriceCents: 1500, included: 'Every night', idempotencyKey: 'k1' });
    await renderWithProviders(<PassListScreen scope="community" parentId={PORCHLIGHT} />, { repository });
    const row = within(await screen.findByTestId(/^pass-row-/));
    expect(row.getByText('Regular')).toBeTruthy();
    expect(row.getByText('$15 a month · No members yet')).toBeTruthy();
    expect(row.getByText(WAITING_ON_STRIPE)).toBeTruthy();
    expect(screen.getByText(STRIPE_NOTICE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Connect Stripe' })).toBeTruthy();
    expect(screen.getByTestId('passes-add')).toBeTruthy();
    const overview = await repository.getCommunityOverview(PORCHLIGHT);
    expect(overview?.setupTasks.map((t) => t.title)).toContain('Connect Stripe');
  });

  it('saving twice after a lost answer makes one pass', async () => {
    const repository = await signedInAs('new-organizer');
    await renderWithProviders(<PassFormScreen scope="community" parentId={PORCHLIGHT} />, { repository });
    await type(await screen.findByTestId('pass-name'), 'Regular');
    repository.fake.simulate({ timeoutNextSave: true });
    await press(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Couldn’t save this pass. Try again.')).toBeTruthy();
    await press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledTimes(1));
    expect(await repository.getCommunityPasses(PORCHLIGHT)).toHaveLength(1);
  });

  it('edits a pass and turns it off', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<PassFormScreen scope="community" parentId={SUNDAYS} passId="cp_sundays_inner_circle" />, { repository });
    expect(await screen.findByRole('header', { name: 'Edit pass' })).toBeTruthy();
    expect((await screen.findByTestId('pass-name')).props.value).toBe('Inner Circle');
    expect(screen.getByTestId('pass-price').props.value).toBe('25');
    await type(screen.getByTestId('pass-name'), 'Inner Circle Plus');
    await type(screen.getByTestId('pass-price'), '30');
    await press(screen.getByRole('switch', { name: 'On sale' }));
    await press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const pass = (await repository.getCommunityPasses(SUNDAYS)).find((p) => p.id === 'cp_sundays_inner_circle');
    expect(pass).toMatchObject({ name: 'Inner Circle Plus', priceCents: 3000, active: false, heldCount: 310 });
  });

  it('a pass people hold can be turned off but not deleted', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<PassFormScreen scope="community" parentId={SUNDAYS} passId="cp_sundays_member" />, { repository });
    expect(await screen.findByTestId('pass-held')).toBeTruthy();
    expect(screen.getByText('894 people hold this pass. You can turn it off, but it can’t be deleted.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Delete pass' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'On sale' })).toBeTruthy();
    await expect(repository.deletePass('cp_sundays_member')).rejects.toMatchObject({ code: 'pass_held' });
  });

  it('a pass nobody holds can be deleted, after a confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const repository = await signedInAs('new-organizer');
    const made = await repository.createCommunityPass(PORCHLIGHT, { name: 'Friend', monthlyPriceCents: null, included: '', idempotencyKey: 'k' });
    await renderWithProviders(<PassFormScreen scope="community" parentId={PORCHLIGHT} passId={made.id} />, { repository });
    await press(await screen.findByRole('button', { name: 'Delete pass' }));
    expect(alert).toHaveBeenCalledWith('Delete Friend?', expect.any(String), expect.any(Array));
    await act(async () => alert.mock.calls[0][2]![1].onPress?.());
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(await repository.getCommunityPasses(PORCHLIGHT)).toHaveLength(0);
    alert.mockRestore();
  });
});

describe('an event pass', () => {
  it('has a quantity and Free for members; saving lands on the event’s pass list', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<PassFormScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    expect(await screen.findByRole('header', { name: 'Event pass' })).toBeTruthy();
    expect(await screen.findByText('Late Service')).toBeTruthy();
    expect(screen.getByLabelText('Quantity')).toBeTruthy();
    await type(screen.getByTestId('pass-name'), 'Early entry');
    await press(screen.getByTestId('pass-paid'));
    await type(screen.getByTestId('pass-price'), '20');
    await type(screen.getByTestId('pass-limit'), '40');
    await press(screen.getByRole('switch', { name: 'Free for members' }));
    await press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/passes', params: { id: LATE_SERVICE } }));
    expect(await repository.getOrganizerEventPasses(LATE_SERVICE)).toEqual([
      expect.objectContaining({ name: 'Early entry', priceCents: 2000, limit: 40, freeForMembers: true }),
    ]);
  });

  it('Quantity has minus and plus: plus from empty starts at 1, minus from 1 is no limit, typing still works', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<PassFormScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    const field = await screen.findByTestId('pass-limit');
    expect(field.props.value).toBe('');
    await press(screen.getByRole('button', { name: 'Increase quantity' }));
    await press(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getByTestId('pass-limit').props.value).toBe('2');
    await press(screen.getByRole('button', { name: 'Decrease quantity' }));
    await press(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByTestId('pass-limit').props.value).toBe('');
    // Minus does nothing with no limit set.
    await press(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(screen.getByTestId('pass-limit').props.value).toBe('');
    await type(screen.getByTestId('pass-limit'), '150');
    await press(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getByTestId('pass-limit').props.value).toBe('151');
  });

  it('an event this account doesn’t run says so instead of showing a form that can’t save', async () => {
    const repository = await signedInAs('new-organizer');
    await renderWithProviders(<PassFormScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    expect(await screen.findByText(PARENT_UNAVAILABLE_TITLE)).toBeTruthy();
    expect(screen.getByText(PARENT_UNAVAILABLE_DETAIL.event)).toBeTruthy();
    expect(screen.queryByTestId('pass-name')).toBeNull();
  });

  it('a new organizer adds a pass to their own new event, with the quantity set by plus', async () => {
    const repository = await signedInAs('new-organizer');
    const [own] = await repository.getOrganizedCommunities();
    const event = await repository.saveEvent({ communityId: own.id, fields: { ...EMPTY_FIELDS, name: 'Porch Night' }, publish: false });
    await renderWithProviders(<PassFormScreen scope="event" parentId={event.id} />, { repository });
    await type(await screen.findByTestId('pass-name'), 'General admission');
    for (let i = 0; i < 3; i++) await press(screen.getByRole('button', { name: 'Increase quantity' }));
    await press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(router.dismissTo).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/passes', params: { id: event.id } }));
    expect(await repository.getOrganizerEventPasses(event.id)).toEqual([expect.objectContaining({ name: 'General admission', limit: 3 })]);
  });

  it('a save the server refuses as not found says why and doesn’t offer Try again', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<PassFormScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    await type(await screen.findByTestId('pass-name'), 'Early entry');
    // The event goes away (or changes hands) after the form opened.
    jest.spyOn(repository, 'createEventPass').mockRejectedValueOnce(new RepositoryError('not_found'));
    await press(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(PARENT_UNAVAILABLE_DETAIL.event)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByTestId('pass-save')).toBeDisabled();
  });

  it('a new pass shows in Access & passes with a summary', async () => {
    const repository = await signedInAs('existing-organizer');
    await repository.createEventPass(LATE_SERVICE, { name: 'Early entry', priceCents: null, included: 'Before 10 PM', freeForMembers: false, idempotencyKey: 'a' });
    await renderWithProviders(<EventFormScreen eventId={LATE_SERVICE} />, { repository });
    const section = await screen.findByTestId('section-access');
    await waitFor(() => expect(within(section).getByText('1 pass · free')).toBeTruthy());
    await press(section);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/passes', params: { id: LATE_SERVICE } });
  });

  it('Access & passes reads "2 passes · from $30" on an event with several', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<EventFormScreen eventId="e_warehouse_friday" />, { repository });
    const section = await screen.findByTestId('section-access');
    await waitFor(() => expect(within(section).getByText('2 passes · from $30')).toBeTruthy());
    expect(screen.getByTestId('section-access-done')).toBeTruthy();
  });

  it('an event with no passes keeps the empty line in Access & passes', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<EventFormScreen eventId={LATE_SERVICE} />, { repository });
    const section = await screen.findByTestId('section-access');
    await waitFor(() => expect(within(section).getByText(ACCESS_EMPTY_SUMMARY)).toBeTruthy());
  });

  it('the first pass on an event: its pass list says No passes yet and offers Add pass', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<PassListScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    expect(await screen.findByText(NO_PASSES_TITLE)).toBeTruthy();
    await press(screen.getByTestId('passes-add-first'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/passes/new', params: { event: LATE_SERVICE } });
  });

  it('a paid pass with Stripe not connected saves but stays out of Get a pass until it is', async () => {
    const repository = await signedInAs('existing-organizer');
    await repository.createEventPass(LATE_SERVICE, { name: 'VIP', priceCents: 6000, included: 'Booth', freeForMembers: false, idempotencyKey: 'v' });
    expect(await repository.getOrganizerEventPasses(LATE_SERVICE)).toEqual([expect.objectContaining({ name: 'VIP', sellable: false })]);
    expect(await repository.getPassTypes(LATE_SERVICE)).toEqual([]);
    await renderWithProviders(<PassListScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    expect(await screen.findByText(STRIPE_NOTICE)).toBeTruthy();
  });

  it('a turned-off pass leaves Get a pass and reads Off in the list', async () => {
    const repository = await signedInAs('existing-organizer');
    const made = await repository.createEventPass(LATE_SERVICE, { name: 'Early entry', priceCents: null, included: '', freeForMembers: false, idempotencyKey: 'b' });
    await repository.updatePass(made.id, { active: false });
    expect(await repository.getPassTypes(LATE_SERVICE)).toEqual([]);
    await renderWithProviders(<PassListScreen scope="event" parentId={LATE_SERVICE} />, { repository });
    expect(within(await screen.findByTestId(`pass-row-${made.id}`)).getByText('Off')).toBeTruthy();
  });

  it('a new event is saved as a draft before its passes open', async () => {
    const repository = await signedInAs('existing-organizer');
    await renderWithProviders(<EventFormScreen communityId={SUNDAYS} />, { repository });
    await press(await screen.findByTestId('section-access'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/passes', params: { id: expect.stringMatching(/^e_new_/) } }));
    const id = router.push.mock.calls[0][0].params.id as string;
    expect((await repository.getOrganizerEvent(id))?.communityId).toBe(SUNDAYS);
  });
});

describe('pass setup rules', () => {
  it('only a community’s organizer sees or changes its passes', async () => {
    const repository = await signedInAs('existing-member');
    await expect(repository.getCommunityPasses(SUNDAYS)).rejects.toMatchObject({ code: 'not_found' });
    await expect(repository.createEventPass('e_warehouse_friday', { name: 'X', priceCents: null, included: '', freeForMembers: false, idempotencyKey: 'x' })).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('the summary counts passes that are on and shows the lowest price as given', () => {
    expect(passesSummary([])).toBeNull();
    expect(passesSummary([{ priceCents: 3000, active: true }, { priceCents: null, active: true }])).toBe('2 passes · from $30');
    expect(passesSummary([{ priceCents: null, active: true }])).toBe('1 pass · free');
    expect(passesSummary([{ priceCents: 3000, active: false }])).toBe('1 pass · turned off');
  });
});

describe('Get a pass, after an organizer adds a pass', () => {
  it('lists the new event pass for members', async () => {
    const repository = await signedInAs('existing-organizer');
    await repository.createEventPass(LATE_SERVICE, { name: 'Early entry', priceCents: null, included: 'Before 10 PM', freeForMembers: false, idempotencyKey: 'a' });
    expect(await repository.getPassTypes(LATE_SERVICE)).toEqual([expect.objectContaining({ name: 'Early entry', priceCents: 0 })]);
    await renderWithProviders(<PassSheet eventId={LATE_SERVICE} />, { repository });
    expect(await screen.findByText('Early entry')).toBeTruthy();
    expect(screen.getByText('Before 10 PM')).toBeTruthy();
    // No price: it reads Free and is claimed, never "$0".
    expect(screen.getByRole('button', { name: 'Claim Early entry, Free' })).toBeTruthy();
    expect(screen.queryByText('$0')).toBeNull();
  });
});
