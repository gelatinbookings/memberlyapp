import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import type { TestAccountId } from '@/data/testAccounts';

jest.setTimeout(30000);

// The launch animation has its own test; here it steps aside at once.
jest.mock('@/features/launch/AnimatedSplash', () => {
  const React = jest.requireActual('react');
  const LaunchContext = React.createContext(true);
  return {
    useLaunchDone: () => React.useContext(LaunchContext),
    LaunchProvider: ({ children }: { children: React.ReactNode }) => (
      <LaunchContext.Provider value={true}>{children}</LaunchContext.Provider>
    ),
    AnimatedSplash: () => null,
  };
});

type App = Awaited<ReturnType<typeof renderRouter>>;

/** Welcome → I already have an account → Test accounts → one account. */
async function signInAs(r: App, id: TestAccountId) {
  await r.findByTestId('welcome', {}, { timeout: 5000 });
  await act(async () => {
    fireEvent.press(await r.findByRole('button', { name: 'I already have an account' }, { timeout: 5000 }));
  });
  const link = await r.findByRole('link', { name: 'Running on sample data. Test accounts' }, { timeout: 5000 });
  await act(async () => {
    fireEvent.press(link);
  });
  const row = await r.findByTestId(`test-account-${id}`, {}, { timeout: 5000 });
  await act(async () => {
    fireEvent.press(row);
    jest.advanceTimersByTime(1000);
  });
}

const tab = (r: App, name: string) => r.queryByRole('tab', { name });

// Signed out on launch: expo-secure-store's jest mock stores nothing.
describe('where each test account lands (real routes)', () => {
  it('new user: Preferences step 1, with onboarding still to do', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await signInAs(r, 'new-user');
    expect(await r.findByTestId('preferences', {}, { timeout: 5000 })).toBeTruthy();
    expect(r.getPathname()).toBe('/preferences');
    expect(r.getByLabelText('Step 1 of 4')).toBeTruthy();
    expect(r.queryByTestId('home')).toBeNull();
  });

  it('new organizer: Home, with the Manage tab', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await signInAs(r, 'new-organizer');
    expect(await r.findByTestId('home', {}, { timeout: 5000 })).toBeTruthy();
    expect(r.getPathname()).toBe('/');
    expect(await r.findByRole('tab', { name: 'Manage' }, { timeout: 5000 })).toBeTruthy();
    for (const name of ['Home', 'Explore', 'Events', 'Me']) expect(tab(r, name)).toBeTruthy();
  });

  it('existing organizer: Home, with the Manage tab', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await signInAs(r, 'existing-organizer');
    expect(await r.findByTestId('home', {}, { timeout: 5000 })).toBeTruthy();
    expect(await r.findByRole('tab', { name: 'Manage' }, { timeout: 5000 })).toBeTruthy();
    expect(await r.findByText(/Jordan/, {}, { timeout: 5000 })).toBeTruthy();
  });

  it('existing member: Home with four tabs and no Manage', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await signInAs(r, 'existing-member');
    expect(await r.findByTestId('home', {}, { timeout: 5000 })).toBeTruthy();
    expect(await r.findByText(/Dana/, {}, { timeout: 5000 })).toBeTruthy();
    for (const name of ['Home', 'Explore', 'Events', 'Me']) expect(tab(r, name)).toBeTruthy();
    expect(tab(r, 'Manage')).toBeNull();
  });

  it('switching: sign out as the organizer, sign in as the member, and the Manage tab and their name are gone', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await signInAs(r, 'existing-organizer');
    await r.findByTestId('home', {}, { timeout: 5000 });
    expect(await r.findByRole('tab', { name: 'Manage' }, { timeout: 5000 })).toBeTruthy();

    await act(async () => router.navigate('/me'));
    const signOut = await r.findByRole('button', { name: 'Sign out' }, { timeout: 5000 });
    await act(async () => {
      fireEvent.press(signOut);
      jest.advanceTimersByTime(1000);
    });

    await signInAs(r, 'existing-member');
    await r.findByTestId('home', {}, { timeout: 5000 });
    expect(await r.findByText(/Dana/, {}, { timeout: 5000 })).toBeTruthy();
    expect(r.queryByText(/Jordan/)).toBeNull();
    expect(tab(r, 'Manage')).toBeNull();
    expect(r.getPathname()).toBe('/');
  });

  it('Continue with Google still signs in the existing organizer', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await r.findByTestId('welcome', {}, { timeout: 5000 });
    await act(async () => {
      fireEvent.press(await r.findByRole('button', { name: 'I already have an account' }, { timeout: 5000 }));
    });
    const google = await r.findByRole('button', { name: 'Continue with Google' }, { timeout: 5000 });
    await act(async () => {
      fireEvent.press(google);
      jest.advanceTimersByTime(1000);
    });
    await r.findByTestId('home', {}, { timeout: 5000 });
    expect(await r.findByText(/Jordan/, {}, { timeout: 5000 })).toBeTruthy();
    expect(await r.findByRole('tab', { name: 'Manage' }, { timeout: 5000 })).toBeTruthy();
  });
});
