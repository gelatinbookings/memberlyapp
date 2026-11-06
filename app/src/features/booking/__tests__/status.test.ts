import { BOOKING_STATUSES, POLL_INTERVAL_MS, shouldPoll, statusUi } from '../status';

describe('statusUi', () => {
  const expected: Record<string, [string, string, string | null]> = {
    authorization_required: ['Payment needed', 'warning', 'Pay now'],
    requested: ['Card held · waiting for the DJ', 'held', 'Manage in Gelatin'],
    negotiating: ['Negotiating', 'held', 'Manage in Gelatin'],
    reauthorization_required: ['New offer from the DJ', 'warning', 'Review the new offer in Gelatin'],
    confirmed: ['Confirmed', 'success', 'Manage in Gelatin'],
    declined: ['Passed', 'neutral', 'Other DJs open that night'],
    expired: ['Expired', 'neutral', 'Other DJs open that night'],
    cancelled: ['Cancelled', 'neutral', 'Other DJs open that night'],
  };

  it('covers all eight statuses', () => {
    expect([...BOOKING_STATUSES].sort()).toEqual(Object.keys(expected).sort());
  });

  it.each(Object.entries(expected))('maps %s to the agreed label, tone and action', (status, [label, tone, action]) => {
    const ui = statusUi(status);
    expect(ui.label).toBe(label);
    expect(ui.tone).toBe(tone);
    expect(ui.actionLabel).toBe(action);
  });

  it('shows an unknown status as neutral with no action', () => {
    expect(statusUi('on_hold_forever')).toEqual({
      label: 'Checking status',
      tone: 'neutral',
      action: null,
      actionLabel: null,
    });
  });
});

describe('shouldPoll', () => {
  it('polls only while the DJ is deciding', () => {
    const polling = BOOKING_STATUSES.filter(shouldPoll);
    expect(polling).toEqual(['requested', 'negotiating']);
    expect(shouldPoll('unknown')).toBe(false);
  });

  it('polls every 5 seconds', () => {
    expect(POLL_INTERVAL_MS).toBe(5000);
  });
});
