import {
  addDays,
  endsNextMorning,
  formatIsoDate,
  formatWallTime,
  isoDateInZone,
  monthGrid,
  timeHelper,
  timeZoneName,
  zonedIso,
} from '../dates';

describe('ends the next morning', () => {
  it('is true when the end is before the start', () => {
    expect(endsNextMorning('22:00', '02:00')).toBe(true);
    expect(endsNextMorning('23:30', '00:00')).toBe(true);
  });

  it('is false for a night that ends the same day', () => {
    expect(endsNextMorning('19:30', '22:30')).toBe(false);
    expect(endsNextMorning('14:00', '19:00')).toBe(false);
  });

  it('says so in the helper, after the venue’s zone', () => {
    expect(timeHelper('America/New_York', '22:00', '02:00')).toBe('Eastern Time, from the venue. Ends the next morning.');
    expect(timeHelper('America/New_York', '19:30', '22:30')).toBe('Eastern Time, from the venue.');
  });

  it('asks for a location when there is no venue zone yet', () => {
    expect(timeHelper(null, '22:00', '02:00')).toBe(
      'Times use the venue’s time zone once you add a location. Ends the next morning.',
    );
  });
});

describe('time zone label', () => {
  it('names US zones the way people say them', () => {
    expect(timeZoneName('America/New_York')).toBe('Eastern Time');
    expect(timeZoneName('America/Chicago')).toBe('Central Time');
    expect(timeZoneName('America/Denver')).toBe('Mountain Time');
    expect(timeZoneName('America/Los_Angeles')).toBe('Pacific Time');
  });

  it('falls back to the city in an unfamiliar zone', () => {
    expect(timeZoneName('Africa/Lagos')).toBe('Lagos time');
    expect(timeZoneName('America/Mexico_City')).toBe('Mexico City time');
  });
});

describe('venue wall time to an instant', () => {
  it('uses the venue’s offset, not the phone’s', () => {
    expect(zonedIso('2026-11-20', '22:00', 'America/New_York')).toBe('2026-11-20T22:00:00-05:00');
    expect(zonedIso('2026-11-20', '22:00', 'America/Los_Angeles')).toBe('2026-11-20T22:00:00-08:00');
    expect(zonedIso('2026-11-20', '22:00', 'America/Chicago')).toBe('2026-11-20T22:00:00-06:00');
  });

  it('follows daylight saving at the venue', () => {
    expect(zonedIso('2026-07-10', '22:00', 'America/New_York')).toBe('2026-07-10T22:00:00-04:00');
    expect(zonedIso('2026-11-01', '12:00', 'America/New_York')).toBe('2026-11-01T12:00:00-05:00');
  });

  it('round-trips to the same wall clock in the venue’s zone', () => {
    const iso = zonedIso('2026-11-21', '02:00', 'America/New_York');
    expect(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric' }).format(new Date(iso))).toBe('2 AM');
  });

  it('finds today at the venue from an instant', () => {
    // 03:00 UTC on the 19th is still the 18th in Atlanta.
    expect(isoDateInZone(new Date('2026-11-19T03:00:00Z'), 'America/New_York')).toBe('2026-11-18');
    expect(isoDateInZone(new Date('2026-11-19T03:00:00Z'), 'Europe/London')).toBe('2026-11-19');
  });
});

describe('calendar and labels', () => {
  it('formats dates and times without the phone’s zone', () => {
    expect(formatIsoDate('2026-11-20')).toBe('Fri, Nov 20');
    expect(formatWallTime('22:00')).toBe('10:00 PM');
    expect(formatWallTime('00:30')).toBe('12:30 AM');
    expect(formatWallTime('12:00')).toBe('12:00 PM');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('lays out November 2026 starting on a Sunday', () => {
    const weeks = monthGrid(2026, 11);
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBe(1);
    expect(weeks[4].filter(Boolean)).toEqual([29, 30]);
  });
});
