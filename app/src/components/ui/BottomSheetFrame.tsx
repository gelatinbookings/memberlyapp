import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** The 40×4 grab handle at the top of every sheet. */
export function SheetHandle() {
  const c = useTheme();
  return <View accessibilityElementsHidden importantForAccessibility="no" style={[styles.handle, { backgroundColor: c.border }]} />;
}

/**
 * The visual frame of a bottom sheet: black ground, 1px top border, 24px top
 * radius, grab handle. Presentation (gesture, detents) comes from the router's
 * form sheet in milestone 3; this frame is shared so both look the same.
 */
export function BottomSheetFrame({
  children,
  style,
  padBottom = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padBottom?: boolean;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: c.background,
          borderColor: c.border,
          paddingBottom: padBottom ? Math.max(insets.bottom, space.md) + space.md : 0,
        },
        style,
      ]}>
      <SheetHandle />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  handle: { width: 40, height: 4, borderRadius: radius.pill, alignSelf: 'center' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 10,
    paddingHorizontal: space.gutter,
    gap: space.md,
  },
});
