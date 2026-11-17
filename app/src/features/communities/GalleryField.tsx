import { Image } from 'expo-image';
import { ImagePlus, X } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { LibraryPhoto } from '@/lib/photos';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { GALLERY_MAX } from './communityForm';

/** Up to ten photos in a grid, each with a remove button, and a tile that adds more. */
export function GalleryField({
  photos,
  warning,
  onAdd,
  onRemove,
}: {
  photos: LibraryPhoto[];
  /** Replaces the helper in amber, e.g. when a photo couldn’t be added. */
  warning?: string | null;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const c = useTheme();
  const full = photos.length >= GALLERY_MAX;
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {photos.map((p, i) => (
          <View key={`${p.uri}-${i}`} style={[styles.tile, { backgroundColor: c.muted }]} testID={`gallery-photo-${i}`}>
            <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              hitSlop={8}
              onPress={() => onRemove(i)}
              style={[styles.remove, { backgroundColor: c.scrim }]}>
              <X size={14} color={c.onBrand} strokeWidth={2.5} />
            </Pressable>
          </View>
        ))}
        {full ? null : (
          <Pressable
            testID="gallery-add"
            accessibilityRole="button"
            accessibilityLabel="Add gallery photos"
            onPress={onAdd}
            style={({ pressed }) => [styles.tile, styles.add, { borderColor: c.mutedText, backgroundColor: pressed ? c.muted : 'transparent' }]}>
            <ImagePlus size={20} color={c.mutedText} strokeWidth={2} />
            <Text variant="helper" tone="muted">
              Add photos
            </Text>
          </Pressable>
        )}
      </View>
      <Text variant="helper" tone={warning ? 'warning' : 'muted'}>
        {warning ?? `${photos.length} of ${GALLERY_MAX} photos · JPEG, PNG or WebP, up to 10 MB each`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { width: 92, height: 92, borderRadius: radius.notice, overflow: 'hidden' },
  add: { borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  remove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
