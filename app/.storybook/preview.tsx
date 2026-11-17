import type { Preview } from '@storybook/react-native-web-vite';

import { darkPalette, font } from '../src/theme/tokens';
import interBold from '../assets/fonts/Inter-Bold.ttf?url';
import interExtraBold from '../assets/fonts/Inter-ExtraBold.ttf?url';
import interMedium from '../assets/fonts/Inter-Medium.ttf?url';
import interRegular from '../assets/fonts/Inter-Regular.ttf?url';
import interSemiBold from '../assets/fonts/Inter-SemiBold.ttf?url';
import { PHONE } from './AppProviders';
import { withMemberly } from './decorators';
import { memberlyTheme } from './theme';

/**
 * Inter's five weights under the family names the app's `useFonts` registers
 * (`font` in tokens.ts), one face per weight, exactly as on the phone.
 */
const faces: Record<string, string> = {
  [font.regular]: interRegular,
  [font.medium]: interMedium,
  [font.semibold]: interSemiBold,
  [font.bold]: interBold,
  [font.extrabold]: interExtraBold,
};
const fontsReady = Promise.all(
  Object.entries(faces).map(async ([family, url]) => {
    const face = new FontFace(family, `url(${url})`, { display: 'block' });
    document.fonts.add(face);
    return face.load();
  }),
);

const preview: Preview = {
  // Stories wait for Inter so nothing renders in a fallback face first.
  loaders: [async () => ({ fonts: await fontsReady })],
  // The app's providers on a fresh sample world, inside the phone column (see decorators.tsx).
  decorators: [withMemberly],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    backgrounds: {
      options: { black: { name: 'Black (app ground)', value: darkPalette.background }, card: { name: 'Card', value: darkPalette.card } },
    },
    viewport: {
      options: {
        memberly: { name: 'iPhone, 390', styles: { width: `${PHONE.width}px`, height: `${PHONE.height}px` }, type: 'mobile' },
        small: { name: 'iPhone SE, 375', styles: { width: '375px', height: '667px' }, type: 'mobile' },
        large: { name: 'iPhone Pro Max, 440', styles: { width: '440px', height: '956px' }, type: 'mobile' },
      },
    },
    docs: { theme: memberlyTheme },
    options: {
      // The sidebar reads top to bottom: Start here, Foundations, then the atomic levels in build order.
      // Components sort A–Z inside each level; a component's own stories keep the order they're written
      // in (rest state first, error states last). First run keeps the order a person meets its screens.
      storySort: {
        method: 'alphabetical',
        order: [
          'Start here',
          'Foundations',
          ['Colors', 'Typography', 'Spacing and radius', 'Icons', 'Motion'],
          'Atoms',
          'Molecules',
          'Organisms',
          'Templates',
          'Pages',
          ['First run', ['Welcome', 'Sign in', 'Intro', 'Create account', 'Verify code', 'Preferences', 'Permissions'], 'Member', 'Organizer'],
        ],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'black' },
    viewport: { value: 'memberly', isRotated: false },
  },
  tags: ['autodocs'],
};

export default preview;
