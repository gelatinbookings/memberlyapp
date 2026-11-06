import { sampleDjs } from '@/data/fakeRepository';
import type { Booking } from '@/data/types';

import { draftHoldNotice, firstUnpaid, openBookingRows, statusLine } from '../statusLine';

const booking = (status: Booking['status'], dj = sampleDjs.koyo, totalCents = 45700): Booking => ({
  requestId: `br_${dj.id}_${status}`,
  dj,
  status,
  offerCents: 45000,
  totalCents,
  note: '',
  setTime: 'Midnight to 2',
});

const text = (b: Booking) => statusLine(b).map((p) => p.text).join('');

describe('status money line', () => {
  it('shows the server’s total as sent and never adds the fee itself', () => {
    expect(text(booking('requested', sampleDjs.koyo, 47096))).toBe(
      '$470.96 held on your card, not charged. You’re charged only if KOYO accepts.',
    );
  });

  it('matches the status table', () => {
    expect(text(booking('authorization_required', sampleDjs.nightform, 60700))).toBe(
      'NIGHTFORM won’t see this request until your card is held for $607.00.',
    );
    expect(text(booking('confirmed'))).toBe('$457.00 charged. KOYO is on your public lineup.');
    expect(text(booking('declined'))).toBe('KOYO passed on this one. Your hold was released and you were not charged.');
    expect(text(booking('cancelled'))).toBe('This booking was cancelled.');
  });

  it('marks the amount as the strong part', () => {
    expect(statusLine(booking('confirmed'))[0]).toEqual({ text: '$457.00', strong: true });
  });
});

describe('published with offers outstanding', () => {
  it('lists one row per open booking', () => {
    const rows = openBookingRows([
      booking('requested', sampleDjs.koyo),
      booking('authorization_required', sampleDjs.nightform),
      booking('confirmed', sampleDjs.blkmtn),
    ]);
    expect(rows.map((r) => r.title)).toEqual(['KOYO is still deciding', 'NIGHTFORM not sent yet']);
    expect(rows[1].warning).toBe(true);
    expect(rows[1].detail).toBe('They won’t see your request until you pay.');
  });

  it('pays the first unpaid DJ', () => {
    expect(firstUnpaid([booking('requested'), booking('authorization_required', sampleDjs.nightform)])?.dj.name).toBe('NIGHTFORM');
  });

  it('warns when a draft is saved with a hold running', () => {
    expect(draftHoldNotice([booking('requested', sampleDjs.blkmtn)])).toBe(
      'BLKMTN already has your request. Saving a draft doesn’t pause it, and your card stays held until they answer.',
    );
    expect(draftHoldNotice([booking('authorization_required'), booking('confirmed')])).toBeNull();
  });
});
