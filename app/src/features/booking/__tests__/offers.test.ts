import { canSendOffers, centsToDollarsField, dollarsToCents, feeMissing, sanitizeDollars, sendOffersLabel } from '../offers';

describe('Your offer field', () => {
  it('keeps whole dollars only', () => {
    expect(sanitizeDollars('$4,50.75')).toBe('45075');
    expect(sanitizeDollars('0450')).toBe('450');
    expect(sanitizeDollars('abc')).toBe('');
  });

  it('turns dollars into integer cents', () => {
    expect(dollarsToCents('450')).toBe(45000);
    expect(dollarsToCents('600')).toBe(60000);
    expect(Number.isInteger(dollarsToCents('1234'))).toBe(true);
  });

  it('treats empty or zero as no fee', () => {
    expect(dollarsToCents('')).toBeNull();
    expect(dollarsToCents('0')).toBeNull();
  });

  it('pre-fills from a published rate and leaves a private rate empty', () => {
    expect(centsToDollarsField(45000)).toBe('450');
    expect(centsToDollarsField(null)).toBe('');
  });
});

describe('fee-missing validation', () => {
  it('flags a DJ without a fee', () => {
    expect(feeMissing({ offerCents: null })).toBe(true);
    expect(feeMissing({ offerCents: 0 })).toBe(true);
    expect(feeMissing({ offerCents: 45000 })).toBe(false);
  });

  it('disables Send until every DJ has a fee', () => {
    expect(canSendOffers([{ offerCents: 45000 }, { offerCents: null }])).toBe(false);
    expect(canSendOffers([{ offerCents: 45000 }, { offerCents: 60000 }])).toBe(true);
    expect(canSendOffers([])).toBe(false);
  });

  it('counts the offers on the button', () => {
    expect(sendOffersLabel(2)).toBe('Send 2 offers');
    expect(sendOffersLabel(1)).toBe('Send 1 offer');
  });
});
