import { createFakeRepository, DEMO_NOW, sampleCities } from '../fakeRepository';
import { groupUpcoming } from '@/features/events/grouping';

const repo = createFakeRepository({ delayMs: 0 });

describe('fake repository', () => {
  it('lists tonight with the viewer’s own pass first', async () => {
    const tonight = await repo.getTonight('Atlanta');
    expect(tonight.length).toBe(4);
    expect(tonight[0].viewerHasPass).toBe(true);
    expect(tonight.slice(1).every((e) => !e.viewerHasPass)).toBe(true);
  });

  it('returns nothing for a city with no events', async () => {
    expect(await repo.getTonight('Savannah')).toEqual([]);
  });

  it('returns only communities the viewer organizes', async () => {
    const organized = await repo.getOrganizedCommunities();
    expect(organized.map((c) => c.name)).toEqual(['Second Sundays']);
  });

  it('never shows fees on the public lineup', async () => {
    const event = await repo.getEvent('e_warehouse_friday');
    const publicLineup = JSON.stringify(event?.publicLineup);
    expect(publicLineup).not.toMatch(/\$|cents|offer|fee/i);
  });

  it('groups my events into this week and later around the demo clock', async () => {
    const mine = await repo.getMyEvents('upcoming');
    const groups = groupUpcoming(mine, repo.now());
    expect(repo.now()).toEqual(DEMO_NOW);
    expect(groups.thisWeek.map((e) => e.id)).toEqual(['e_long_table', 'e_rooftop_hours', 'e_warehouse_friday']);
    expect(groups.later.map((e) => e.id)).toEqual(['e_daylight']);
  });
});

describe('organizer events', () => {
  const fields = {
    name: 'Westside Social',
    tagline: '',
    description: '',
    cover: null,
    date: '2026-11-20',
    startTime: '22:00',
    endTime: '02:00',
    venue: 'Westside warehouse',
    city: sampleCities[0],
  };

  it('saves a draft in the venue’s zone and lists it on Manage', async () => {
    const r = createFakeRepository({ delayMs: 0 });
    const saved = await r.saveEvent({ communityId: 'c_second_sundays', fields, publish: false });
    expect(saved.status).toBe('draft');
    expect(saved.timeZone).toBe('America/New_York');
    expect(saved.startsAt).toBe('2026-11-20T22:00:00-05:00');
    expect(saved.endsAt).toBe('2026-11-21T02:00:00-05:00');
    const overview = await r.getCommunityOverview('c_second_sundays');
    expect(overview?.upcoming.find((e) => e.id === saved.id)?.salesLabel).toBe('Draft');
  });

  it('publishes without touching bookings, and keeps the sales line', async () => {
    const r = createFakeRepository({ delayMs: 0 });
    const before = await r.getEventBookings('e_warehouse_friday');
    await r.saveEvent({ id: 'e_warehouse_friday', communityId: 'c_second_sundays', fields, publish: false });
    const published = await r.saveEvent({ id: 'e_warehouse_friday', communityId: 'c_second_sundays', fields, publish: true });
    expect(published.status).toBe('published');
    expect(await r.getEventBookings('e_warehouse_friday')).toEqual(before);
    const overview = await r.getCommunityOverview('c_second_sundays');
    expect(overview?.upcoming.find((e) => e.id === 'e_warehouse_friday')?.salesLabel).toBe('212 passes sold');
  });

  it('seeds a draft with one published-rate and one private-rate DJ', async () => {
    const r = createFakeRepository({ delayMs: 0 });
    const offers = await r.getDraftOffers('e_late_service');
    expect(offers.map((o) => [o.dj.name, o.offerCents])).toEqual([
      ['KOYO', 45000],
      ['NIGHTFORM', null],
    ]);
    const updated = await r.updateDraftOffer('e_late_service', 'dj_nightform', { offerCents: 60000, note: 'Opening set' });
    expect(updated[1]).toMatchObject({ offerCents: 60000, note: 'Opening set' });
    expect(await r.removeDraftOffer('e_late_service', 'dj_koyo')).toHaveLength(1);
  });
});
