import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Alert } from 'react-native';

jest.setTimeout(20000);

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

// Signed out on launch: expo-secure-store's jest mock stores nothing.
describe('root layout gate (real routes)', () => {
  it('opens Welcome when signed out', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    expect(await r.findByTestId('welcome', {}, { timeout: 5000 })).toBeTruthy();
    expect(r.getPathname()).toBe('/welcome');
  });

  it('goes through sign-in, then resumes the deep link it came from', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/event/e_rooftop_hours' });
    await r.findByTestId('welcome', {}, { timeout: 5000 });
    expect(r.getPathname()).toBe('/welcome');
    await act(async () => {
      fireEvent.press(await r.findByRole('button', { name: 'I already have an account' }, { timeout: 5000 }));
    });
    const google = await r.findByRole('button', { name: 'Continue with Google' }, { timeout: 5000 });
    await act(async () => {
      fireEvent.press(google);
      jest.advanceTimersByTime(1000);
    });
    await r.findByText('Rooftop Hours', {}, { timeout: 5000 });
    expect(r.getPathname()).toBe('/event/e_rooftop_hours');
  });

  it('signs out from Me with a confirmation, and the next sign-in opens Home, not Me', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await r.findByTestId('welcome', {}, { timeout: 5000 });
    const signIn = async () => {
      await act(async () => {
        fireEvent.press(await r.findByRole('button', { name: 'I already have an account' }, { timeout: 5000 }));
      });
      const google = await r.findByRole('button', { name: 'Continue with Google' }, { timeout: 5000 });
      await act(async () => {
        fireEvent.press(google);
        jest.advanceTimersByTime(1000);
      });
    };
    await signIn();
    await r.findByTestId('home', {}, { timeout: 5000 });
    await act(async () => router.navigate('/me'));
    const signOut = await r.findByRole('button', { name: 'Sign out' }, { timeout: 5000 });
    await act(async () => {
      fireEvent.press(signOut);
      jest.advanceTimersByTime(1000);
    });
    expect(Alert.alert).toHaveBeenCalledWith('Sign out of Memberly?', expect.any(String), expect.any(Array));
    await r.findByTestId('welcome', {}, { timeout: 5000 });
    await signIn();
    await r.findByTestId('home', {}, { timeout: 5000 });
    expect(r.getPathname()).toBe('/');
  });
});
