import { fireEvent, screen } from '@testing-library/react-native';

import { createFakeRepository, sampleCities, sampleDjs } from '@/data/fakeRepository';
import { EMPTY_FIELDS } from '@/features/events/completeness';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { FEE_FOOTER, LineupView, POLL_LINE } from '../LineupView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

describe('Lineup screen', () => {
  it('is blocked until the event has a night and a city', async () => {
    await renderWithProviders(<LineupView eventId="new" fromForm />, {
      draft: {
        key: 'new',
        communityId: 'c_second_sundays',
        session: 't',
        fields: { ...EMPTY_FIELDS, name: 'Warehouse Friday', date: '2026-11-20', startTime: '22:00', endTime: '02:00' },
      },
    });
    expect(await screen.findByText('Set the night and the city first')).toBeTruthy();
    expect(screen.getByText('Fri, Nov 20 · 10:00 PM – 2:00 AM')).toBeTruthy();
    expect(screen.getByText('Add a city to see who’s open')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add a location' })).toBeTruthy();
    expect(screen.getByText('Browse talent unlocks as soon as both are set.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Browse talent' })).toBeNull();
  });

  it('asks for a date first when neither is set', async () => {
    await renderWithProviders(<LineupView eventId="new" fromForm />, {
      draft: { key: 'new', communityId: 'c', session: 't', fields: EMPTY_FIELDS },
    });
    expect(await screen.findByRole('button', { name: 'Add a date' })).toBeTruthy();
  });

  it('is empty with Browse talent once the night and city are set', async () => {
    await renderWithProviders(<LineupView eventId="e_long_table" />);
    expect(await screen.findByText('No talent booked yet')).toBeTruthy();
    expect(screen.getByText(/See which DJs are open on Sun, Nov 22 in Atlanta\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse talent' })).toBeTruthy();
    expect(screen.getByText('DJs, availability and rates from Gelatin')).toBeTruthy();
    expect(screen.getByText(/Create the event without talent and add DJs later/)).toBeTruthy();
  });

  it('uses the unsaved draft’s city over the saved one', async () => {
    await renderWithProviders(<LineupView eventId="new" fromForm />, {
      draft: {
        key: 'new',
        communityId: 'c',
        session: 't',
        fields: { ...EMPTY_FIELDS, name: 'Day One', date: '2026-12-05', city: sampleCities[2] },
      },
    });
    expect(await screen.findByText(/open on Sat, Dec 5 in Chicago/)).toBeTruthy();
  });

  it('shows added DJs with a pre-filled and an empty fee, and blocks Send until both have one', async () => {
    await renderWithProviders(<LineupView eventId="e_late_service" />);
    expect(await screen.findByText('2 DJs added · offers not sent')).toBeTruthy();
    expect(screen.getByText('Top performer · rate $450')).toBeTruthy();
    expect(screen.getByText('City pillar · private rate')).toBeTruthy();
    expect(screen.getByTestId('fee-dj_koyo').props.value).toBe('450');
    expect(screen.getByTestId('fee-dj_nightform').props.value).toBe('');
    expect(screen.getByTestId('fee-missing-dj_nightform')).toHaveTextContent('Enter a fee to send this offer.');
    expect(screen.queryByTestId('fee-missing-dj_koyo')).toBeNull();
    expect(screen.getByLabelText('Note to KOYO')).toBeTruthy();
    expect(screen.getByText(FEE_FOOTER)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send 2 offers' })).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId('fee-dj_nightform'), '600');
    expect(screen.queryByTestId('fee-missing-dj_nightform')).toBeNull();
    expect(screen.getByRole('button', { name: 'Send 2 offers' })).toBeEnabled();

    await fireEvent.changeText(screen.getByTestId('fee-dj_koyo'), '');
    expect(screen.getByTestId('fee-missing-dj_koyo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send 2 offers' })).toBeDisabled();
  });

  it('removes a DJ and updates the count', async () => {
    await renderWithProviders(<LineupView eventId="e_late_service" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Remove NIGHTFORM' }));
    expect(await screen.findByRole('button', { name: 'Send 1 offer' })).toBeEnabled();
    expect(screen.getByText('1 DJ added · offers not sent')).toBeTruthy();
  });

  it('shows bookings in motion with one status, one money line and one action each', async () => {
    await renderWithProviders(<LineupView eventId="e_warehouse_friday" />);
    expect(await screen.findByText('1 confirmed · 1 waiting · 1 to pay')).toBeTruthy();
    expect(screen.getByText('Payment needed')).toBeTruthy();
    expect(screen.getByText('Card held · waiting for the DJ')).toBeTruthy();
    expect(screen.getByText('Confirmed')).toBeTruthy();
    expect(screen.getByText('$607.00')).toBeTruthy();
    expect(screen.getByText('$397.00')).toBeTruthy();
    expect(screen.getByText('$457.00')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Pay now' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Manage in Gelatin' })).toHaveLength(2);
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
    expect(screen.queryByText(FEE_FOOTER)).toBeNull();
  });

  it('hides the polling line when no DJ is deciding', async () => {
    const base = createFakeRepository({ delayMs: 0 });
    const repository = {
      ...base,
      getEventBookings: async () => [
        { requestId: 'br_1', dj: sampleDjs.koyo, status: 'confirmed' as const, offerCents: 45000, totalCents: 45700, note: '', setTime: 'Midnight to 2' },
        { requestId: 'br_2', dj: sampleDjs.sable, status: 'declined' as const, offerCents: 27500, totalCents: 28200, note: '', setTime: 'Opening set' },
      ],
    };
    await renderWithProviders(<LineupView eventId="e_warehouse_friday" />, { repository });
    expect(await screen.findByText('Passed')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Other DJs open that night' })).toBeTruthy();
    expect(screen.queryByText(POLL_LINE)).toBeNull();
  });
});
