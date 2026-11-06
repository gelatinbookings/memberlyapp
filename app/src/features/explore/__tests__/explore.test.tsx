import { act, fireEvent, screen, within } from '@testing-library/react-native';

import ExploreScreen, { SEARCH_DEBOUNCE_MS } from '@/app/(tabs)/explore';
import { sampleCommunities, sampleEvents } from '@/data/fakeRepository';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { defaultFilters, filtersActive, groupCountLabel, resetFilters, runExplore, showButtonLabel } from '../filters';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const data = { communities: sampleCommunities, events: sampleEvents };
const q = (filters = defaultFilters('Atlanta'), text = '') => ({ text, category: 'All', filters });

describe('explore filter counts', () => {
  it('counts twelve communities in the member’s city by default', () => {
    const r = runExplore(data, q(), 'Atlanta');
    expect(r.count).toBe(12);
    expect(showButtonLabel('communities', r.count)).toBe('Show 12 communities');
  });

  it('narrows the live count as groups are picked', () => {
    const techno = runExplore(data, q({ ...defaultFilters('Atlanta'), genres: ['Techno'] }), 'Atlanta');
    expect(techno.count).toBe(1);
    expect(showButtonLabel('communities', techno.count)).toBe('Show 1 community');
    const foodUpscale = runExplore(
      data,
      q({ ...defaultFilters('Atlanta'), communityTypes: ['Food & wine'], vibes: ['Upscale'] }),
      'Atlanta',
    );
    expect(foodUpscale.communities.map((c) => c.name)).toEqual(['Supper Club ATL']);
    const anywhere = runExplore(data, q({ ...defaultFilters('Atlanta'), location: 'Anywhere' }), 'Atlanta');
    expect(anywhere.count).toBe(15);
  });

  it('counts events when the sheet is set to Events', () => {
    const r = runExplore(data, q({ ...defaultFilters('Atlanta'), kind: 'events', location: 'Near me' }), 'Atlanta');
    expect(r.events.every((e) => (e.distanceMiles ?? 99) <= 3)).toBe(true);
    expect(showButtonLabel('events', r.count)).toBe(`Show ${r.count} ${r.count === 1 ? 'event' : 'events'}`);
  });

  it('labels each group and resets to the city', () => {
    expect(groupCountLabel([])).toBe('Any');
    expect(groupCountLabel(['House', 'R&B'])).toBe('2 picked');
    const narrowed = { ...defaultFilters('Atlanta'), genres: ['House'], location: 'Anywhere' };
    expect(filtersActive(narrowed, 'Atlanta')).toBe(true);
    expect(filtersActive(resetFilters('Atlanta'), 'Atlanta')).toBe(false);
    expect(showButtonLabel('communities', 0)).toBe('No communities match');
  });

  it('shows the live count in the sheet and Reset brings it back', async () => {
    await renderWithProviders(<ExploreScreen />);
    await act(async () => fireEvent.press(await screen.findByTestId('explore-filter-button')));
    const sheet = await screen.findByTestId('explore-filters');
    expect(await within(sheet).findByRole('button', { name: 'Show 12 communities' })).toBeTruthy();
    expect(within(sheet).getAllByText('Any').length).toBe(3);

    await act(async () => fireEvent.press(within(sheet).getByRole('button', { name: 'Techno' })));
    expect(await within(sheet).findByRole('button', { name: 'Show 1 community' })).toBeTruthy();
    expect(within(sheet).getByText('1 picked')).toBeTruthy();

    await act(async () => fireEvent.press(within(sheet).getByRole('button', { name: 'Reset' })));
    expect(await within(sheet).findByRole('button', { name: 'Show 12 communities' })).toBeTruthy();
  });
});

describe('explore filters sheet, applied', () => {
  it('applies the picks to a results list and reopens with them', async () => {
    await renderWithProviders(<ExploreScreen />);
    await act(async () => await fireEvent.press(await screen.findByTestId('explore-filter-button')));
    let sheet = await screen.findByTestId('explore-filters');
    await act(async () => await fireEvent.press(within(sheet).getByRole('button', { name: 'Techno' })));
    await act(async () => await fireEvent.press(await within(sheet).findByRole('button', { name: 'Show 1 community' })));
    expect(await screen.findByTestId('community-row-c_bass_church')).toBeTruthy();
    await act(async () => await fireEvent.press(screen.getByTestId('explore-filter-button')));
    sheet = await screen.findByTestId('explore-filters');
    expect(within(sheet).getByText('1 picked')).toBeTruthy();
  });
});

describe('explore search', () => {
  it('waits for a pause, then says there are no matches, and Reset clears it', async () => {
    await renderWithProviders(<ExploreScreen />);
    expect(await screen.findByText('Top communities this week')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('explore-search'), 'zzz');
    // Not yet: results update after a short pause.
    expect(screen.queryByText('No matches for ‘zzz’')).toBeNull();
    expect(await screen.findByText('No matches for ‘zzz’', {}, { timeout: SEARCH_DEBOUNCE_MS + 1500 })).toBeTruthy();
    expect(screen.queryByText('Top communities this week')).toBeNull();

    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Reset' })));
    expect(await screen.findByText('Top communities this week', {}, { timeout: 2000 })).toBeTruthy();
  });

  it('replaces the sections with a results list while a query is active', async () => {
    await renderWithProviders(<ExploreScreen />);
    await screen.findByText('Top communities this week');
    await fireEvent.changeText(screen.getByTestId('explore-search'), 'supper');
    expect(await screen.findByText('1 community', {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.getByTestId('community-row-c_supper_club')).toBeTruthy();
    expect(screen.queryByText('Top communities this week')).toBeNull();
  });
});
