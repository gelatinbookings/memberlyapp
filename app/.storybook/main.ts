import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import remarkGfm from 'remark-gfm';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** `import { …, Modal, … } from 'react-native'`, the statement the Modal stand-in replaces. */
const MODAL_IMPORT = /import\s*\{[^}]*\bModal\b[^}]*\}\s*from\s*(['"])react-native\1/;
const inlineModal = here('./mocks/react-native.ts');

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
  // No "Get started" checklist in the sidebar or the menu: this is a finished library, not a new project.
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    // Some packages import names that exist only on a phone or only as types:
    // expo-modules-core's ts-declarations (EventEmitter, NativeModule, SharedObject,
    // SharedRef) and react-native-svg's TurboModuleRegistry. Nothing in a story
    // calls them, so the bundler stands them in instead of failing.
    const shim = { shimMissingExports: true };
    const src = here('../src/');
    return mergeConfig(viteConfig, {
      plugins: [
        {
          // React Native's Modal portals to the page body on the web, so a sheet covered the whole
          // canvas. A file under src/ that imports Modal from react-native imports it from
          // mocks/react-native.ts instead: the same module with a Modal that draws inside the
          // story's phone frame. The app's source files are unchanged on disk.
          // (A transform, not resolveId: in dev, Vite resolves react-native to its pre-bundled
          // copy before any plugin's resolveId runs.)
          name: 'memberly:modal-in-phone-frame',
          enforce: 'pre',
          transform(code: string, id: string) {
            if (!id.startsWith(src) || !MODAL_IMPORT.test(code)) return null;
            return { code: code.replace(MODAL_IMPORT, (statement) => statement.replace(/(['"])react-native\1/, JSON.stringify(inlineModal))), map: null };
          },
        },
      ],
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
