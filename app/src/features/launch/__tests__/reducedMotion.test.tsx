import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as ExpoVideo from 'expo-video';

import WelcomeScreen from '@/app/(auth)/welcome';
import { DrawnCheck } from '@/components/motion/DrawnCheck';
import { Rise } from '@/components/motion/Rise';
import { Button, Text, TextField } from '@/components/ui';
import { WRONG_CODE, VerifyCodeView } from '@/features/auth/VerifyCodeView';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { ThemeProvider } from '@/theme/theme';

import { AnimatedSplash, LaunchProvider, SPLASH_TIMING } from '../AnimatedSplash';

// Reduce Motion is on for this whole file.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: () => true };
});
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/welcome',
}));

const players = (ExpoVideo as unknown as { __players: { source: unknown; play: jest.Mock }[] }).__players;

describe('motion with Reduce Motion on', () => {
  afterEach(() => jest.useRealTimers());

  it('launch splash: hands off from the native splash and simply fades out once ready', async () => {
    jest.useFakeTimers();
    const onShown = jest.fn();
    const onDone = jest.fn();
    await render(
      <ThemeProvider>
        <AnimatedSplash ready backdrop onShown={onShown} onDone={onDone} />
      </ThemeProvider>,
    );
    await fireEvent(screen.getByTestId('animated-splash', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { width: 402, height: 874 } } });
    expect(onShown).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('welcome-poster', { includeHiddenElements: true })).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(SPLASH_TIMING.reducedExit + 10);
    });
    expect(onDone).toHaveBeenCalled();
  });

  it('Welcome shows the poster still and never starts a video', async () => {
    players.length = 0;
    await renderWithProviders(
      <LaunchProvider value>
        <WelcomeScreen />
      </LaunchProvider>,
      { signedIn: false },
    );
    expect(screen.getByTestId('welcome-poster')).toBeTruthy();
    expect(screen.queryByTestId('welcome-video')).toBeNull();
    expect(players.every((p) => p.source === null)).toBe(true);
    expect(players.every((p) => p.play.mock.calls.length === 0)).toBe(true);
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'I already have an account' })).toBeTruthy();
  });

  it('Verify: a wrong code shows the error without the shake', async () => {
    await renderWithProviders(<VerifyCodeView email="ada@example.com" intent="sign-in" resendAfter={24} />);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('code-input'), '5555');
    });
    expect(await screen.findByText(WRONG_CODE)).toBeTruthy();
  });

  it('the check, the rise, the field ring and the pressed button all render', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <DrawnCheck label="Code verified" />
        <Rise index={2}>
          <Text>Risen</Text>
        </Rise>
        <TextField label="Email" />
        <Button label="Send verification code" onPress={onPress} />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Code verified')).toBeTruthy();
    expect(screen.getByText('Risen')).toBeTruthy();
    await fireEvent(screen.getByLabelText('Email'), 'focus');
    await fireEvent.press(screen.getByRole('button', { name: 'Send verification code' }));
    expect(onPress).toHaveBeenCalled();
  });
});
