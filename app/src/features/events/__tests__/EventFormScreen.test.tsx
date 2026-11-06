import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { EventFormScreen, NO_LINEUP_NOTICE } from '../EventFormScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

describe('Create New Event', () => {
  it('shows five sections in order and explains what blocks publishing', async () => {
    await renderWithProviders(<EventFormScreen />);
    expect(await screen.findByText('Create New Event')).toBeTruthy();
    const titles = ['Event details', 'Date & time', 'Location', 'Lineup', 'Access & passes'];
    titles.forEach((t) => expect(screen.getByText(t)).toBeTruthy());
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('Add a date and city first')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a name to publish' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeEnabled();
    expect(screen.getByText(NO_LINEUP_NOTICE)).toBeTruthy();
  });

  it('ticks complete sections for a saved event and allows publishing with no lineup', async () => {
    await renderWithProviders(<EventFormScreen eventId="e_long_table" />);
    expect(await screen.findByTestId('section-when-done')).toBeTruthy();
    expect(screen.getByTestId('section-details-done')).toBeTruthy();
    expect(screen.getByTestId('section-location-done')).toBeTruthy();
    expect(screen.getByText('Sun, Nov 22 · 7:30 PM – 10:30 PM')).toBeTruthy();
    expect(screen.getByText('Book DJs open on Nov 22 in Atlanta')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save & publish' })).toBeEnabled();
  });
});
