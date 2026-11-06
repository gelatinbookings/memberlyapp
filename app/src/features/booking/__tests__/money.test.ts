import { formatCents, formatDraw, formatRate } from '../money';

describe('formatCents', () => {
  it('formats a server total with two decimals', () => {
    expect(formatCents(45700)).toBe('$457.00');
    expect(formatCents(60700)).toBe('$607.00');
    expect(formatCents(47096)).toBe('$470.96');
    expect(formatCents(0)).toBe('$0.00');
  });

  it('refuses amounts that are not whole cents', () => {
    expect(() => formatCents(457.5)).toThrow(RangeError);
  });
});

describe('formatRate', () => {
  it('shows Private rate when Gelatin sends no published rate', () => {
    expect(formatRate(null)).toBe('Private rate');
    expect(formatRate(undefined)).toBe('Private rate');
  });

  it('shows whole-dollar rates without cents', () => {
    expect(formatRate(45000)).toBe('$450');
    expect(formatRate(27500)).toBe('$275');
  });

  it('keeps cents when the rate has them', () => {
    expect(formatRate(45050)).toBe('$450.50');
  });
});

describe('formatDraw', () => {
  it('uses the agreed copy when draw is not established', () => {
    expect(formatDraw(null)).toBe('Draw not yet established');
  });

  it('shows the venue-confirmed range and average', () => {
    expect(formatDraw({ min: 180, max: 260, average: 215 })).toBe('Draws 180–260 · avg 215');
  });
});
