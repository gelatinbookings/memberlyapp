import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createFakeRepository, sampleCities, sampleDjs } from '@/data/fakeRepository';
import { EMPTY_FIELDS } from '@/features/events/completeness';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { FEE_FOOTER, LineupView, POLL_LINE, SAVE_FIRST_NOTICE, SAVES_DRAFT_LINE } from '../LineupView';
import { unbrokenParts } from '@/features/booking/lineupSummary';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };

describe('Lineup → Browse talent', () => {
  beforeEach(() => router.push.mockClear());

  it('opens Browse talent for the event from the empty state', async () => {
    await renderWithProviders(<LineupView eventId="e_long_table" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Browse talent' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/browse', params: { id: 'e_long_table' } });
    expect(screen.queryByText(SAVES_DRAFT_LINE)).toBeNull();
  });

  it('opens Browse talent from + once DJs are added', async () => {
    await renderWithProviders(<LineupView eventId="e_late_service" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Add more talent' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/organizer/events/[id]/browse', params: { id: 'e_late_service' } });
  });

  it('saves a new event as a draft first, so the night and city come from the saved event', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<LineupView eventId="new" fromForm />, {
      repository,
      draft: {
        key: 'new',
        communityId: '',
        session: 't',
        fields: { ...EMPTY_FIELDS, name: 'Day One', date: '2026-12-05', city: sampleCities[0] },
      },
    });
    expect(await screen.findByText(SAVES_DRAFT_LINE)).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Browse talent' })));
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const { params } = router.push.mock.calls[0][0] as { params: { id: string } };
    expect(params.id).not.toBe('new');
    // The Lineup carries on under the saved id.
    expect(await screen.findByText(/open on Sat, Dec 5 in Atlanta/)).toBeTruthy();
    await act(async () => {
      const saved = await repository.getOrganizerEvent(params.id);
      expect(saved).toMatchObject({ name: 'Day One', status: 'draft', date: '2026-12-05', communityId: 'c_second_sundays' });
      expect((await repository.getTalent(params.id)).citySupported).toBe(true);
    });
  });

  it('asks a live event to save a changed night first, and never saves it silently', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const saveEvent = jest.fn(repository.saveEvent);
    await renderWithProviders(<LineupView eventId="e_long_table" fromForm />, {
      repository: { ...repository, saveEvent },
      draft: {
        key: 'e_long_table',
        communityId: 'c_second_sundays',
        session: 't',
        // Long Table is live on Sun, Nov 22; the open form has moved it a week.
        fields: { ...EMPTY_FIELDS, name: 'Long Table', date: '2026-11-29', city: sampleCities[0], venue: 'Inman Park loft' },
      },
    });
    const browse = await screen.findByRole('button', { name: 'Browse talent' });
    await act(async () => fireEvent.press(browse));
    expect(await screen.findByText(SAVE_FIRST_NOTICE)).toBeTruthy();
    expect(saveEvent).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

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

  it('saves the note as it is typed, and counts characters from 240 of 280', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<LineupView eventId="e_late_service" />, { repository });
    const note = await screen.findByTestId('note-dj_koyo');
    expect(note.props.maxLength).toBe(280);

    await fireEvent.changeText(note, 'Headline set, midnight to 2.');
    expect(screen.queryByText(/of 280 characters/)).toBeNull();
    // No blur needed: Send picks the note up even with the keyboard still open.
    await waitFor(async () =>
      expect((await repository.getDraftOffers('e_late_service'))[0].note).toBe('Headline set, midnight to 2.'),
    );

    await fireEvent.changeText(note, 'x'.repeat(240));
    expect(screen.getByText('240 of 280 characters')).toBeTruthy();
  });

  it('removes a DJ and updates the count', async () => {
    await renderWithProviders(<LineupView eventId="e_late_service" />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Remove NIGHTFORM' }));
    expect(await screen.findByRole('button', { name: 'Send 1 offer' })).toBeEnabled();
    expect(screen.getByText('1 DJ added · offers not sent')).toBeTruthy();
  });

  it('shows bookings in motion with one status, one money line and one action each', async () => {
    await renderWithProviders(<LineupView eventId="e_warehouse_friday" />);
    expect(await screen.findByText(unbrokenParts('1 confirmed · 1 waiting · 1 to pay'))).toBeTruthy();
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
      getEventBookings: async () => ({
        etag: 'W/"test"',
        bookings: [
          { requestId: 'br_1', dj: sampleDjs.koyo, status: 'confirmed' as const, offerCents: 45000, totalCents: 45700, note: '', setTime: 'Midnight to 2' },
          { requestId: 'br_2', dj: sampleDjs.sable, status: 'declined' as const, offerCents: 27500, totalCents: 28200, note: '', setTime: 'Opening set' },
        ],
      }),
    };
    await renderWithProviders(<LineupView eventId="e_warehouse_friday" />, { repository });
    expect(await screen.findByText('Passed')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Other DJs open that night' })).toBeTruthy();
    expect(screen.queryByText(POLL_LINE)).toBeNull();
  });
});
