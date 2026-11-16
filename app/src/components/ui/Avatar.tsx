import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { ImageAsset } from '@/data/types';

import { useTheme } from '@/theme/theme';
import { font, radius } from '@/theme/tokens';

import { Text } from './Text';

export type AvatarProps = {
  /** Photo when we have one; initials otherwise. */
  source?: ImageAsset;
  initials: string;
  size?: number;
  /** Greyed out, e.g. a DJ who passed. */
  muted?: boolean;
  accessibilityLabel?: string;
};

export function Avatar({ source, initials, size = 44, muted = false, accessibilityLabel }: AvatarProps) {
  const c = useTheme();
  const dims = { width: size, height: size, borderRadius: radius.pill };
  if (source) {
    return (
      <Image
        source={source}
        accessibilityLabel={accessibilityLabel}
        // Muted ground while the photo loads.
        style={[dims, { backgroundColor: c.muted }, muted ? styles.muted : null]}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.initials, dims, { backgroundColor: muted ? c.muted : c.tint }]}>
      <Text
        variant="secondaryStrong"
        // The line height follows the size, so large initials are not cut off.
        style={{
          color: muted ? c.mutedText : c.brandText,
          fontFamily: font.bold,
          fontSize: Math.round(size * 0.3),
          lineHeight: Math.round(size * 0.3 * 1.3),
        }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initials: { alignItems: 'center', justifyContent: 'center' },
  muted: { opacity: 0.6 },
});
