import { bookingsOf } from '@/test-utils/bookings';

import { createFakeRepository, createMemoryStorage, SESSION_KEY } from '../fakeRepository';
import { DEFAULT_TEST_ACCOUNT, TEST_ACCOUNTS, testAccountByEmail, type TestAccountId } from '../testAccounts';

const make = (options: Parameters<typeof createFakeRepository>[0] = {}) => createFakeRepository({ delayMs: 0, ...options });
const account = (id: TestAccountId) => TEST_ACCOUNTS.find((a) => a.id === id)!;

/** A repository signed in as one of the test accounts. */
async function as(id: TestAccountId, repo = make()) {
  const session = await repo.fake.signInAs(id);
  return { repo, session };
}

describe('the test accounts seed', () => {
  it('lists the four accounts in order, each with a label, a description and an email on the reserved .test domain', () => {
    expect(TEST_ACCOUNTS.map((a) => a.id)).toEqual(['new-user', 'new-organizer', 'existing-organizer', 'existing-member']);
    expect(TEST_ACCOUNTS.map((a) => a.label)).toEqual([
      'New user · account created',
      'New organizer · setup to finish',
      'Existing organizer · active booking and event',
      'Existing member · no community yet',
    ]);
    for (const a of TEST_ACCOUNTS) {
      expect(a.description.length).toBeGreaterThan(10);
      expect(a.email).toMatch(/^[a-z.]+@[a-z.]+\.test$/);
      expect(testAccountByEmail(a.email.toUpperCase())).toBe(a);
    }
    expect(new Set(TEST_ACCOUNTS.map((a) => a.email)).size).toBe(4);
    expect(new Set(TEST_ACCOUNTS.map((a) => a.viewerId)).size).toBe(4);
  });

  it('keeps the existing organizer as the account the sample data opens as', () => {
    expect(DEFAULT_TEST_ACCOUNT.id).toBe('existing-organizer');
    expect(DEFAULT_TEST_ACCOUNT.viewerId).toBe('u_jordan');
  });
});

describe('1. New user · account created', () => {
  it('still has onboarding to do, and has joined, bought and organized nothing', async () => {
    const { repo, session } = await as('new-user');
    expect(session.onboardingDone).toBe(false);
    const viewer = await repo.getViewer();
    expect(viewer).toMatchObject({ firstName: 'Alex', roles: ['member'], communityCount: 0 });
    expect(await repo.getPreferences()).toEqual({ eventTypes: [], genres: [], vibes: [], themes: [] });
    expect(await repo.getOrganizedCommunities()).toEqual([]);
    const card = await repo.getCard();
    expect(card).toMatchObject({ name: 'Alex Morgan', communityCount: 0, memberships: [], passes: [] });
    for (const scope of ['upcoming', 'past', 'saved'] as const) expect(await repo.getMyEvents(scope)).toEqual([]);
    // Tonight is the same shared list, with no pass of theirs on it.
    const tonight = await repo.getTonight('Atlanta');
    expect(tonight).toHaveLength(4);
    expect(tonight.some((e) => e.viewerHasPass)).toBe(false);
  });
});

describe('2. New organizer · setup to finish', () => {
  it('is onboarded and runs a new community with setup left, real zeros and no events', async () => {
    const { repo, session } = await as('new-organizer');
    expect(session.onboardingDone).toBe(true);
    expect((await repo.getViewer()).roles).toEqual(['member', 'organizer']);
    const [community] = await repo.getOrganizedCommunities();
    expect(community).toMatchObject({ name: 'Porchlight Social', memberCount: 1, isOwner: true });
    const overview = await repo.getCommunityOverview(community.id);
    expect(overview?.setupTasks.map((t) => t.title)).toEqual(['Connect Stripe']);
    expect(overview).toMatchObject({ revenueMonthCents: 0, newMembersMonth: 0, churnPercent: null, sampleNumbers: false, upcoming: [] });
    // Member side: nothing held.
    expect((await repo.getCard()).passes).toEqual([]);
    expect(await repo.getMyEvents('upcoming')).toEqual([]);
    // The existing organizer's community is not theirs to manage.
    expect(await repo.getCommunityOverview('c_second_sundays')).toBeNull();
    expect(await repo.getOrganizerEvent('e_warehouse_friday')).toBeNull();
  });

  it('lists the first event they create on their own Manage, under their community', async () => {
    const { repo } = await as('new-organizer');
    const [community] = await repo.getOrganizedCommunities();
    const [atlanta] = await repo.getCities();
    const saved = await repo.saveEvent({
      communityId: community.id,
      publish: false,
      fields: { name: 'First Friday', tagline: '', description: '', cover: null, date: '2026-12-04', startTime: '21:00', endTime: '01:00', venue: 'The Porch', city: atlanta },
    });
    expect(saved.communityName).toBe('Porchlight Social');
    expect((await repo.getCommunityOverview(community.id))?.upcoming.map((e) => e.name)).toEqual(['First Friday']);
    // Talent for it comes from the same shared catalog.
    expect((await repo.getTalent(saved.id)).djs.length).toBeGreaterThan(0);

    await repo.fake.signInAs('existing-organizer');
    expect((await repo.getCommunityOverview('c_second_sundays'))?.upcoming.map((e) => e.name)).not.toContain('First Friday');
  });
});

describe('3. Existing organizer · active booking and event', () => {
  it('is the sample person exactly as before: Second Sundays, five events, bookings in motion, passes and memberships', async () => {
    const { repo, session } = await as('existing-organizer');
    expect(session).toMatchObject({ viewerId: 'u_jordan', onboardingDone: true });
    expect(await repo.getViewer()).toMatchObject({ firstName: 'Jordan', lastName: 'Reese', initials: 'JR', roles: ['member', 'organizer'], communityCount: 3 });
    expect((await repo.getOrganizedCommunities()).map((c) => c.name)).toEqual(['Second Sundays']);
    const overview = await repo.getCommunityOverview('c_second_sundays');
    expect(overview).toMatchObject({ revenueMonthCents: 432000, newMembersMonth: 38, churnPercent: 1.2, sampleNumbers: true });
    expect(overview?.upcoming.map((e) => e.name)).toEqual(['Warehouse Friday', 'Long Table', 'Late Service', 'River Street Social', 'Sunday Sessions']);
    expect((await bookingsOf(repo, 'e_warehouse_friday')).map((b) => b.status)).toEqual(['authorization_required', 'requested', 'confirmed']);
    expect(await bookingsOf(repo, 'e_sunday_sessions')).toHaveLength(8);
    expect(await repo.getDraftOffers('e_late_service')).toHaveLength(2);
    const card = await repo.getCard();
    expect(card.memberships).toHaveLength(4);
    expect(card.passes?.map((p) => p.eventName)).toEqual(['Warehouse Friday']);
    expect((await repo.getMyEvents('upcoming')).map((e) => [e.id, e.relation])).toEqual(
      expect.arrayContaining([
        ['e_warehouse_friday', 'pass'],
        ['e_rooftop_hours', 'going'],
        ['e_long_table', 'going'],
        ['e_daylight', 'saved'],
      ]),
    );
  });

  it('is who the repository answers as before anyone signs in', async () => {
    const repo = make();
    expect(repo.fake.currentViewerId()).toBe('u_jordan');
    expect((await repo.getViewer()).firstName).toBe('Jordan');
  });

  it('is who Continue with Google and Continue with Apple sign in', async () => {
    for (const provider of ['google', 'apple'] as const) {
      const repo = make();
      await repo.fake.signInAs('existing-member');
      const session = await repo.signInWithProvider(provider);
      expect(session).toMatchObject({ viewerId: 'u_jordan', onboardingDone: true });
      expect((await repo.getViewer()).firstName).toBe('Jordan');
      expect((await repo.getOrganizedCommunities()).map((c) => c.name)).toEqual(['Second Sundays']);
    }
  });
});

describe('4. Existing member · no community yet', () => {
  it('has passes and memberships, and organizes nothing', async () => {
    const { repo, session } = await as('existing-member');
    expect(session.onboardingDone).toBe(true);
    expect(await repo.getViewer()).toMatchObject({ firstName: 'Dana', roles: ['member'], communityCount: 2 });
    expect(await repo.getOrganizedCommunities()).toEqual([]);
    expect(await repo.getCommunityOverview('c_second_sundays')).toBeNull();
    const card = await repo.getCard();
    expect(card.memberships.map((m) => [m.communityName, m.status])).toEqual([
      ['Second Sundays', 'active'],
      ['Supper Club ATL', 'active'],
      ['Day Party Collective', 'expired'],
    ]);
    expect(card.passes?.map((p) => [p.eventName, p.passName])).toEqual([
      ['Warehouse Friday', 'Member pass'],
      ['Daylight', 'General pass'],
    ]);
    const tonight = await repo.getTonight('Atlanta');
    expect(tonight[0]).toMatchObject({ id: 'e_warehouse_friday', viewerHasPass: true });
    expect((await repo.getMyEvents('upcoming')).map((e) => [e.id, e.relation])).toEqual(
      expect.arrayContaining([
        ['e_warehouse_friday', 'pass'],
        ['e_daylight', 'pass'],
        ['e_rooftop_hours', 'going'],
        ['e_listening_session', 'saved'],
      ]),
    );
    expect((await repo.getMyEvents('saved')).map((e) => e.id)).toEqual(['e_listening_session']);
    // The organizer's side of the event they hold a pass for is not theirs to see.
    expect(await bookingsOf(repo, 'e_warehouse_friday')).toEqual([]);
    expect(await repo.getDraftOffers('e_late_service')).toEqual([]);
  });
});

describe('signing in with an email and the sample code', () => {
  it.each(TEST_ACCOUNTS.map((a) => [a.label, a] as const))('%s: its email signs in as it, from Sign in or Create account', async (_label, a) => {
    for (const intent of ['sign-in', 'sign-up'] as const) {
      const repo = make();
      await repo.sendCode({ email: a.email, intent, name: 'Someone Else' });
      const result = await repo.verifyCode(a.email, '1234');
      expect(result).toMatchObject({ ok: true, session: { viewerId: a.viewerId, onboardingDone: a.onboardingDone } });
      expect(await repo.getViewer()).toMatchObject({ id: a.viewerId, firstName: a.firstName, email: a.email });
    }
  });

  it('still refuses a wrong code and reports an expired one for a test account', async () => {
    const repo = make();
    const { email } = account('existing-member');
    await repo.sendCode({ email, intent: 'sign-in' });
    expect(await repo.verifyCode(email, '9999')).toEqual({ ok: false, reason: 'wrong' });
    expect(await repo.verifyCode(email, '0000')).toMatchObject({ ok: false, reason: 'expired' });
    expect(repo.fake.currentViewerId()).toBe('u_jordan');
  });

  it('signs any other email in as the returning sample person, as before', async () => {
    const repo = make();
    await repo.sendCode({ email: 'someone@example.com', intent: 'sign-in' });
    const result = await repo.verifyCode('someone@example.com', '1234');
    expect(result).toMatchObject({ ok: true, isNewUser: false, session: { viewerId: 'u_jordan', email: 'someone@example.com', onboardingDone: true } });
    expect((await repo.getViewer()).firstName).toBe('Jordan');
  });

  it('creates a fresh account for any other email: their name, onboarding to do, nothing of anyone else’s', async () => {
    const repo = make();
    await repo.sendCode({ email: 'ada@example.com', intent: 'sign-up', name: 'Ada Obi' });
    const result = await repo.verifyCode('ada@example.com', '1234');
    expect(result).toMatchObject({ ok: true, isNewUser: true, session: { onboardingDone: false, email: 'ada@example.com' } });
    expect(await repo.getViewer()).toMatchObject({ firstName: 'Ada', lastName: 'Obi', initials: 'AO', email: 'ada@example.com', roles: ['member'], communityCount: 0 });
    expect(await repo.getOrganizedCommunities()).toEqual([]);
    expect((await repo.getCard()).memberships).toEqual([]);
    expect(await repo.getMyEvents('upcoming')).toEqual([]);
    expect(await repo.getPreferences()).toEqual({ eventTypes: [], genres: [], vibes: [], themes: [] });
  });

  it('brings a self-made account back under its own name after a restart', async () => {
    const storage = createMemoryStorage();
    const first = make({ storage });
    await first.sendCode({ email: 'ada@example.com', intent: 'sign-up', name: 'Ada Obi' });
    await first.verifyCode('ada@example.com', '1234');

    const relaunched = make({ storage });
    const session = await relaunched.getSession();
    expect(session?.email).toBe('ada@example.com');
    expect(await relaunched.getViewer()).toMatchObject({ firstName: 'Ada', lastName: 'Obi', roles: ['member'] });
  });

  it('restores a test account from the stored session after a restart', async () => {
    const storage = createMemoryStorage();
    await make({ storage }).fake.signInAs('existing-member');
    const relaunched = make({ storage });
    expect((await relaunched.getSession())?.viewerId).toBe(account('existing-member').viewerId);
    expect((await relaunched.getViewer()).firstName).toBe('Dana');
  });
});

describe('one account never sees another’s data', () => {
  it('keeps bookings, unsent offers and events to the organizer who made them', async () => {
    const repo = make();
    await repo.fake.signInAs('existing-organizer');
    repo.fake.playDj('br_blkmtn', 'accept');
    await repo.addDraftOffer('e_long_table', (await repo.getTalent('e_long_table')).djs[0]);

    for (const other of ['new-user', 'new-organizer', 'existing-member'] as const) {
      await repo.fake.signInAs(other);
      expect(await bookingsOf(repo, 'e_warehouse_friday')).toEqual([]);
      expect(await repo.getDraftOffers('e_long_table')).toEqual([]);
      expect(await repo.getOrganizerEvent('e_warehouse_friday')).toBeNull();
      expect(repo.fake.requestCount('e_warehouse_friday')).toBe(0);
    }

    // Back as the organizer, their session's changes are still there.
    await repo.fake.signInAs('existing-organizer');
    expect((await bookingsOf(repo, 'e_warehouse_friday')).find((b) => b.requestId === 'br_blkmtn')?.status).toBe('confirmed');
    expect(await repo.getDraftOffers('e_long_table')).toHaveLength(1);
  });

  it('keeps a pass to the member who got it', async () => {
    const repo = make();
    await repo.fake.signInAs('existing-member');
    const order = await repo.createPassOrder('e_rooftop_hours', { passTypeId: 'pt_rooftop_member', quantity: 1, idempotencyKey: 'k1', expectedPriceCents: 0 });
    expect(order.status).toBe('paid');
    expect((await repo.getEvent('e_rooftop_hours'))?.viewerHasPass).toBe(true);
    expect((await repo.getCard()).passes?.map((p) => p.eventName)).toContain('Rooftop Hours');

    await repo.fake.signInAs('existing-organizer');
    expect((await repo.getEvent('e_rooftop_hours'))?.viewerHasPass).toBe(false);
    expect((await repo.getCard()).passes?.map((p) => p.eventName)).toEqual(['Warehouse Friday']);
    expect(repo.fake.passOrderCount()).toBe(0);

    await repo.fake.signInAs('new-user');
    expect((await repo.getTonight('Atlanta')).some((e) => e.viewerHasPass)).toBe(false);
  });

  it('keeps preferences to the person who picked them', async () => {
    const repo = make();
    await repo.fake.signInAs('new-user');
    await repo.putPreferences({ eventTypes: ['Dinners', 'Concerts', 'Workshops'], genres: [], vibes: [], themes: [] });
    await repo.fake.signInAs('existing-organizer');
    expect((await repo.getPreferences()).eventTypes).toEqual(['Nightlife', 'Concerts', 'Day parties']);
    await repo.fake.signInAs('new-user');
    expect((await repo.getPreferences()).eventTypes).toEqual(['Dinners', 'Concerts', 'Workshops']);
  });

  it('keeps simulated edge states to the account they were set for', async () => {
    const repo = make();
    await repo.fake.signInAs('existing-organizer');
    repo.fake.simulate({ failBookings: true });
    await repo.fake.signInAs('new-organizer');
    await expect(repo.getEventBookings('anything')).resolves.toMatchObject({ bookings: [] });
  });

  it('marks only the viewer’s own community as theirs in the shared catalog', async () => {
    const repo = make();
    const owned = async () => (await repo.getTopCommunities('Atlanta')).filter((c) => c.isOwner).map((c) => c.name);
    expect(await owned()).toEqual(['Second Sundays']);
    await repo.fake.signInAs('existing-member');
    expect(await owned()).toEqual([]);
    // The shared catalog itself is the same for everyone.
    expect((await repo.getTopCommunities('Atlanta')).map((c) => c.name)).toContain('Second Sundays');
  });
});

describe('onboarding and signing out', () => {
  it('remembers for the session that the new user finished onboarding', async () => {
    const repo = make();
    expect((await repo.fake.signInAs('new-user')).onboardingDone).toBe(false);
    expect((await repo.completeOnboarding()).onboardingDone).toBe(true);
    await repo.signOut();
    expect((await repo.fake.signInAs('new-user')).onboardingDone).toBe(true);
    // A new run of the app starts them over.
    expect((await make().fake.signInAs('new-user')).onboardingDone).toBe(false);
  });

  it('clears the stored session on sign-out, and a screen still closing reads only the person who left', async () => {
    const storage = createMemoryStorage();
    const repo = make({ storage });
    await repo.fake.signInAs('existing-member');
    expect(await storage.get(SESSION_KEY)).toContain(account('existing-member').viewerId);
    await repo.signOut();
    expect(await storage.get(SESSION_KEY)).toBeNull();
    expect(await repo.getSession()).toBeNull();
    // Not the sample organizer, and not whoever signs in next.
    expect((await repo.getViewer()).firstName).toBe('Dana');
    await repo.fake.signInAs('new-user');
    expect((await repo.getViewer()).firstName).toBe('Alex');
  });

  it('still starts signed in as the existing organizer under the dev flag', async () => {
    const repo = make({ signedIn: true });
    expect(await repo.getSession()).toMatchObject({ viewerId: 'u_jordan', onboardingDone: true });
  });
});

describe('the app’s repository at a cold start', () => {
  it('holds what screens ask for until the stored session is read, then answers as that person', async () => {
    const storage = createMemoryStorage();
    await make({ storage }).fake.signInAs('existing-member');

    // A new run of the app: screens mount and ask before the session has been restored.
    const repo = make({ storage, holdUntilSession: true });
    let answered = false;
    const early = Promise.all([repo.getViewer(), repo.getOrganizedCommunities(), repo.getCommunityOverview('c_second_sundays')]).then((r) => {
      answered = true;
      return r;
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(answered).toBe(false);
    // The clock is not held.
    expect(repo.now()).toBeInstanceOf(Date);

    await repo.getSession();
    const [viewer, organized, overview] = await early;
    expect(viewer.firstName).toBe('Dana');
    expect(organized).toEqual([]);
    expect(overview).toBeNull();
  });

  it('answers once it knows nobody is signed in, and after a sign-in with no restore', async () => {
    const signedOut = make({ holdUntilSession: true });
    const early = signedOut.getTonight('Atlanta');
    expect(await signedOut.getSession()).toBeNull();
    expect(await early).toHaveLength(4);

    const fresh = make({ holdUntilSession: true });
    const viewer = fresh.getViewer();
    await fresh.fake.signInAs('new-organizer');
    expect((await viewer).firstName).toBe('Sam');
  });
});
