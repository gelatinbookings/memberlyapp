import { createFakeRepository, DEMO_NOW, sampleEvents } from '@/data/fakeRepository';

import { greeting, lineupLine, longDate, passLine, pickFeatured } from '../featured';

const NY = 'America/New_York';

describe('Home featured card', () => {
  it('features tonight’s pass first', async () => {
    const repo = createFakeRepository({ delayMs: 0 });
    const f = pickFeatured(await repo.getTonight('Atlanta'), await repo.getMyEvents('upcoming'), DEMO_NOW);
    expect(f?.kind).toBe('pass-tonight');
    expect(f?.event.id).toBe('e_warehouse_friday');
  });

  it('falls back to the next pass, then tonight’s top event', () => {
    const tonightNoPass = sampleEvents.filter((e) => !e.viewerHasPass);
    const later = { ...sampleEvents[0], id: 'later', startsAt: '2026-11-28T22:00:00-05:00', endsAt: '2026-11-29T02:00:00-05:00', relation: 'pass' as const };
    expect(pickFeatured(tonightNoPass, [later], DEMO_NOW)).toMatchObject({ kind: 'next-pass', event: { id: 'later' } });
    expect(pickFeatured(tonightNoPass, [], DEMO_NOW)).toMatchObject({ kind: 'top-tonight', event: { id: tonightNoPass[0].id } });
    expect(pickFeatured([], [], DEMO_NOW)).toBeNull();
  });

  it('names confirmed DJs only, never fees or offers', () => {
    expect(lineupLine(sampleEvents[0])).toBe('Second Sundays · KOYO on the lineup');
    expect(lineupLine(sampleEvents[1])).toBe('Rooftop Society');
    expect(lineupLine(sampleEvents[0])).not.toMatch(/\$|fee|offer|TBA/i);
  });

  it('greets by the city’s clock and dates the page', () => {
    expect(greeting(DEMO_NOW, NY)).toBe('Evening');
    expect(greeting(new Date('2026-11-20T09:00:00-05:00'), NY)).toBe('Morning');
    expect(greeting(new Date('2026-11-20T14:00:00-05:00'), NY)).toBe('Afternoon');
    expect(longDate(DEMO_NOW, NY)).toBe('Friday, Nov 20');
  });

  it('says how many passes tonight on the member card', () => {
    expect(passLine(sampleEvents, { kind: 'pass-tonight', event: sampleEvents[0] })).toBe('1 pass tonight');
    expect(passLine([], null)).toBe('No passes yet');
  });
});
