import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { useEffect } from 'react';

import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { addMinutes, durationLabel, fromClock, toClock } from '@/lib/dates';

import { EMPTY_FIELDS, whenSummary } from '../completeness';
import { EventFormScreen } from '../EventFormScreen';
import { useEventDraft, type EventDraft } from '../EventDraftProvider';
import { frequencyLabel, occurrences, recurrenceLabel, weekOfMonth } from '../recurrence';
import { WhenWhereScreen } from '../WhenWhereScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));
const adjust = (el: Parameters<typeof fireEvent>[0], actionName: 'increment' | 'decrement') =>
  act(async () => fireEvent(el, 'accessibilityAction', { nativeEvent: { actionName } }));

const onDraft = jest.fn<void, [ReturnType<typeof useEventDraft>['draft']]>();
function DraftSpy() {
  const { draft } = useEventDraft();
  useEffect(() => onDraft(draft), [draft]);
  return null;
}
const latest = () => onDraft.mock.lastCall?.[0]?.fields;
const draftOn = (date: string | null): EventDraft => ({ key: 'new', communityId: 'c_second_sundays', fields: { ...EMPTY_FIELDS, name: 'Night Garden', date }, session: 's' });

beforeEach(() => onDraft.mockClear());

describe('time helpers', () => {
  it('moves round the clock and words the length', () => {
    expect(addMinutes('22:00', 240)).toBe('02:00');
    expect(durationLabel('22:00', '02:00')).toBe('4 hours');
    expect(durationLabel('19:30', '23:00')).toBe('3 hr 30 min');
    expect(toClock('00:15')).toEqual({ hour: 12, minute: 15, pm: false });
    expect(fromClock(12, 0, true)).toBe('12:00');
    expect(fromClock(10, 45, true)).toBe('22:45');
  });
});

describe('recurrence', () => {
  it('words the choices from the date (Fri, Nov 20, 2026 is the third Friday)', () => {
    expect(weekOfMonth('2026-11-20')).toBe(2);
    expect(frequencyLabel('weekly', '2026-11-20')).toBe('Every week on Friday');
    expect(frequencyLabel('monthly', '2026-11-20')).toBe('Every month on the third Friday');
    expect(frequencyLabel('monthly', '2026-11-27')).toBe('Every month on the last Friday');
    expect(recurrenceLabel(null, '2026-11-20')).toBe('Does not repeat');
  });

  it('lists the dates: weekly, every 2 weeks, and the same weekday each month', () => {
    expect(occurrences('2026-11-20', { frequency: 'weekly', count: 3 }, 10)).toEqual(['2026-11-20', '2026-11-27', '2026-12-04']);
    expect(occurrences('2026-11-20', { frequency: 'biweekly', count: null }, 2)).toEqual(['2026-11-20', '2026-12-04']);
    expect(occurrences('2026-11-20', { frequency: 'monthly', count: 3 }, 10)).toEqual(['2026-11-20', '2026-12-18', '2027-01-15']);
    expect(occurrences('2026-11-27', { frequency: 'monthly', count: 2 }, 10)).toEqual(['2026-11-27', '2026-12-25']);
  });
});

describe('Date & time: times', () => {
  it('one sheet sets both times: a quick pick for the start, the end follows four hours later, Done saves both', async () => {
    await renderWithProviders(
      <>
        <WhenWhereScreen />
        <DraftSpy />
      </>,
      { draft: draftOn('2026-11-20') },
    );
    await press(await screen.findByTestId('field-starts'));
    const sheet = within(screen.getByTestId('times-sheet'));
    await press(sheet.getByTestId('pick-start-22:00'));
    expect(sheet.getByTestId('tab-end')).toHaveTextContent(/2:00 AM/);
    expect(sheet.getByTestId('times-summary')).toHaveTextContent('4 hours · ends the next morning');
    await press(sheet.getByTestId('times-done'));
    expect(latest()).toMatchObject({ startTime: '22:00', endTime: '02:00' });
    expect(whenSummary(latest()!)).toBe('Fri, Nov 20 · 10:00 PM – 2:00 AM');
  });

  it('the wheels move by the quarter hour, and length picks set the end', async () => {
    await renderWithProviders(
      <>
        <WhenWhereScreen />
        <DraftSpy />
      </>,
      { draft: { ...draftOn('2026-11-20'), fields: { ...draftOn('2026-11-20').fields, startTime: '20:00', endTime: '23:00' } } },
    );
    await press(await screen.findByTestId('field-ends'));
    const sheet = within(screen.getByTestId('times-sheet'));
    await adjust(sheet.getByTestId('end-minute'), 'increment');
    expect(sheet.getByTestId('tab-end')).toHaveTextContent(/11:15 PM/);
    await press(sheet.getByTestId('pick-length-300'));
    expect(sheet.getByTestId('tab-end')).toHaveTextContent(/1:00 AM/);
    await press(sheet.getByTestId('tab-start'));
    await adjust(sheet.getByTestId('start-hour'), 'increment');
    // A set end stays put when the start moves.
    expect(sheet.getByTestId('tab-start')).toHaveTextContent(/9:00 PM/);
    expect(sheet.getByTestId('tab-end')).toHaveTextContent(/1:00 AM/);
    await press(sheet.getByTestId('times-done'));
    expect(latest()).toMatchObject({ startTime: '21:00', endTime: '01:00' });
  });
});

describe('Date & time: repeats', () => {
  it('picks how it repeats from a row of chips, then how many dates, and words the series from the date', async () => {
    await renderWithProviders(
      <>
        <WhenWhereScreen />
        <DraftSpy />
      </>,
      { draft: draftOn('2026-11-20') },
    );
    const row = within(await screen.findByTestId('repeat-frequency'));
    expect(row.getByTestId('repeat-none').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.queryByTestId('repeat-count')).toBeNull();

    await press(row.getByTestId('repeat-weekly'));
    expect(latest()?.recurrence).toEqual({ frequency: 'weekly', count: 8 });
    await press(within(screen.getByTestId('repeat-count')).getByTestId('repeat-count-4'));
    expect(latest()?.recurrence).toEqual({ frequency: 'weekly', count: 4 });
    expect(screen.getByTestId('repeat-summary')).toHaveTextContent('Every week on Friday · 4 dates. Fri, Nov 20 · Fri, Nov 27 · Fri, Dec 4 …');

    await press(row.getByTestId('repeat-monthly'));
    expect(screen.getByTestId('repeat-summary')).toHaveTextContent(/Every month on the third Friday · 4 dates/);

    await press(row.getByTestId('repeat-none'));
    expect(latest()?.recurrence).toBeNull();
    expect(screen.queryByTestId('repeat-summary')).toBeNull();
  });

  it('with no date yet, it says to pick one to see the dates', async () => {
    await renderWithProviders(<WhenWhereScreen />, { draft: draftOn(null) });
    await press(within(await screen.findByTestId('repeat-frequency')).getByTestId('repeat-biweekly'));
    expect(screen.getByTestId('repeat-summary')).toHaveTextContent('Pick a date to see which dates it repeats on.');
  });
});

describe('Create New Event', () => {
  it('marks Access & passes as optional', async () => {
    await renderWithProviders(<EventFormScreen />);
    expect(await screen.findByText(/\(Optional\)/)).toBeTruthy();
    expect(screen.getByTestId('section-access').props.accessibilityLabel).toMatch(/^Access & passes, optional/);
  });
});
