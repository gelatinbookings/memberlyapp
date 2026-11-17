import { Image } from 'expo-image';
import { ImagePlus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { LibraryPhoto } from '@/lib/photos';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

const LOGO = 68;

/**
 * The top of the community's public page as it will look: banner, logo over
 * its lower edge, name and tagline. Tapping the banner or the logo picks that
 * photo, so the preview is also where they're added.
 */
export function HeaderPreview({
  name,
  tagline,
  logo,
  banner,
  onPickLogo,
  onPickBanner,
}: {
  name: string;
  tagline: string;
  logo: LibraryPhoto | null;
  banner: LibraryPhoto | null;
  onPickLogo: () => void;
  onPickBanner: () => void;
}) {
  const c = useTheme();
  return (
    <View testID="header-preview" style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Pressable
        testID="preview-banner"
        accessibilityRole="button"
        accessibilityLabel={banner ? 'Banner. Replace' : 'Add a banner'}
        onPress={onPickBanner}
        style={({ pressed }) => [styles.banner, { backgroundColor: c.muted }, pressed ? { opacity: 0.85 } : null]}>
        {banner ? (
          <Image source={{ uri: banner.uri }} style={StyleSheet.absoluteFill} contentFit="cover" testID="preview-banner-image" />
        ) : (
          <View style={styles.bannerEmpty}>
            <ImagePlus size={18} color={c.mutedText} strokeWidth={2} />
            <Text variant="helper" tone="muted">
              Add a banner
            </Text>
          </View>
        )}
      </Pressable>
      <View style={styles.body}>
        <Pressable
          testID="preview-logo"
          accessibilityRole="button"
          accessibilityLabel={logo ? 'Logo. Replace' : 'Add a logo'}
          onPress={onPickLogo}
          style={({ pressed }) => [
            styles.logo,
            { backgroundColor: c.muted, borderColor: c.card },
            pressed ? { opacity: 0.85 } : null,
          ]}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" testID="preview-logo-image" />
          ) : (
            <ImagePlus size={18} color={c.mutedText} strokeWidth={2} />
          )}
        </Pressable>
        <Text variant="headline" numberOfLines={1}>
          {name.trim() || 'Your community'}
        </Text>
        <Text variant="secondary" tone="muted" numberOfLines={2}>
          {tagline.trim() || 'Your tagline'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  banner: { aspectRatio: 4, overflow: 'hidden' },
  bannerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingBottom: space.md },
  body: { paddingHorizontal: space.card, paddingBottom: space.card, gap: 2 },
  logo: {
    width: LOGO,
    height: LOGO,
    marginTop: -LOGO / 2,
    marginBottom: space.sm,
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
