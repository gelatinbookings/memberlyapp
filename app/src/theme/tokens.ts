/**
 * Memberly design tokens, from DESIGN.md ("Memberly at night").
 * Roles, not raw hex, reach components through `useTheme()`.
 * Dark is the shipped appearance; light is defined from the web tokens so a
 * daylight theme can be switched on later without touching components.
 */
import type { TextStyle } from 'react-native';

export type Palette = {
  background: string;
  card: string;
  muted: string;
  border: string;
  foreground: string;
  mutedText: string;
  brand: string;
  brandPressed: string;
  ring: string;
  tint: string;
  brandText: string;
  brandLine: string;
  successBg: string;
  successText: string;
  warningBg: string;
  warningText: string;
  errorBg: string;
  errorText: string;
  destructive: string;
  onBrand: string;
  scrim: string;
  /** Over the screen behind a sheet or dialog, so it reads at 35%. */
  dim: string;
  mapGround: string;
  mapLine: string;
  /** QR modules and the paper behind them: black on white in every theme, so doors can scan. */
  qrInk: string;
  qrPaper: string;
};

export const darkPalette: Palette = {
  background: '#000000',
  card: '#0D0D0D',
  muted: '#1F1F1F',
  border: '#292929',
  foreground: '#FAFAFA',
  mutedText: '#A1A1A1',
  brand: '#9333EA',
  brandPressed: '#7E22CE',
  ring: '#8B5CF6',
  tint: 'rgba(59,7,100,0.4)',
  brandText: '#D8B4FE',
  brandLine: '#6B21A8',
  successBg: 'rgba(6,78,59,0.4)',
  successText: '#6EE7B7',
  warningBg: 'rgba(120,53,15,0.4)',
  warningText: '#FCD34D',
  errorBg: 'rgba(127,29,29,0.4)',
  errorText: '#FCA5A5',
  destructive: '#EF4444',
  onBrand: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.6)',
  dim: 'rgba(0,0,0,0.65)',
  mapGround: '#111111',
  mapLine: '#222222',
  qrInk: '#000000',
  qrPaper: '#FFFFFF',
};

/** From the Memberly web Kit's light tokens. Not shipped yet. */
export const lightPalette: Palette = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  muted: '#F1F5F9',
  border: '#E2E8F0',
  foreground: '#020817',
  mutedText: '#64748B',
  brand: '#9333EA',
  brandPressed: '#7E22CE',
  ring: '#8B5CF6',
  tint: '#F3E8FF',
  brandText: '#7E22CE',
  brandLine: '#C084FC',
  successBg: '#D1FAE5',
  successText: '#047857',
  warningBg: '#FFFBEB',
  warningText: '#B45309',
  errorBg: '#FEF2F2',
  errorText: '#B91C1C',
  destructive: '#EF4444',
  onBrand: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.6)',
  dim: 'rgba(255,255,255,0.65)',
  mapGround: '#EEF0F3',
  mapLine: '#DADDE3',
  qrInk: '#000000',
  qrPaper: '#FFFFFF',
};

/** Third-party marks drawn exactly as their owners require. Not theme colours. */
export const brandMarks = {
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
} as const;

export const radius = {
  control: 6,
  notice: 12,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  label: 6,
  sm: 8,
  stack: 10,
  row: 12,
  card: 14,
  md: 16,
  gutter: 20,
  section: 20,
} as const;

export const size = {
  primaryButton: 52,
  secondaryButton: 48,
  field: 48,
  chip: 44,
  minTarget: 44,
  tabBar: 64,
  tabActive: 50,
  avatar: 44,
  rowThumb: 64,
} as const;

/** One face per weight so weights render the same on iOS and Android. */
export const font = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extrabold: 'Inter-ExtraBold',
} as const;

export const type = {
  display: { fontFamily: font.extrabold, fontSize: 28, lineHeight: 31, letterSpacing: -0.56 },
  headline: { fontFamily: font.bold, fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  title: { fontFamily: font.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.17 },
  cardTitle: { fontFamily: font.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  secondary: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  secondaryStrong: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
  helper: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
  money: {
    fontFamily: font.extrabold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.56,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: font.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const motion = {
  fast: 150,
  base: 200,
  slow: 250,
} as const;
