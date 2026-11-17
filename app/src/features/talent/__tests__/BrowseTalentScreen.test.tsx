import { onlineManager } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { CatalogUnavailableError } from '@/data/errors';
import { createFakeRepository } from '@/data/fakeRepository';
import type { MemberlyRepository } from '@/data/repository';
import { LineupView } from '@/features/lineup/LineupView';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { BrowseTalentScreen } from '../BrowseTalentScreen';
import { TALENT_ATTRIBUTION } from '../BrowseStates';
import { PRIVATE_RATE_HELPER } from '../DjProfileSheet';
import { LOCKED_HELPER } from '../TalentFiltersSheet';
import { comingSoonLine } from '../talentTypes';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock; back: jest.Mock } };

const press = (el: Parameters<typeof fireEvent.press>[0]) => act(async () => fireEvent.press(el));

/** Long Table: Sun, Nov 22 in Atlanta, nobody added yet. Nine of the ten DJs are open that night. */
const EVENT = 'e_long_table';

async function openFilters() {
  await press(screen.getByTestId('chip-budget'));
  return screen.findByTestId('talent-filters');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Browse talent', () => {
  it('names the night and city from the event and lists DJ cards', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    expect(await screen.findByText('9 DJs open on Sun, Nov 22 in Atlanta')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Browse talent' })).toBeTruthy();

    const koyo = within(screen.getByTestId('dj-dj_koyo'));
    expect(koyo.getByText('KOYO')).toBeTruthy();
    expect(koyo.getByText('Top performer')).toBeTruthy();
    expect(koyo.getByText('House · Afrobeats')).toBeTruthy();
    expect(koyo.getByText('Draws 180–260 · avg 215')).toBeTruthy();
    expect(koyo.getByText(/\$450/)).toBeTruthy();
    expect(koyo.getByText(/per set/)).toBeTruthy();
    expect(within(screen.getByTestId('add-dj_koyo')).getByText('Add')).toBeTruthy();

    expect(screen.getByText('Any budget')).toBeTruthy();
    expect(screen.getByText('Any genre')).toBeTruthy();
    expect(screen.getByText(TALENT_ATTRIBUTION)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
  });

  it('lists every kind of talent with DJs chosen; the others say they are coming soon', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    const types = within(await screen.findByTestId('talent-types'));
    expect(types.getByRole('button', { name: 'DJs, selected' })).toBeTruthy();
    expect(screen.queryByTestId('talent-type-soon')).toBeNull();
    await press(types.getByRole('button', { name: 'Live bands, coming soon' }));
    expect(screen.getByTestId('talent-type-soon')).toHaveTextContent(comingSoonLine('Live bands'));
    expect(types.getByRole('button', { name: 'DJs, selected' })).toBeTruthy();
  });

  it('shows Private rate and Draw not yet established exactly as the catalog has them', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    const nightform = within(await screen.findByTestId('dj-dj_nightform'));
    expect(nightform.getByText('Private rate')).toBeTruthy();
    expect(nightform.queryByText(/per set/)).toBeNull();
    expect(nightform.getByText('Draws 240–330 · avg 281')).toBeTruthy();
    const sable = within(screen.getByTestId('dj-dj_sable'));
    expect(sable.getByText('Draw not yet established')).toBeTruthy();
    expect(sable.getByText(/\$275/)).toBeTruthy();
  });

  it('reads each card as one element with a full sentence', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    const card = await screen.findByLabelText('KOYO, Top performer, House and Afrobeats, $450 per set, draws 180 to 260, Add');
    expect(card.props.accessible).toBe(true);
    // A double tap adds; the label then ends on the new state.
    await act(async () => card.props.onAccessibilityTap());
    expect(await screen.findByLabelText(/^KOYO, .* Added$/)).toBeTruthy();
    expect(screen.getByLabelText('Sable Hart, Verified, Soul and Disco, $275 per set, draw not yet established, Add')).toBeTruthy();
  });

  it('adds and removes across pages, and the Lineup shows what was added', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const view = await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />, { repository });
    await press(await screen.findByTestId('add-dj_koyo'));
    expect(await screen.findByRole('button', { name: 'Done · 1 added' })).toBeTruthy();
    expect(within(screen.getByTestId('add-dj_koyo')).getByText('Added')).toBeTruthy();

    // The first page holds four; the rest arrive by cursor at the end of the list.
    expect(screen.queryByTestId('dj-dj_juno_vale')).toBeNull();
    await act(async () => fireEvent(screen.getByTestId('talent-list'), 'endReached'));
    await press(await screen.findByTestId('add-dj_juno_vale'));
    expect(await screen.findByRole('button', { name: 'Done · 2 added' })).toBeTruthy();
    await act(async () => fireEvent(screen.getByTestId('talent-list'), 'endReached'));
    expect(await screen.findByTestId('dj-dj_caro_lumen')).toBeTruthy();
    // KOYO is still marked from page one.
    expect(within(screen.getByTestId('add-dj_koyo')).getByText('Added')).toBeTruthy();

    await press(screen.getByTestId('add-dj_koyo'));
    expect(await screen.findByRole('button', { name: 'Done · 1 added' })).toBeTruthy();
    await press(screen.getByTestId('add-dj_priya_nox'));
    expect(await screen.findByRole('button', { name: 'Done · 2 added' })).toBeTruthy();

    await press(screen.getByTestId('browse-done'));
    expect(router.back).toHaveBeenCalledTimes(1);
    await waitFor(async () => expect((await repository.getDraftOffers(EVENT)).map((o) => o.dj.name)).toEqual(['Juno Vale', 'Priya Nox']));

    // Back on Lineup: the DJs-added state, a published rate pre-filled and a private rate left empty.
    await view.unmount();
    await renderWithProviders(<LineupView eventId={EVENT} />, { repository });
    expect(await screen.findByText('2 DJs added · offers not sent')).toBeTruthy();
    expect(screen.getByTestId('fee-dj_juno_vale').props.value).toBe('700');
    expect(screen.getByTestId('fee-dj_priya_nox').props.value).toBe('');
    expect(screen.getByRole('button', { name: 'Send 2 offers' })).toBeDisabled();
  });

  it('marks DJs already on the lineup when Browse opens', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId="e_late_service" />);
    expect(await screen.findByRole('button', { name: 'Done · 2 added' })).toBeTruthy();
    expect(within(screen.getByTestId('add-dj_koyo')).getByText('Added')).toBeTruthy();
    expect(within(screen.getByTestId('add-dj_nightform')).getByText('Added')).toBeTruthy();
    expect(within(screen.getByTestId('add-dj_blkmtn')).getByText('Add')).toBeTruthy();
  });
});

describe('Talent filters sheet', () => {
  it('shows the city and night locked, and counts on the apply button', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await screen.findByTestId('dj-dj_koyo');
    const sheet = within(await openFilters());
    expect(sheet.getByLabelText('Atlanta, from your event')).toBeTruthy();
    expect(sheet.getByLabelText('Sun, Nov 22, from your event')).toBeTruthy();
    expect(sheet.getByText(LOCKED_HELPER)).toBeTruthy();
    expect(await sheet.findByRole('button', { name: 'Show 9 DJs' })).toBeTruthy();
    for (const label of ['Under $300', '$300 – $600', '$600 – $1,000', '$1,000 and up']) {
      expect(sheet.getByRole('button', { name: label })).toBeTruthy();
    }
    expect(await sheet.findByRole('button', { name: 'Techno' })).toBeTruthy();
  });

  it('applies one budget band and one genre, and the chips show them', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await screen.findByTestId('dj-dj_koyo');
    const sheet = within(await openFilters());
    await press(sheet.getByTestId('budget-300_to_600'));
    expect(await sheet.findByRole('button', { name: 'Show 2 DJs' })).toBeTruthy();
    // Genres follow the band: nobody at $300 – $600 plays techno.
    await waitFor(() => expect(sheet.queryByRole('button', { name: 'Techno' })).toBeNull());
    await press(sheet.getByTestId('genre-House'));
    expect(await sheet.findByRole('button', { name: 'Show 1 DJ' })).toBeTruthy();
    // Single-select: a second band replaces the first.
    await press(sheet.getByTestId('budget-600_to_1000'));
    expect(sheet.getByTestId('budget-300_to_600').props.accessibilityState.selected).toBe(false);
    await press(sheet.getByTestId('budget-300_to_600'));
    await press(await sheet.findByRole('button', { name: 'Show 1 DJ' }));

    await waitFor(() => expect(screen.queryByTestId('dj-dj_nightform')).toBeNull());
    expect(await screen.findByTestId('dj-dj_koyo')).toBeTruthy();
    expect(await screen.findByText('1 of 9 DJs match')).toBeTruthy();
    expect(screen.getByTestId('chip-budget').props.accessibilityLabel).toBe('$300 – $600');
    expect(screen.getByTestId('chip-budget').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('chip-genre').props.accessibilityLabel).toBe('House');
  });

  it('changes nothing when it is dismissed, and Reset then apply clears both', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await screen.findByTestId('dj-dj_koyo');
    let sheet = within(await openFilters());
    await press(sheet.getByTestId('budget-under_300'));
    await press(await sheet.findByRole('button', { name: 'Show 3 DJs' }));
    expect(await screen.findByText('3 of 9 DJs match')).toBeTruthy();

    // Change the draft, then dismiss: the applied filter stays.
    sheet = within(await openFilters());
    expect(sheet.getByTestId('budget-under_300').props.accessibilityState.selected).toBe(true);
    await press(sheet.getByRole('button', { name: 'Reset' }));
    expect(await sheet.findByRole('button', { name: 'Show 9 DJs' })).toBeTruthy();
    await press(sheet.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('chip-budget').props.accessibilityLabel).toBe('Under $300');
    expect(screen.getByText('3 of 9 DJs match')).toBeTruthy();
    expect(screen.queryByTestId('dj-dj_koyo')).toBeNull();

    // Reopened, the sheet starts from what is applied again; Reset and apply clears.
    sheet = within(await openFilters());
    expect(sheet.getByTestId('budget-under_300').props.accessibilityState.selected).toBe(true);
    await press(sheet.getByRole('button', { name: 'Reset' }));
    await press(await sheet.findByRole('button', { name: 'Show 9 DJs' }));
    expect(await screen.findByText('9 DJs open on Sun, Nov 22 in Atlanta')).toBeTruthy();
    expect(screen.getByTestId('chip-budget').props.accessibilityLabel).toBe('Any budget');
    expect(await screen.findByTestId('dj-dj_koyo')).toBeTruthy();
  });

  it('explains filters that are too tight and loosens them in one tap', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await screen.findByTestId('dj-dj_koyo');
    const sheet = within(await openFilters());
    await press(await sheet.findByTestId('genre-Techno'));
    expect(await sheet.findByRole('button', { name: 'Show 2 DJs' })).toBeTruthy();
    await press(sheet.getByTestId('budget-under_300'));
    // Techno stays on show although nobody under $300 plays it.
    expect(await sheet.findByRole('button', { name: 'Show 0 DJs' })).toBeTruthy();
    expect(sheet.getByTestId('genre-Techno').props.accessibilityState.selected).toBe(true);
    await press(sheet.getByRole('button', { name: 'Show 0 DJs' }));

    expect(await screen.findByText('No one matches all of that')).toBeTruthy();
    expect(
      await screen.findByText('9 DJs are open on Sun, Nov 22. None play techno under $300. Loosen one filter to see them.'),
    ).toBeTruthy();
    expect(await screen.findByText('0 of 9 DJs match')).toBeTruthy();
    expect(screen.queryByTestId('talent-list')).toBeNull();
    expect(await screen.findByRole('button', { name: 'Any budget · 2' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Any genre · 3' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Show all 9' })).toBeTruthy();
    expect(screen.getByText(TALENT_ATTRIBUTION)).toBeTruthy();

    await press(screen.getByRole('button', { name: 'Any budget · 2' }));
    expect(await screen.findByTestId('dj-dj_nightform')).toBeTruthy();
    expect(screen.getByTestId('dj-dj_lowtide')).toBeTruthy();
    expect(screen.getByTestId('chip-budget').props.accessibilityLabel).toBe('Any budget');
    expect(screen.getByTestId('chip-genre').props.accessibilityLabel).toBe('Techno');
  });

  it('clears everything from the too-tight state with Show all', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await screen.findByTestId('dj-dj_koyo');
    const sheet = within(await openFilters());
    await press(await sheet.findByTestId('genre-Techno'));
    await press(sheet.getByTestId('budget-under_300'));
    await press(await sheet.findByRole('button', { name: 'Show 0 DJs' }));
    await press(await screen.findByRole('button', { name: 'Show all 9' }));
    expect(await screen.findByText('9 DJs open on Sun, Nov 22 in Atlanta')).toBeTruthy();
    expect(screen.getByTestId('chip-genre').props.accessibilityLabel).toBe('Any genre');
  });
});

describe('DJ profile sheet', () => {
  it('opens from the card, not from its button, with rate, draw and bio', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await press(await screen.findByTestId('add-dj_koyo'));
    expect(screen.queryByTestId('dj-profile')).toBeNull();
    await press(screen.getByTestId('add-dj_koyo'));

    await press(screen.getByTestId('dj-open-dj_koyo'));
    const profile = within(await screen.findByTestId('dj-profile'));
    expect(profile.getByRole('header', { name: 'KOYO' })).toBeTruthy();
    expect(profile.getByText('Top performer')).toBeTruthy();
    expect(profile.getByText('House · Afrobeats')).toBeTruthy();
    expect(profile.getByText('Published rate')).toBeTruthy();
    expect(profile.getByText('$450')).toBeTruthy();
    expect(profile.getByText('215')).toBeTruthy();
    expect(profile.getByText('180–260, venue-confirmed')).toBeTruthy();
    expect(profile.getByText(/Atlanta resident with 6 years on the circuit/)).toBeTruthy();
    expect(profile.getByText('Open Sun, Nov 22')).toBeTruthy();
    expect(profile.queryByText(PRIVATE_RATE_HELPER)).toBeNull();
    expect(profile.getByText(TALENT_ATTRIBUTION)).toBeTruthy();
  });

  it('adds and closes; once added the button reads Added and removes', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />, { repository });
    await press(await screen.findByTestId('dj-open-dj_koyo'));
    await press(await screen.findByRole('button', { name: 'Add to lineup' }));
    await waitFor(() => expect(screen.queryByTestId('dj-profile')).toBeNull());
    expect(await screen.findByRole('button', { name: 'Done · 1 added' })).toBeTruthy();
    expect(within(screen.getByTestId('add-dj_koyo')).getByText('Added')).toBeTruthy();

    await press(screen.getByTestId('dj-open-dj_koyo'));
    const profile = within(await screen.findByTestId('dj-profile'));
    expect(profile.queryByRole('button', { name: 'Add to lineup' })).toBeNull();
    await press(profile.getByRole('button', { name: 'Added' }));
    // Removing keeps the sheet open, back on Add to lineup.
    expect(await profile.findByRole('button', { name: 'Add to lineup' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Done' })).toBeTruthy();
    await waitFor(async () => expect(await repository.getDraftOffers(EVENT)).toHaveLength(0));
  });

  it('explains a private rate and an unknown draw', async () => {
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
    await press(await screen.findByTestId('dj-open-dj_nightform'));
    let profile = within(await screen.findByTestId('dj-profile'));
    expect(profile.getByText('Private rate')).toBeTruthy();
    expect(profile.getByText(PRIVATE_RATE_HELPER)).toBeTruthy();
    expect(profile.queryByText('Published rate')).toBeNull();
    await press(profile.getByRole('button', { name: 'Close profile' }));

    await press(screen.getByTestId('dj-open-dj_sable'));
    profile = within(await screen.findByTestId('dj-profile'));
    expect(profile.getByText('Draw not yet established')).toBeTruthy();
    expect(profile.getByText('$275')).toBeTruthy();
  });
});

describe('Talent edge states', () => {
  it('loads with skeleton cards, never a spinner over a blank screen', async () => {
    const base = createFakeRepository({ delayMs: 0 });
    const repository: MemberlyRepository = { ...base, getTalent: () => new Promise(() => undefined) };
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />, { repository });
    expect(await screen.findByText('Finding DJs open on Sun, Nov 22 in Atlanta…')).toBeTruthy();
    const skeletons = screen.getByTestId('talent-loading');
    expect(skeletons.props.accessibilityState).toEqual({ busy: true });
    expect(screen.queryByTestId('talent-list')).toBeNull();
    expect(screen.queryByTestId('talent-more')).toBeNull();
    expect(screen.getByText(TALENT_ATTRIBUTION)).toBeTruthy();
    // Closing never waits on the catalog.
    await press(screen.getByRole('button', { name: 'Close' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('says there are no DJs in a city Gelatin does not book, and asks to be notified once', async () => {
    const base = createFakeRepository({ delayMs: 0 });
    const joinCityWaitlist = jest.fn(base.joinCityWaitlist);
    await renderWithProviders(<BrowseTalentScreen eventId="e_river_street" />, { repository: { ...base, joinCityWaitlist } });
    expect(await screen.findByText('No DJs in Savannah yet')).toBeTruthy();
    expect(screen.getByText('Savannah · Sat, Dec 5')).toBeTruthy();
    expect(screen.getByText(/Gelatin doesn’t book talent in Savannah right now/)).toBeTruthy();
    expect(screen.queryByTestId('chip-budget')).toBeNull();

    const notify = screen.getByRole('button', { name: 'Notify me' });
    await act(async () => {
      fireEvent.press(notify);
      fireEvent.press(notify);
    });
    expect(await screen.findByText('We’ll let you know')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Notify me' })).toBeNull();
    expect(joinCityWaitlist).toHaveBeenCalledTimes(1);
    expect(joinCityWaitlist).toHaveBeenCalledWith('Savannah');

    // The way on, with no talent: back to the event.
    await press(screen.getByRole('button', { name: 'Create the event without talent' }));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('shows the catalog as unavailable, and Try again recovers', async () => {
    const base = createFakeRepository({ delayMs: 0 });
    let down = true;
    let hold: Promise<void> = Promise.resolve();
    const getTalent = jest.fn<ReturnType<MemberlyRepository['getTalent']>, Parameters<MemberlyRepository['getTalent']>>(
      async (...args) => {
        await hold;
        if (down) throw new CatalogUnavailableError();
        return base.getTalent(...args);
      },
    );
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />, { repository: { ...base, getTalent } });
    expect(await screen.findByText('Talent is unavailable right now')).toBeTruthy();
    expect(screen.getByText('We couldn’t reach Gelatin. Your event is safe and nothing was sent. Try again in a moment.')).toBeTruthy();
    expect(screen.getByText('DJs you already booked keep their status. Any card hold stays exactly as it was.')).toBeTruthy();
    expect(screen.getByText('Atlanta · Sun, Nov 22')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue without talent' })).toBeTruthy();
    // A 503 is shown at once: no silent second attempt.
    expect(getTalent).toHaveBeenCalledTimes(1);

    // Try again re-reads behind the skeletons; still down, so the state comes back.
    let release!: () => void;
    hold = new Promise((resolve) => (release = resolve));
    await press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('talent-loading')).toBeTruthy();
    expect(getTalent).toHaveBeenCalledTimes(2);
    await act(async () => release());
    expect(await screen.findByText('Talent is unavailable right now')).toBeTruthy();

    down = false;
    await press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('dj-dj_koyo')).toBeTruthy();
    expect(screen.queryByText('Talent is unavailable right now')).toBeNull();
  });

  it('says you’re offline and loads by itself when the connection returns', async () => {
    onlineManager.setOnline(false);
    try {
      await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />);
      expect(await screen.findByText('You’re offline')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
      expect(screen.queryByTestId('talent-list')).toBeNull();
      await act(async () => onlineManager.setOnline(true));
      expect(await screen.findByTestId('dj-dj_koyo')).toBeTruthy();
      expect(screen.queryByText('You’re offline')).toBeNull();
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it('never blocks saving or publishing while the catalog is down', async () => {
    const repository = createFakeRepository({ delayMs: 0, talentMode: () => 'unavailable' });
    await renderWithProviders(<BrowseTalentScreen eventId={EVENT} />, { repository });
    expect(await screen.findByText('Talent is unavailable right now')).toBeTruthy();
    const event = (await repository.getOrganizerEvent(EVENT))!;
    const { id, communityId, status: _status, timeZone: _tz, startsAt: _s, endsAt: _e, communityName: _c, ...fields } = event;
    await expect(repository.saveEvent({ id, communityId, fields, publish: false })).resolves.toMatchObject({ status: 'draft' });
    await expect(repository.saveEvent({ id, communityId, fields, publish: true })).resolves.toMatchObject({ status: 'published' });
  });
});
