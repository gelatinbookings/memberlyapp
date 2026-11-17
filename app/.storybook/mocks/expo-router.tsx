/**
 * Storybook-only stand-in for `expo-router`. A story renders one component
 * with no route tree, so navigation is logged to the Actions panel instead.
 * Only what the storied components import is here; add to it when a new
 * story needs more.
 *
 * Route params come from the story: `parameters.memberly.route.params`
 * (see `.storybook/decorators.tsx`), so a screen that reads
 * `useLocalSearchParams()` gets the event id or the step it needs.
 * The Jest smoke test uses this same file in place of the real router.
 */
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { action } from 'storybook/actions';

type Params = Record<string, string | undefined>;

/** Kept on globalThis so every copy of this module (Vite alias, Jest mock) reads the same params. */
const store = globalThis as typeof globalThis & { __memberlyStoryRoute?: { params: Params; pathname: string } };

/** Set by the story decorator before the story renders. */
export function setStoryRoute(route: { params?: Params; pathname?: string } | undefined) {
  store.__memberlyStoryRoute = { params: route?.params ?? {}, pathname: route?.pathname ?? '/' };
}

const current = () => store.__memberlyStoryRoute ?? { params: {}, pathname: '/' };

const log = (name: string) => action(`router.${name}`);

export const router = {
  push: log('push'),
  navigate: log('navigate'),
  replace: log('replace'),
  back: log('back'),
  dismiss: log('dismiss'),
  dismissAll: log('dismissAll'),
  dismissTo: log('dismissTo'),
  setParams: log('setParams'),
  canGoBack: () => true,
  canDismiss: () => false,
};

export const useRouter = () => router;
export const usePathname = () => current().pathname;
export const useSegments = () => [] as string[];
export const useLocalSearchParams = <T extends Params = Params>() => current().params as T;
export const useGlobalSearchParams = <T extends Params = Params>() => current().params as T;
export const useFocusEffect = () => undefined;
export const useIsFocused = () => true;
export const useRootNavigationState = () => ({ key: 'storybook' });

export function Link({ href, children, asChild: _asChild }: { href: unknown; children: ReactNode; asChild?: boolean }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)}>
      {children}
    </Pressable>
  );
}

export function Redirect() {
  return null;
}
