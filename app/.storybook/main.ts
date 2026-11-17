import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import remarkGfm from 'remark-gfm';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * Memberly's component library in the browser: the real React Native
 * components through react-native-web, on Vite.
 * Stories sit next to their components (`*.stories.tsx`); foundations are MDX in `src/foundations`.
 */
const config: StorybookConfig = {
  stories: ['../src/foundations/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      // GitHub-flavored Markdown, so the tables in Start here and Foundations render as tables.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
  ],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        babel: {
          // Reanimated 4 moved its worklet transform into react-native-worklets.
          plugins: ['react-native-worklets/plugin'],
        },
      },
    },
  },
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    // Some packages import names that exist only on a phone or only as types:
    // expo-modules-core's ts-declarations (EventEmitter, NativeModule, SharedObject,
    // SharedRef) and react-native-svg's TurboModuleRegistry. Nothing in a story
    // calls them, so the bundler stands them in instead of failing.
    const shim = { shimMissingExports: true };
    return mergeConfig(viteConfig, {
      optimizeDeps: { rolldownOptions: shim },
      build: { rolldownOptions: shim },
      resolve: {
        alias: [
          // Expo Router needs the app's route tree, which a story doesn't have. The mock logs navigation as actions.
          { find: /^expo-router$/, replacement: here('./mocks/expo-router.tsx') },
          // Ships TypeScript source the bundler can't parse; a browser has no photo library anyway.
          { find: /^expo-image-picker$/, replacement: here('./mocks/expo-image-picker.ts') },
          // React Native 0.88 no longer installs the assets registry; react-native-svg's web build still imports it.
          { find: /^@react-native\/assets-registry\/registry$/, replacement: here('./mocks/assets-registry.ts') },
        ],
      },
    });
  },
};

export default config;
