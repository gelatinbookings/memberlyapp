import { act, fireEvent, screen } from '@testing-library/react-native';

import { createFakeRepository, createMemoryStorage, SESSION_KEY } from '@/data/fakeRepository';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { formatCountdown } from '../countdown';
import { EXPIRED_CODE, VerifyCodeView, WRONG_CODE } from '../VerifyCodeView';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));

async function renderVerify(storage = createMemoryStorage(), { prime = true } = {}) {
  const repository = createFakeRepository({ delayMs: 0, storage });
  // Create account asked for the code first, as the sheet does.
  if (prime) await repository.sendCode({ email: 'ada@example.com', intent: 'sign-up', name: 'Ada Obi' });
  return renderWithProviders(<VerifyCodeView email="ada@example.com" intent="sign-up" resendAfter={24} />, {
    repository,
    storage,
  });
}

describe('verification code outcomes', () => {
  it('signs in and stores the session on 1234', async () => {
    const storage = createMemoryStorage();
    await renderVerify(storage);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('code-input'), '1234');
    });
    expect(await screen.findByLabelText('Code verified')).toBeTruthy();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 800));
    });
    const stored = JSON.parse((await storage.get(SESSION_KEY)) ?? 'null');
    expect(stored?.email).toBe('ada@example.com');
    expect(stored?.onboardingDone).toBe(false); // a new member goes on to preferences
  });

  it('shows the wrong-code message for any other code and stores nothing', async () => {
    const storage = createMemoryStorage();
    await renderVerify(storage);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('code-input'), '9999');
    });
    expect(await screen.findByText(WRONG_CODE)).toBeTruthy();
    expect(await storage.get(SESSION_KEY)).toBeNull();
  });

  it('says the code expired on 0000 and clears the boxes', async () => {
    await renderVerify();
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('code-input'), '0000');
    });
    expect(await screen.findByText(EXPIRED_CODE)).toBeTruthy();
    expect(screen.getByTestId('code-input').props.value).toBe('');
  });
});

describe('resend countdown', () => {
  afterEach(() => jest.useRealTimers());

  it('formats minutes and seconds', () => {
    expect(formatCountdown(24)).toBe('0:24');
    expect(formatCountdown(75)).toBe('1:15');
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('counts down from 0:24 and then becomes a Resend link', async () => {
    jest.useFakeTimers();
    await renderVerify(undefined, { prime: false });
    expect(screen.getByText('Resend in 0:24')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Resend in 0:23')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(23_000);
    });
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeTruthy();
    expect(screen.queryByText(/Resend in/)).toBeNull();
  });
});
