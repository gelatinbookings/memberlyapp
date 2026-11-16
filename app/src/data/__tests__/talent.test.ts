import { CatalogUnavailableError, isCatalogUnavailable } from '../errors';
import { createFakeRepository, sampleCatalog, sampleCities, TALENT_PAGE_SIZE, type TalentSimulation } from '../fakeRepository';
import type { EventFields, TalentPage } from '../types';

const repo = (options = {}) => createFakeRepository({ delayMs: 0, ...options });

const fields = (patch: Partial<EventFields>): EventFields => ({
  name: 'Test night',
  tagline: '',
  description: '',
  cover: null,
  date: '2026-12-12',
  startTime: '22:00',
  endTime: '02:00',
  venue: 'Somewhere',
  city: sampleCities[0],
  ...patch,
});

/** Every page for an event, following the cursor to the end. */
async function allPages(r: ReturnType<typeof repo>, eventId: string, query = {}): Promise<TalentPage[]> {
  const pages: TalentPage[] = [];
  let cursor: string | null = null;
  do {
    const page: TalentPage = await r.getTalent(eventId, { ...query, cursor });
    pages.push(page);
    cursor = page.nextCursor;
  } while (cursor);
  return pages;
}

const names = (pages: TalentPage[]) => pages.flatMap((p) => p.djs.map((d) => d.name));

describe('talent catalog (fake)', () => {
  it('has about ten Atlanta DJs across every tier and band, with private rates and an unknown draw', () => {
    expect(sampleCatalog).toHaveLength(10);
    expect(sampleCatalog.map((d) => d.name)).toEqual(expect.arrayContaining(['KOYO', 'NIGHTFORM', 'BLKMTN', 'Sable Hart']));
    expect(new Set(sampleCatalog.map((d) => d.tier)).size).toBe(4);
    expect(new Set(sampleCatalog.map((d) => d.band)).size).toBe(4);
    expect(sampleCatalog.filter((d) => d.publishedRateCents == null).length).toBeGreaterThanOrEqual(2);
    expect(sampleCatalog.some((d) => d.draw == null)).toBe(true);
    // Rates travel as whole cents.
    expect(sampleCatalog.every((d) => d.publishedRateCents == null || Number.isInteger(d.publishedRateCents))).toBe(true);
  });

  it('derives the city from the event: the caller never names one', async () => {
    const r = repo();
    const atlanta = await r.getTalent('e_late_service');
    expect(atlanta.citySupported).toBe(true);
    expect(atlanta.djs.length).toBe(TALENT_PAGE_SIZE);

    const savannah = await r.getTalent('e_river_street');
    expect(savannah).toEqual({ djs: [], nextCursor: null, citySupported: false, total: 0 });

    // Moving the same event to Atlanta is the only way to change the answer.
    const river = (await r.getOrganizerEvent('e_river_street'))!;
    await r.saveEvent({ id: river.id, communityId: river.communityId, fields: fields({ city: sampleCities[0], date: river.date }), publish: false });
    expect((await r.getTalent('e_river_street')).citySupported).toBe(true);
  });

  it('derives the night from the event: a DJ taken that night is not listed, with no reason', async () => {
    const r = repo();
    const sunday = names(await allPages(r, 'e_long_table'));
    const saturday = names(await allPages(r, 'e_late_service'));
    expect(sunday).not.toContain('OKTAVE');
    expect(sunday).toHaveLength(9);
    expect(saturday).toContain('OKTAVE');
    expect(saturday).toHaveLength(10);

    // Change the saved date and the same call answers for the new night.
    const lateService = (await r.getOrganizerEvent('e_late_service'))!;
    await r.saveEvent({ id: lateService.id, communityId: lateService.communityId, fields: fields({ date: '2026-11-22' }), publish: false });
    expect(names(await allPages(r, 'e_late_service'))).not.toContain('OKTAVE');
  });

  it('leaves out DJs already holding a booking on the event', async () => {
    const r = repo();
    const open = names(await allPages(r, 'e_warehouse_friday'));
    expect(open).not.toContain('KOYO');
    expect(open).not.toContain('NIGHTFORM');
    expect(open).not.toContain('BLKMTN');
    expect(open).toContain('Sable Hart');
  });

  it('refuses an event with no night or city, and one that does not exist', async () => {
    const r = repo();
    const draft = await r.saveEvent({ communityId: 'c_second_sundays', fields: fields({ date: null }), publish: false });
    await expect(r.getTalent(draft.id)).rejects.toThrow('Set the night and the city first');
    await expect(r.getTalent('e_nope')).rejects.toThrow();
  });

  it('pages by an opaque cursor, four at a time, with the total on every page', async () => {
    const r = repo();
    const pages = await allPages(r, 'e_late_service');
    expect(pages.map((p) => p.djs.length)).toEqual([4, 4, 2]);
    expect(pages.map((p) => p.total)).toEqual([10, 10, 10]);
    expect(pages[0].nextCursor).toEqual(expect.any(String));
    expect(pages[2].nextCursor).toBeNull();
    expect(names(pages.slice(0, 1))).toEqual(['KOYO', 'NIGHTFORM', 'BLKMTN', 'Sable Hart']);
    expect(new Set(names(pages)).size).toBe(10);
  });

  it('filters by budget band, keeping private-rate DJs in their band', async () => {
    const r = repo();
    const under = await r.getTalent('e_late_service', { budget: 'under_300' });
    expect(under.djs.map((d) => d.name)).toEqual(['Sable Hart', 'Mara Sol', 'Priya Nox']);
    expect(under.djs.find((d) => d.name === 'Priya Nox')).toMatchObject({ publishedRateCents: null, draw: null });
    const mid = await r.getTalent('e_late_service', { budget: '600_to_1000' });
    expect(mid.djs.map((d) => d.name)).toEqual(['NIGHTFORM', 'Juno Vale']);
    expect(mid.djs[0].publishedRateCents).toBeNull();
    expect((await r.getTalent('e_late_service', { budget: '1000_plus' })).total).toBe(2);
    expect((await r.getTalent('e_late_service', { budget: '300_to_600' })).total).toBe(3);
  });

  it('filters by one genre, and by both together', async () => {
    const r = repo();
    expect((await r.getTalent('e_late_service', { genre: 'Techno' })).djs.map((d) => d.name)).toEqual(['NIGHTFORM', 'LOWTIDE']);
    const tight = await r.getTalent('e_late_service', { budget: 'under_300', genre: 'Techno' });
    expect(tight).toMatchObject({ djs: [], total: 0, citySupported: true, nextCursor: null });
  });

  it('never leaks the catalog’s private columns', async () => {
    const page = await repo().getTalent('e_late_service');
    for (const dj of page.djs) {
      expect(dj).not.toHaveProperty('band');
      expect(dj).not.toHaveProperty('takenOn');
      expect(dj).not.toHaveProperty('city');
    }
  });

  it('offers genres for the event’s city and the chosen band', async () => {
    const r = repo();
    expect(await r.getTalentGenres('e_late_service', 'under_300')).toEqual(['Soul', 'Disco', 'Amapiano', 'Afrobeats', 'Bass', 'Jersey club']);
    expect(await r.getTalentGenres('e_late_service', null)).toEqual(expect.arrayContaining(['House', 'Techno', 'R&B', 'Baile funk']));
    expect(await r.getTalentGenres('e_river_street', null)).toEqual([]);
  });

  it('answers 503 catalog_unavailable while the catalog is down, then recovers', async () => {
    let mode: TalentSimulation = 'unavailable';
    const r = repo({ talentMode: () => mode });
    const failure = await r.getTalent('e_late_service').catch((e) => e);
    expect(failure).toBeInstanceOf(CatalogUnavailableError);
    expect(isCatalogUnavailable(failure)).toBe(true);
    await expect(r.getTalentGenres('e_late_service', null)).rejects.toBeInstanceOf(CatalogUnavailableError);
    // Saving and publishing never go through the catalog.
    const saved = await r.saveEvent({ communityId: 'c_second_sundays', fields: fields({}), publish: true });
    expect(saved.status).toBe('published');
    mode = 'ok';
    expect((await r.getTalent('e_late_service')).djs).toHaveLength(4);
  });

  it('joins a city waitlist without complaint, however often it is asked', async () => {
    const r = repo();
    await expect(r.joinCityWaitlist('Savannah')).resolves.toBeUndefined();
    await expect(r.joinCityWaitlist('Savannah')).resolves.toBeUndefined();
  });

  it('adds a DJ to the unsent offers at the catalog’s rate, once', async () => {
    const r = repo();
    const koyo = sampleCatalog[0];
    // Whatever rate the caller sends, the offer starts from the catalog's.
    const added = await r.addDraftOffer('e_long_table', { ...koyo, publishedRateCents: 1 });
    expect(added).toEqual([expect.objectContaining({ offerCents: 45000, note: '', dj: expect.objectContaining({ id: 'dj_koyo' }) })]);
    expect(await r.addDraftOffer('e_long_table', koyo)).toHaveLength(1);
    const withPrivate = await r.addDraftOffer('e_long_table', sampleCatalog[1]);
    expect(withPrivate[1]).toMatchObject({ offerCents: null, dj: { name: 'NIGHTFORM' } });
    const overview = await r.getCommunityOverview('c_second_sundays');
    expect(overview?.upcoming.find((e) => e.id === 'e_long_table')?.addedDjCount).toBe(2);
  });
});
