import { act, fireEvent, screen } from '@testing-library/react-native';

import { createFakeRepository } from '@/data/fakeRepository';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { PreferencesView } from '../PreferencesView';
import { canContinue, continueLabel, countPicked, MIN_EVENT_TYPES } from '../steps';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

describe('preferences: at least three on step 1', () => {
  it('needs three event types before Continue', () => {
    expect(MIN_EVENT_TYPES).toBe(3);
    expect(canContinue(0, 2)).toBe(false);
    expect(continueLabel(0, 2)).toBe('Pick at least three');
    expect(canContinue(0, 3)).toBe(true);
    expect(continueLabel(0, 3)).toBe('Continue · 3 selected');
  });

  it('has no minimum on steps 2 to 4', () => {
    expect(canContinue(1, 0)).toBe(true);
    expect(continueLabel(1, 0)).toBe('Continue');
    expect(continueLabel(3, 2, { last: true, editing: true })).toBe('Save · 2 selected');
  });

  it('counts every pick', () => {
    expect(countPicked({ eventTypes: ['a', 'b', 'c'], genres: ['d'], vibes: [], themes: ['e'] })).toBe(5);
  });

  it('turns Continue on at the third tile', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await repository.putPreferences({ eventTypes: [], genres: [], vibes: [], themes: [] });
    await renderWithProviders(<PreferencesView />, { repository });
    expect(await screen.findByText('What do you go out for?')).toBeTruthy();
    await screen.findByRole('checkbox', { name: 'Nightlife' });
    const button = screen.getByRole('button', { name: 'Pick at least three' });
    expect(button.props.accessibilityState.disabled).toBe(true);

    for (const tile of ['Nightlife', 'Concerts']) await fireEvent.press(screen.getByRole('checkbox', { name: tile }));
    expect(screen.getByRole('button', { name: 'Pick at least three' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Dinners' }));
    const next = screen.getByRole('button', { name: 'Continue · 3 selected' });
    expect(next.props.accessibilityState.disabled).toBe(false);

    await act(async () => fireEvent.press(next));
    expect(await screen.findByText('What do you want to hear?')).toBeTruthy();
  });

  it('Skip saves what is picked and moves on to permissions', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await repository.putPreferences({ eventTypes: [], genres: [], vibes: [], themes: [] });
    await renderWithProviders(<PreferencesView />, { repository });
    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Art' }));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Skip' })));
    expect((await repository.getPreferences()).eventTypes).toEqual(['Art']);
    expect(mockPush).toHaveBeenCalledWith('/permissions');
  });
});
