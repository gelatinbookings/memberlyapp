import { create } from 'storybook/theming';

import { darkPalette } from '../src/theme/tokens';

/** Storybook's own chrome and docs pages in Memberly's dark roles. */
export const memberlyTheme = create({
  base: 'dark',
  brandTitle: 'Memberly Design System',
  colorPrimary: darkPalette.brand,
  colorSecondary: darkPalette.brand,
  appBg: darkPalette.card,
  appContentBg: darkPalette.background,
  appPreviewBg: darkPalette.background,
  appBorderColor: darkPalette.border,
  appBorderRadius: 6,
  textColor: darkPalette.foreground,
  textMutedColor: darkPalette.mutedText,
  barBg: darkPalette.card,
  barTextColor: darkPalette.mutedText,
  barSelectedColor: darkPalette.brandText,
  inputBg: darkPalette.card,
  inputBorder: darkPalette.border,
  inputTextColor: darkPalette.foreground,
  inputBorderRadius: 6,
  fontBase: '"Inter-Regular", system-ui, sans-serif',
});
