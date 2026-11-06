import Svg, { Path } from 'react-native-svg';

import { brandMarks } from '@/theme/tokens';

/** The Google "G", in Google's colours as its brand rules require. */
export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill={brandMarks.googleBlue} d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <Path fill={brandMarks.googleGreen} d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.3 7.3 0 0 1-10.9-3.8H1.2v3.1A12 12 0 0 0 12 24z" />
      <Path fill={brandMarks.googleYellow} d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4-3.1z" />
      <Path fill={brandMarks.googleRed} d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.2 6.6l4 3.1C6.2 6.8 8.9 4.8 12 4.8z" />
    </Svg>
  );
}

/** The Apple mark, one colour. */
export function AppleMark({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      <Path
        fill={color}
        d="M16.37 12.74c-.03-2.66 2.17-3.94 2.27-4-1.24-1.81-3.16-2.06-3.84-2.09-1.64-.17-3.19.96-4.02.96-.83 0-2.11-.94-3.47-.91-1.78.03-3.43 1.04-4.35 2.63-1.86 3.22-.48 7.99 1.33 10.6.89 1.28 1.94 2.71 3.32 2.66 1.33-.05 1.84-.86 3.45-.86 1.61 0 2.07.86 3.48.83 1.44-.02 2.35-1.3 3.23-2.58 1.02-1.48 1.44-2.92 1.46-3-.03-.01-2.8-1.07-2.83-4.26zM13.72 4.92c.73-.89 1.23-2.12 1.09-3.35-1.05.04-2.33.7-3.08 1.59-.68.78-1.27 2.04-1.11 3.24 1.17.09 2.37-.6 3.1-1.48z"
      />
    </Svg>
  );
}
