import { Profiler, useEffect, useState } from 'react';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { act, screen } from '@testing-library/react-native';

import { createFakeRepository, type FakeRepository } from '@/data/fakeRepository';
import { POLL_INTERVAL_MS } from '@/features/booking/status';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { LineupView, POLL_LINE } from '../LineupView';
import { unbrokenParts } from '@/features/booking/lineupSummary';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

/** Warehouse Friday: NIGHTFORM unpaid, BLKMTN requested (so the Lineup polls), KOYO confirmed. */
const EVENT = 'e_warehouse_friday';
const BLKMTN = 'br_blkmtn';

/** Let time pass, with everything that follows from it. */
const pass = (ms: number) => act(async () => void (await jest.advanceTimersByTimeAsync(ms)));

const reads = (repo: FakeRepository) => {
  const { full, notModified } = repo.fake.bookingFetches(EVENT);
  return { full, notModified, all: full + notModified };
};

/** Stands in for the route: `screenFocus(false)` is another screen coming in front of the Lineup. */
let screenFocus: (focused: boolean) => Promise<void>;
function Route() {
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    screenFocus = (next) => act(async () => setFocused(next));
  }, []);
  return <LineupView eventId={EVENT} focused={focused} />;
}

async function lineup(repository: FakeRepository) {
  const view = await renderWithProviders(<Route />, { repository });
  await pass(50);
  return view;
}

beforeEach(() => {
  jest.useFakeTimers();
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
});
afterEach(() => {
  jest.useRealTimers();
  focusManager.setFocused(undefined);
  onlineManager.setOnline(true);
});

describe('Lineup polling (GEL-1022)', () => {
  it('polls every 5 seconds while a DJ is deciding, sending the last ETag', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const getEventBookings = jest.spyOn(repository, 'getEventBookings');
    await lineup(repository);
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
    expect(reads(repository)).toMatchObject({ full: 1, notModified: 0 });
    // The first read has no ETag to send.
    expect(getEventBookings.mock.calls[0][1]).toEqual({ ifNoneMatch: null });
    const { etag } = (await getEventBookings.mock.results[0].value) as { etag: string };

    await pass(POLL_INTERVAL_MS - 100);
    expect(reads(repository).all).toBe(1);
    await pass(200);
    expect(reads(repository)).toMatchObject({ full: 1, notModified: 1 });
    expect(getEventBookings.mock.calls[1][1]).toEqual({ ifNoneMatch: etag });

    await pass(POLL_INTERVAL_MS);
    expect(reads(repository)).toMatchObject({ full: 1, notModified: 2 });
  });

  it('stops once no booking is requested or negotiating', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    repository.fake.setStatus(BLKMTN, 'confirmed');
    await pass(POLL_INTERVAL_MS + 100);
    // The poll that brought the news.
    expect(reads(repository)).toMatchObject({ full: 2, notModified: 0 });
    expect(screen.getByText(unbrokenParts('2 confirmed · 1 to pay'))).toBeTruthy();
    expect(screen.queryByText(POLL_LINE)).toBeNull();

    await pass(POLL_INTERVAL_MS * 4);
    expect(reads(repository).all).toBe(2);
  });

  it('starts again when a booking goes back to negotiating', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.setStatus(BLKMTN, 'confirmed');
    await lineup(repository);
    await pass(POLL_INTERVAL_MS * 3);
    expect(reads(repository).all).toBe(1);
    expect(screen.queryByText(POLL_LINE)).toBeNull();

    // News arrives another way (here: coming back to the screen), and polling picks up from it.
    repository.fake.setStatus(BLKMTN, 'negotiating');
    await screenFocus(false);
    await screenFocus(true);
    await pass(50);
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
    const before = reads(repository).all;
    await pass(POLL_INTERVAL_MS + 100);
    expect(reads(repository).all).toBe(before + 1);
  });

  it('never polls an event where nobody is deciding', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    repository.fake.playDj(BLKMTN, 'pass');
    await lineup(repository);
    await pass(POLL_INTERVAL_MS * 5);
    expect(reads(repository).all).toBe(1);
  });

  it('does not poll once the Lineup is unmounted', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const view = await lineup(repository);
    await pass(POLL_INTERVAL_MS + 100);
    expect(reads(repository).all).toBe(2);
    await view.unmount();
    await pass(POLL_INTERVAL_MS * 5);
    expect(reads(repository).all).toBe(2);
  });

  it('does not poll while another screen is in front, and reads once at once on the way back', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    await screenFocus(false);
    await pass(POLL_INTERVAL_MS * 4);
    expect(reads(repository).all).toBe(1);
    expect(screen.queryByText(POLL_LINE)).toBeNull();

    await screenFocus(true);
    await pass(50);
    expect(reads(repository).all).toBe(2);
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
    // And the 5 second rhythm carries on from there.
    await pass(POLL_INTERVAL_MS + 100);
    expect(reads(repository).all).toBe(3);
  });

  it('pauses in the background and reads once at once on return', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    await act(async () => focusManager.setFocused(false));
    await pass(POLL_INTERVAL_MS * 6);
    expect(reads(repository).all).toBe(1);

    repository.fake.setStatus(BLKMTN, 'confirmed');
    await act(async () => focusManager.setFocused(true));
    await pass(50);
    expect(reads(repository)).toMatchObject({ full: 2, notModified: 0 });
    expect(screen.getByText(unbrokenParts('2 confirmed · 1 to pay'))).toBeTruthy();
  });

  it('pauses offline and reads once at once when the connection returns', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    await lineup(repository);
    await act(async () => onlineManager.setOnline(false));
    await pass(POLL_INTERVAL_MS * 6);
    expect(reads(repository).all).toBe(1);
    expect(screen.queryByText(POLL_LINE)).toBeNull();

    await act(async () => onlineManager.setOnline(true));
    await pass(50);
    expect(reads(repository).all).toBe(2);
    expect(screen.getByText(POLL_LINE)).toBeTruthy();
  });

  it('renders nothing again when the answer is "not modified"', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const commits = jest.fn();
    await renderWithProviders(
      <Profiler id="lineup" onRender={commits}>
        <LineupView eventId={EVENT} />
      </Profiler>,
      { repository },
    );
    await pass(50);
    commits.mockClear();

    await pass(POLL_INTERVAL_MS * 3 + 100);
    expect(reads(repository)).toMatchObject({ full: 1, notModified: 3 });
    expect(commits).not.toHaveBeenCalled();

    // A real change does render.
    repository.fake.setStatus(BLKMTN, 'confirmed');
    await pass(POLL_INTERVAL_MS);
    expect(commits).toHaveBeenCalled();
    expect(screen.getByText(unbrokenParts('2 confirmed · 1 to pay'))).toBeTruthy();
  });
});
