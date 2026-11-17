import { useEffect } from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react-native';

import { createFakeRepository } from '@/data/fakeRepository';
import { searchSampleVenues, venueAddress } from '@/data/sampleVenues';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { EMPTY_FIELDS, locationComplete } from '../completeness';
import { useEventDraft, type EventDraft } from '../EventDraftProvider';
import { VENUE_NO_MATCH, VENUE_SEARCH_DEBOUNCE_MS, VENUE_SEARCH_ERROR } from '../VenueField';
import { WhenWhereScreen } from '../WhenWhereScreen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const draft = (): EventDraft => ({ key: 'new', communityId: 'c_second_sundays', fields: { ...EMPTY_FIELDS, name: 'Night Garden' }, session: 's' });

/** Reports what the screen has put in the draft. */
const onDraft = jest.fn<void, [ReturnType<typeof useEventDraft>['draft']]>();
function DraftSpy() {
  const { draft: current } = useEventDraft();
  useEffect(() => onDraft(current), [current]);
  return null;
}
const latestDraft = () => onDraft.mock.lastCall?.[0] ?? null;

async function typeVenue(text: string) {
  const field = screen.getByTestId('field-venue');
  await act(async () => {
    fireEvent(field, 'focus');
    fireEvent.changeText(field, text);
  });
  // The debounce, then the search answering.
  for (const ms of [VENUE_SEARCH_DEBOUNCE_MS + 10, 50, 50]) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  onDraft.mockClear();
});
afterEach(() => jest.useRealTimers());

describe('venue search (fake backend)', () => {
  it('matches the start of any word in the name or address, Gelatin first, at most five each', () => {
    const r = searchSampleVenues('warehouse');
    expect(r.gelatin.map((v) => v.name)).toEqual(['The Warehouse District']);
    expect(r.google.map((v) => v.name)).toEqual(['West Loop Warehouse']);
    expect(searchSampleVenues('mitchell').google.map((v) => v.name)).toEqual(['Mitchell Street Social']);
    expect(searchSampleVenues('540 mitch').gelatin.map((v) => v.id)).toEqual(['gv_warehouse_district']);
    expect(searchSampleVenues('atlanta').gelatin.length).toBeLessThanOrEqual(5);
    expect(searchSampleVenues('w')).toEqual({ gelatin: [], google: [] });
  });

  it('a venue brings a one-line address and its city with a time zone', () => {
    const [red] = searchSampleVenues('redstone').google;
    expect(venueAddress(red)).toBe('18300 W Alameda Pkwy, Morrison, CO 80465');
    expect(red.city.timeZone).toBe('America/Denver');
  });
});

describe('Location: venue type-ahead', () => {
  it('suggests Gelatin venues and Google places as you type, and picking one fills the address, city and time zone', async () => {
    await renderWithProviders(
      <>
        <WhenWhereScreen />
        <DraftSpy />
      </>,
      { draft: draft() },
    );
    await typeVenue('sunset');
    const results = within(await screen.findByTestId('venue-results'));
    // No section headings: the icon tells a Gelatin venue from a Google place.
    expect(results.queryByText(/Gelatin venues|From Google/i)).toBeNull();
    expect(results.getByLabelText(/Sunset Terrace, .*, Gelatin venue/)).toBeTruthy();
    expect(results.getByText('8800 Sunset Blvd, Los Angeles, CA 90069')).toBeTruthy();

    await act(async () => fireEvent.press(results.getByTestId('venue-gv_sunset_terrace')));
    expect(latestDraft()?.fields.venue).toBe('Sunset Terrace');
    expect(latestDraft()?.fields.place?.id).toBe('gv_sunset_terrace');
    expect(latestDraft()?.fields.city).toMatchObject({ name: 'Los Angeles', region: 'CA', timeZone: 'America/Los_Angeles' });
    expect(locationComplete(latestDraft()!.fields)).toBe(true);

    const picked = within(screen.getByTestId('venue-picked'));
    expect(picked.getByText('8800 Sunset Blvd')).toBeTruthy();
    expect(picked.getByText('Los Angeles, CA 90069')).toBeTruthy();
    expect(picked.getByText('Gelatin venue')).toBeTruthy();
    expect(screen.getByTestId('venue-zone')).toHaveTextContent(/Pacific/);
    // The venue sets the city, so there is no city to pick.
    expect(screen.queryByTestId('field-city')).toBeNull();
  });

  it('a Google place in a city Memberly has no list for still brings its zone (Phoenix keeps no daylight saving)', async () => {
    await renderWithProviders(
      <>
        <WhenWhereScreen />
        <DraftSpy />
      </>,
      { draft: draft() },
    );
    await typeVenue('desert garden');
    const results = within(await screen.findByTestId('venue-results'));
    expect(results.getByText('Places powered by Google')).toBeTruthy();
    await act(async () => fireEvent.press(results.getByTestId('venue-gp_desert_botanical')));
    expect(latestDraft()?.fields.city?.timeZone).toBe('America/Phoenix');
    expect(within(screen.getByTestId('venue-picked')).getByText('Google')).toBeTruthy();
  });

  it('Change drops the venue and searches again; a name nobody knows can be used as typed, with the city picked by hand', async () => {
    await renderWithProviders(
      <>
        <WhenWhereScreen />
        <DraftSpy />
      </>,
      { draft: draft() },
    );
    await typeVenue('long table');
    await act(async () => fireEvent.press(within(await screen.findByTestId('venue-results')).getByTestId('venue-gv_long_table_hall')));
    await act(async () => fireEvent.press(screen.getByTestId('venue-change')));
    expect(latestDraft()?.fields.place).toBeNull();
    expect(screen.getByTestId('field-venue')).toBeTruthy();

    await typeVenue('My Backyard');
    expect(await screen.findByText(VENUE_NO_MATCH)).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByTestId('venue-as-typed')));
    expect(latestDraft()?.fields.venue).toBe('My Backyard');
    expect(latestDraft()?.fields.place).toBeNull();
    expect(screen.getByTestId('field-city')).toBeTruthy();
  });

  it('offline: says search is unreachable and still lets the name be used as typed', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.simulate({ offline: true });
    await renderWithProviders(<WhenWhereScreen />, { repository, draft: draft() });
    await typeVenue('warehouse');
    expect(await screen.findByText(VENUE_SEARCH_ERROR)).toBeTruthy();
    expect(screen.getByTestId('venue-as-typed')).toBeTruthy();
  });
});
