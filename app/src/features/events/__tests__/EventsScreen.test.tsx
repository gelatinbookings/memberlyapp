import { fireEvent, screen, within } from '@testing-library/react-native';

import EventsScreen, { EMPTY_SCOPE } from '@/app/(tabs)/events';
import { createFakeRepository } from '@/data/fakeRepository';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { countLine, groupUpcoming } from '../grouping';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

describe('Events tab scopes', () => {
  it('groups upcoming into This week and Later with Pass, Going and Saved', async () => {
    const repo = createFakeRepository({ delayMs: 0 });
    const upcoming = await repo.getMyEvents('upcoming');
    expect(countLine(upcoming)).toBe('1 pass · 2 you’re going to');
    const groups = groupUpcoming(upcoming, repo.now());
    expect(groups.thisWeek.map((e) => [e.id, e.relation])).toEqual([
      ['e_long_table', 'going'],
      ['e_rooftop_hours', 'going'],
      ['e_warehouse_friday', 'pass'],
    ]);
    expect(groups.later.map((e) => [e.id, e.relation])).toEqual([['e_daylight', 'saved']]);
    expect((await repo.getMyEvents('saved')).map((e) => e.id)).toEqual(['e_daylight']);
  });

  it('renders the count line, both sections and the pills', async () => {
    await renderWithProviders(<EventsScreen />);
    expect(await screen.findByText('1 pass · 2 you’re going to')).toBeTruthy();
    expect(await screen.findByText('This week')).toBeTruthy();
    expect(screen.getByText('Later')).toBeTruthy();
    expect(within(screen.getByTestId('event-row-e_warehouse_friday')).getByText('Pass')).toBeTruthy();
    expect(within(screen.getByTestId('event-row-e_rooftop_hours')).getByText('Going')).toBeTruthy();
    expect(within(screen.getByTestId('event-row-e_daylight')).getByText('Saved')).toBeTruthy();
  });

  it('explains an empty scope and links to Explore', async () => {
    await renderWithProviders(<EventsScreen />);
    await screen.findByText('This week');
    await fireEvent.press(screen.getByRole('button', { name: 'Past' }));
    expect(await screen.findByText(EMPTY_SCOPE.past)).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: 'Find something in Explore' }));
    expect(mockPush).toHaveBeenCalledWith('/explore');
  });
});
