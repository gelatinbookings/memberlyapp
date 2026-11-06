import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { type, type Palette, type TypeVariant } from '@/theme/tokens';

export type TextTone =
  | 'default'
  | 'muted'
  | 'brand'
  | 'onBrand'
  | 'success'
  | 'warning'
  | 'error';

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
};

export function toneColor(tone: TextTone, c: Palette): string {
  switch (tone) {
    case 'muted':
      return c.mutedText;
    case 'brand':
      return c.brandText;
    case 'onBrand':
      return c.onBrand;
    case 'success':
      return c.successText;
    case 'warning':
      return c.warningText;
    case 'error':
      return c.errorText;
    default:
      return c.foreground;
  }
}

/** All app text. Sentence case; the only uppercase is the `label` variant. */
export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: AppTextProps) {
  const c = useTheme();
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={variant === 'label' ? 1.4 : 2}
      style={[type[variant], { color: toneColor(tone, c) }, align ? { textAlign: align } : null, style]}
    />
  );
}
