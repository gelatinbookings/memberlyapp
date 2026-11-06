import { dateTile, formatEventDate, formatEventRange, formatEventTime } from '../dates';

const NY = 'America/New_York';

describe('event dates in the venue time zone', () => {
  it('formats the date', () => {
    expect(formatEventDate('2026-11-20T22:00:00-05:00', NY)).toBe('Fri, Nov 20');
  });

  it('formats a range that crosses midnight', () => {
    expect(formatEventRange('2026-11-20T22:00:00-05:00', '2026-11-21T02:00:00-05:00', NY)).toBe('10 PM – 2 AM');
  });

  it('shows minutes only when they are not zero', () => {
    expect(formatEventTime('2026-11-20T19:30:00-05:00', NY)).toBe('7:30 PM');
    expect(formatEventTime('2026-11-20T22:00:00-05:00', NY)).toBe('10 PM');
  });

  it('uses the venue zone, not UTC', () => {
    // 03:00 UTC on the 21st is still 10 PM on the 20th in Atlanta.
    expect(formatEventDate('2026-11-21T03:00:00Z', NY)).toBe('Fri, Nov 20');
  });

  it('builds a date tile', () => {
    expect(dateTile('2026-11-20T22:00:00-05:00', NY)).toEqual({ weekday: 'FRI', day: '20' });
  });
});
