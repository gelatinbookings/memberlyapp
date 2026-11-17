import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { ImageAsset } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius } from '@/theme/tokens';

/** A community's logo (or cover) or an event's cover as a small square; a muted tile when it has none. */
export function CommunityThumb({ cover, size = 44, testID }: { cover: ImageAsset | null | undefined; size?: number; testID?: string }) {
  const c = useTheme();
  const box = { width: size, height: size };
  if (!cover) return <View testID={testID} style={[styles.thumb, box, { backgroundColor: c.muted }]} />;
  return <Image testID={testID} source={cover} style={[styles.thumb, box]} contentFit="cover" />;
}

const styles = StyleSheet.create({
  thumb: { borderRadius: radius.notice },
});
