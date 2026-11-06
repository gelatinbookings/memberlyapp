import { sampleCities, sampleDjs } from '@/data/fakeRepository';
import type { EventFields } from '@/data/types';

import {
  EMPTY_FIELDS,
  lineupCardSummary,
  lineupUnlocked,
  locationSummary,
  missingForPublish,
  publishBlocker,
  whenSummary,
} from '../completeness';

const atlanta = sampleCities[0];
const complete: EventFields = {
  ...EMPTY_FIELDS,
  name: 'Warehouse Friday',
  date: '2026-11-20',
  startTime: '22:00',
  endTime: '02:00',
  venue: 'Westside warehouse',
  city: atlanta,
};

describe('Create & publish', () => {
  it('names the first missing thing on the button', () => {
    expect(publishBlocker(EMPTY_FIELDS)).toBe('Add a name to publish');
    expect(publishBlocker({ ...complete, date: null })).toBe('Add a date to publish');
    expect(publishBlocker({ ...complete, endTime: null })).toBe('Add times to publish');
    expect(publishBlocker({ ...complete, city: null })).toBe('Add a location to publish');
    expect(publishBlocker({ ...complete, venue: '  ' })).toBe('Add a location to publish');
  });

  it('can publish once details, date and location are set', () => {
    expect(publishBlocker(complete)).toBeNull();
    expect(missingForPublish(complete)).toEqual([]);
  });

  it('never waits on a lineup or passes', () => {
    // No bookings and no added DJs still publishes.
    expect(publishBlocker(complete)).toBeNull();
    expect(missingForPublish({ ...EMPTY_FIELDS, name: 'x' })).toEqual(['when', 'location']);
  });

  it('treats a blank name as missing', () => {
    expect(publishBlocker({ ...complete, name: '   ' })).toBe('Add a name to publish');
  });
});

describe('section summaries', () => {
  it('reads the night as in the design', () => {
    expect(whenSummary(complete)).toBe('Fri, Nov 20 · 10:00 PM – 2:00 AM');
    expect(locationSummary(complete)).toBe('Westside warehouse · Atlanta, GA');
  });

  it('unlocks Lineup with a date and a city', () => {
    expect(lineupUnlocked(complete)).toBe(true);
    expect(lineupUnlocked({ date: '2026-11-20', city: null })).toBe(false);
    expect(lineupUnlocked({ date: null, city: atlanta })).toBe(false);
  });

  it('summarises Lineup when collapsed', () => {
    expect(lineupCardSummary(complete, [], [])).toBe('Book DJs open on Nov 20 in Atlanta');
    expect(lineupCardSummary(EMPTY_FIELDS, [], [])).toBe('Add a date and city first');
    expect(lineupCardSummary(complete, [], [{ dj: sampleDjs.koyo }, { dj: sampleDjs.nightform }])).toBe(
      '2 DJs added · offers not sent',
    );
    expect(
      lineupCardSummary(complete, [{ status: 'confirmed' }, { status: 'requested' }, { status: 'authorization_required' }], []),
    ).toBe('1 confirmed · 1 waiting · 1 to pay');
    expect(lineupCardSummary(complete, [{ status: 'confirmed' }, { status: 'confirmed' }], [])).toBe('2 confirmed');
  });
});
