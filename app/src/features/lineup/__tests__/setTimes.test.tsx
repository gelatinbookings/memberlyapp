import { onlineManager } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { createFakeRepository } from '@/data/fakeRepository';
import { LineupView } from '@/features/lineup/LineupView';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { setTimesFor, suggestedSets, withSetTimes } from '../setTimes';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Late Service: 10 PM to 3 AM, with KOYO then NIGHTFORM added and nothing sent. */
const EVENT = 'e_late_service';
const KOYO = 'dj_koyo';
const NIGHTFORM = 'dj_nightform';

beforeEach(() => onlineManager.setOnline(true));

describe('suggested sets', () => {
  it('shares the night out back to back from the start, the last set ending with the event', () => {
    expect(suggestedSets({ startTime: '22:00', endTime: '03:00' }, 2)).toEqual([
      { start: '22:00', end: '00:30' },
      { start: '00:30', end: '03:00' },
    ]);
    expect(suggestedSets({ startTime: '20:00', endTime: '00:00' }, 3)).toEqual([
      { start: '20:00', end: '21:30' },
      { start: '21:30', end: '23:00' },
      { start: '23:00', end: '00:00' },
    ]);
  });

  it('with no end time, each set is two hours; with no start, there is nothing to suggest', () => {
    expect(suggestedSets({ startTime: '21:00', endTime: null }, 2)).toEqual([
      { start: '21:00', end: '23:00' },
      { start: '23:00', end: '01:00' },
    ]);
    expect(suggestedSets({ startTime: null, endTime: '02:00' }, 2)).toBeNull();
  });

  it('a set the organizer chose wins over the suggestion, and the others still follow the event', () => {
    const dj = { id: 'a' } as never;
    const offers = [
      { dj, offerCents: 100, note: '' },
      { dj, offerCents: 100, note: '', setStart: '01:00', setEnd: '02:00' },
    ];
    const fields = { startTime: '22:00', endTime: '02:00' };
    expect(setTimesFor(offers, fields)).toEqual([
      { start: '22:00', end: '00:00', suggested: true },
      { start: '01:00', end: '02:00', suggested: false },
    ]);
    expect(withSetTimes(offers, fields).map((o) => [o.setStart, o.setEnd])).toEqual([
      ['22:00', '00:00'],
      ['01:00', '02:00'],
    ]);
  });
});

describe('Lineup: set times', () => {
  it('each added DJ starts with a set suggested from the event start, which can be changed', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<LineupView eventId={EVENT} />, { repository });

    expect(await screen.findByTestId(`set-${KOYO}`)).toHaveTextContent('10 PM – 12:30 AM · 2 hr 30 min');
    expect(screen.getByTestId(`set-${NIGHTFORM}`)).toHaveTextContent('12:30 AM – 3 AM · 2 hr 30 min');
    expect(screen.getByTestId(`set-suggested-${KOYO}`)).toHaveTextContent('Suggested from the 10 PM start. Tap to change.');

    await press(screen.getByTestId(`set-${NIGHTFORM}`));
    const sheet = within(screen.getByTestId(`set-sheet-${NIGHTFORM}`));
    expect(sheet.getByText('NIGHTFORM’s set')).toBeTruthy();
    await press(sheet.getByTestId('pick-start-01:00'));
    await press(sheet.getByTestId('tab-end'));
    await press(sheet.getByTestId('pick-length-120'));
    await press(sheet.getByTestId('times-done'));

    await waitFor(() => expect(screen.getByTestId(`set-${NIGHTFORM}`)).toHaveTextContent('1 AM – 3 AM · 2 hours'));
    expect(screen.queryByTestId(`set-suggested-${NIGHTFORM}`)).toBeNull();
    expect((await repository.getDraftOffers(EVENT)).find((o) => o.dj.id === NIGHTFORM)).toMatchObject({ setStart: '01:00', setEnd: '03:00' });
  });

  it('an offer goes out with its set, and the booking shows it', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await repository.updateDraftOffer(EVENT, NIGHTFORM, { offerCents: 60000 });
    await renderWithProviders(<LineupView eventId={EVENT} />, { repository });
    await press(await screen.findByTestId('send-offers'));
    const review = within(await screen.findByTestId('offer-review'));
    expect(review.getByTestId('review-set')).toHaveTextContent('10 PM – 12:30 AM');

    const booking = await repository.createOffer(EVENT, {
      djId: KOYO,
      offerCents: 45000,
      note: '',
      setStart: '22:00',
      setEnd: '00:30',
      clientOfferId: 'set-test',
    });
    expect(booking.setTime).toBe('10 PM – 12:30 AM');
  });
});
