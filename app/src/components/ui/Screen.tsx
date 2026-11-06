import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { size, space } from '@/theme/tokens';

/** Space the floating tab bar takes above the bottom inset. */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return size.tabBar + Math.max(insets.bottom, space.md) + space.gutter;
}

export type ScreenProps = {
  children: ReactNode;
  /** Scrolls by default; pass false for a fixed layout (Home map). */
  scroll?: boolean;
  /** True on tab screens so content clears the floating tab bar. */
  tabs?: boolean;
  /** Extra space at the bottom for a pinned footer. */
  footerSpace?: number;
  gutter?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Pinned under the scrolling content (primary actions). Rises with the keyboard. */
  footer?: ReactNode;
  testID?: string;
};

/** A screen: black ground, safe-area aware, 20px gutters, 20px between sections. */
export function Screen({
  children,
  scroll = true,
  tabs = false,
  footerSpace = 0,
  gutter = true,
  contentStyle,
  footer,
  testID,
}: ScreenProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance();
  const safeBottom = Math.max(insets.bottom, space.md);
  const bottom = (footer ? space.md : tabs ? clearance : safeBottom + space.md) + footerSpace;
  // Pushed screens keep scrolling content out from under the status bar; tab screens scroll full-bleed.
  const clipTop = !tabs && scroll;
  const padding = [
    styles.content,
    {
      paddingTop: (clipTop ? 0 : insets.top) + space.md,
      paddingBottom: bottom,
      paddingHorizontal: gutter ? space.gutter : 0,
    },
    contentStyle,
  ];
  if (footer) {
    return (
      <KeyboardAvoidingView
        testID={testID}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.root, { backgroundColor: c.background, paddingTop: clipTop ? insets.top : 0 }]}>
        {scroll ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={[padding, styles.grow]}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, padding]}>{children}</View>
        )}
        <View style={[styles.footer, { paddingBottom: safeBottom }]}>{footer}</View>
      </KeyboardAvoidingView>
    );
  }
  if (!scroll) {
    return (
      <View testID={testID} style={[styles.root, { backgroundColor: c.background }, padding]}>
        {children}
      </View>
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: clipTop ? insets.top : 0 }]}>
      <ScrollView
        testID={testID}
        style={styles.root}
        contentContainerStyle={padding}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.section },
  grow: { flexGrow: 1 },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.row, gap: space.stack },
});
