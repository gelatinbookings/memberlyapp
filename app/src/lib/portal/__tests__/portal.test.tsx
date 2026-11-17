import * as WebBrowser from 'expo-web-browser';
import { screen } from '@testing-library/react-native';

import { createFakeRepository } from '@/data/fakeRepository';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { resolvePortal } from '../resolve';
import { TEST_PORTAL_ACTIONS, TEST_PORTAL_EXPIRED, TEST_PORTAL_NOTE, TestPortalScreen } from '../TestPortalScreen';
import { launchExpired, type Portal } from '../types';
import { createWebBrowserPortal } from '../webBrowserPortal';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  dismissBrowser: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
}));

const browser = WebBrowser as unknown as { openBrowserAsync: jest.Mock; dismissBrowser: jest.Mock };
const LAUNCH = { launchUrl: 'https://portal.example.test/launch/abc', expiresAt: new Date(Date.now() + 60_000).toISOString() };
const stub = (): Portal => ({ openPortal: async () => 'dismissed', completeReturn: () => false });

beforeEach(() => jest.clearAllMocks());

describe('which portal the app opens', () => {
  it('uses an implementation when one is passed', () => {
    const implementation = stub();
    expect(resolvePortal({ implementation, testPortal: stub(), real: stub })).toBe(implementation);
  });

  it('uses the test portal only when the repository is the fake one', () => {
    const testPortal = stub();
    const real = jest.fn(stub);
    expect(resolvePortal({ testPortal, real })).toBe(testPortal);
    expect(real).not.toHaveBeenCalled();
  });

  it('otherwise opens Gelatin in the in-app browser', () => {
    const real = stub();
    expect(resolvePortal({ testPortal: null, real: () => real })).toBe(real);
  });
});

describe('a launch', () => {
  it('is expired at or after its expiry, and when the expiry cannot be read', () => {
    const now = Date.parse('2026-11-20T23:00:00Z');
    expect(launchExpired({ expiresAt: '2026-11-20T23:00:30Z' }, now)).toBe(false);
    expect(launchExpired({ expiresAt: '2026-11-20T23:00:00Z' }, now)).toBe(true);
    expect(launchExpired({ expiresAt: '2026-11-20T22:59:59Z' }, now)).toBe(true);
    expect(launchExpired({ expiresAt: 'soon' }, now)).toBe(true);
  });
});

describe('the real portal: Gelatin in the in-app browser', () => {
  it('opens the launch URL as given and counts Done as dismissed', async () => {
    browser.openBrowserAsync.mockResolvedValue({ type: 'cancel' });
    const portal = createWebBrowserPortal();
    await expect(portal.openPortal(LAUNCH)).resolves.toBe('dismissed');
    expect(browser.openBrowserAsync).toHaveBeenCalledTimes(1);
    expect(browser.openBrowserAsync.mock.calls[0][0]).toBe(LAUNCH.launchUrl);
    expect(browser.dismissBrowser).not.toHaveBeenCalled();
  });

  it('closes the browser when the return link arrives, and counts that as returned', async () => {
    let close: (result: { type: string }) => void = () => undefined;
    browser.openBrowserAsync.mockImplementation(() => new Promise((resolve) => (close = resolve)));
    browser.dismissBrowser.mockImplementation(() => {
      close({ type: 'dismiss' });
      return Promise.resolve({ type: 'dismiss' });
    });
    const portal = createWebBrowserPortal();
    const visit = portal.openPortal(LAUNCH);
    expect(portal.completeReturn()).toBe(true);
    expect(browser.dismissBrowser).toHaveBeenCalledTimes(1);
    await expect(visit).resolves.toBe('returned');
  });

  it('still counts as returned if the browser reports a plain close after the return link', async () => {
    let close: (result: { type: string }) => void = () => undefined;
    browser.openBrowserAsync.mockImplementation(() => new Promise((resolve) => (close = resolve)));
    browser.dismissBrowser.mockRejectedValue(new Error('not available'));
    const portal = createWebBrowserPortal();
    const visit = portal.openPortal(LAUNCH);
    expect(portal.completeReturn()).toBe(true);
    close({ type: 'cancel' });
    await expect(visit).resolves.toBe('returned');
  });

  it('has nothing to close when no portal is open, and starts each visit afresh', async () => {
    browser.openBrowserAsync.mockResolvedValue({ type: 'cancel' });
    const portal = createWebBrowserPortal();
    expect(portal.completeReturn()).toBe(false);
    expect(browser.dismissBrowser).not.toHaveBeenCalled();
    await portal.openPortal(LAUNCH);
    // A return link that arrives after the visit ended does not colour the next one.
    expect(portal.completeReturn()).toBe(false);
    await expect(portal.openPortal(LAUNCH)).resolves.toBe('dismissed');
  });
});

describe('the test portal screen', () => {
  it('offers one button for each thing a DJ, or time, can do', () => {
    expect(TEST_PORTAL_ACTIONS.map((a) => a.label)).toEqual(['Accept', 'Pass', 'Counter at a new price', 'Let it expire', 'Cancel booking']);
  });

  it('has no fee field, note field or anything else to type into', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const booking = repository.fake.portalBooking('br_blkmtn');
    await renderWithProviders(<TestPortalScreen booking={booking} fake={repository.fake} onDone={() => undefined} />, { repository });
    expect(screen.getByText(TEST_PORTAL_NOTE)).toBeTruthy();
    expect(await screen.findByText('Your booking with BLKMTN')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/TextInput/);
  });

  it('shows only the way back when the launch could not be used', async () => {
    const repository = createFakeRepository({ delayMs: 0 });
    const onDone = jest.fn();
    await renderWithProviders(<TestPortalScreen booking={null} fake={repository.fake} onDone={onDone} />, { repository });
    expect(await screen.findByText(TEST_PORTAL_EXPIRED)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Back to Memberly' })).toBeTruthy();
  });
});
