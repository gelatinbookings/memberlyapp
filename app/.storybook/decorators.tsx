import type { Decorator } from '@storybook/react-native-web-vite';

import { AppProviders, PhoneFrame, type MemberlyParameters, type StoryFrame } from './AppProviders';
import { setStoryRoute } from './mocks/expo-router';

/**
 * Wraps every story in the app's providers and the phone column. Shared by
 * preview.tsx (the browser) and the Jest smoke test, so a story renders the
 * same way in both. Keyed by story id: each story gets a fresh sample world.
 */
export const withMemberly: Decorator = (Story, { id, parameters }) => {
  const memberly = (parameters.memberly ?? {}) as MemberlyParameters;
  setStoryRoute(memberly.route);
  return (
    <AppProviders key={id} memberly={memberly}>
      <PhoneFrame frame={parameters.frame as StoryFrame | undefined}>
        <Story />
      </PhoneFrame>
    </AppProviders>
  );
};
