import { createContext, useCallback, useContext, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme';
import { size, space } from '@/theme/tokens';

type ScrollIntoView = (target: ComponentRef<typeof View> | null) => void;
const ScreenScrollContext = createContext<ScrollIntoView>(() => undefined);

/**
 * Scroll the screen so `target` sits near the top, e.g. a search field whose
 * suggestions open below it. Does nothing outside a scrolling Screen.
 */
export function useScrollIntoView(): ScrollIntoView {
  return useContext(ScreenScrollContext);
}

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
  /** The 20px side gutters. Default true; false for edge-to-edge content such as a cover photo. */
  gutter?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Pinned under the scrolling content (primary actions). Rises with the keyboard. */
  footer?: ReactNode;
  /**
   * Pinned above the scrolling content, so Back never scrolls away: a pushed
   * screen's `ScreenHeader` or its own back row. A hairline shows under it once
   * content scrolls beneath.
   */
  header?: ReactNode;
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
  header,
  testID,
}: ScreenProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance();
  const safeBottom = Math.max(insets.bottom, space.md);
  const bottom = (footer ? space.md : tabs ? clearance : safeBottom + space.md) + footerSpace;
  // Pushed screens keep scrolling content out from under the status bar; tab screens scroll full-bleed.
  const clipTop = (!tabs && scroll) || header != null;
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollIntoView = useCallback<ScrollIntoView>((target) => {
    const scroller = scrollRef.current;
    const content = scroller?.getInnerViewRef?.();
    if (!scroller || !content || !target) return;
    try {
      target.measureLayout(content, (_x: number, y: number) => scroller.scrollTo({ y: Math.max(0, y - space.md), animated: true }));
    } catch {
      // Not laid out yet; nothing to scroll.
    }
  }, []);
  const scrollValue = useMemo(() => scrollIntoView, [scrollIntoView]);
  const onScroll = header ? (e: NativeSyntheticEvent<NativeScrollEvent>) => setScrolled(e.nativeEvent.contentOffset.y > 0) : undefined;
  const pinned = header ? (
    <View style={[styles.header, { paddingHorizontal: gutter ? space.gutter : 0, borderBottomColor: scrolled ? c.border : 'transparent' }]}>{header}</View>
  ) : null;
  const padding = [
    styles.content,
    {
      paddingTop: header ? space.sm : (clipTop ? 0 : insets.top) + space.md,
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
        {pinned}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.root}
            contentContainerStyle={[padding, styles.grow]}
            contentInsetAdjustmentBehavior="never"
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ScreenScrollContext.Provider value={scrollValue}>{children}</ScreenScrollContext.Provider>
          </ScrollView>
        ) : (
          <View style={[styles.root, padding]}><ScreenScrollContext.Provider value={scrollValue}>{children}</ScreenScrollContext.Provider></View>
        )}
        <View style={[styles.footer, { paddingBottom: safeBottom }]}>{footer}</View>
      </KeyboardAvoidingView>
    );
  }
  if (!scroll) {
    if (header) {
      return (
        <View testID={testID} style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
          {pinned}
          <View style={[styles.root, padding]}><ScreenScrollContext.Provider value={scrollValue}>{children}</ScreenScrollContext.Provider></View>
        </View>
      );
    }
    return (
      <View testID={testID} style={[styles.root, { backgroundColor: c.background }, padding]}>
        <ScreenScrollContext.Provider value={scrollValue}>{children}</ScreenScrollContext.Provider>
      </View>
    );
  }
  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: clipTop ? insets.top : 0 }]}>
      {pinned}
      <ScrollView
        ref={scrollRef}
        testID={testID}
        style={styles.root}
        contentContainerStyle={padding}
        contentInsetAdjustmentBehavior="never"
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <ScreenScrollContext.Provider value={scrollValue}>{children}</ScreenScrollContext.Provider>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.section },
  grow: { flexGrow: 1 },
  header: { paddingTop: space.md, paddingBottom: space.row, borderBottomWidth: StyleSheet.hairlineWidth },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.row, gap: space.stack },
});
