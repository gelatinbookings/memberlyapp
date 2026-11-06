import { lineupNeedsAction, lineupSummary } from '../lineupSummary';

describe('lineupSummary', () => {
  it('reads like the canvas', () => {
    expect(
      lineupSummary([{ status: 'authorization_required' }, { status: 'requested' }, { status: 'confirmed' }]),
    ).toBe('1 confirmed · 1 waiting · 1 to pay');
  });

  it('counts negotiating as waiting and ignores passed, expired and cancelled', () => {
    expect(
      lineupSummary([{ status: 'negotiating' }, { status: 'declined' }, { status: 'expired' }, { status: 'cancelled' }]),
    ).toBe('1 waiting');
  });

  it('says so when there is no lineup', () => {
    expect(lineupSummary([])).toBe('No lineup yet');
  });

  it('flags bookings that need the organizer', () => {
    expect(lineupNeedsAction([{ status: 'reauthorization_required' }])).toBe(true);
    expect(lineupNeedsAction([{ status: 'requested' }, { status: 'confirmed' }])).toBe(false);
  });
});
