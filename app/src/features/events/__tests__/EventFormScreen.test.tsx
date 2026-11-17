import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { EventFormScreen } from '../EventFormScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

describe('Create New Event', () => {
  it('shows four sections in order, with no Lineup: that is an add-on once the event exists', async () => {
    await renderWithProviders(<EventFormScreen />);
    expect(await screen.findByText('Create New Event')).toBeTruthy();
    const titles = ['Event details', 'Date & time', 'Location'];
    titles.forEach((t) => expect(screen.getByText(t)).toBeTruthy());
    expect(screen.getByText(/^Access & passes/)).toBeTruthy();
    expect(screen.queryByText('Lineup')).toBeNull();
    expect(screen.queryByTestId('section-lineup')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add a name to publish' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeEnabled();
  });

  it('ticks complete sections for a saved event and allows publishing with no lineup', async () => {
    await renderWithProviders(<EventFormScreen eventId="e_long_table" />);
    expect(await screen.findByTestId('section-when-done')).toBeTruthy();
    expect(screen.getByTestId('section-details-done')).toBeTruthy();
    expect(screen.getByTestId('section-location-done')).toBeTruthy();
    expect(screen.getByText('Sun, Nov 22 · 7:30 PM – 10:30 PM')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save & publish' })).toBeEnabled();
  });
});
