import { useEffect, useRef, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type GestureResponderEvent, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme';
import { motion, space } from '@/theme/tokens';

import { BottomSheetFrame } from './BottomSheetFrame';
import { Text } from './Text';

/** How far, or how fast (points per millisecond), a sheet is pulled down before it closes. */
const CLOSE_DISTANCE = 90;
const CLOSE_VELOCITY = 0.9;

type Pull = { y: number; lastY: number; lastAt: number; velocity: number };

/**
 * Pull a sheet down by its head to close it. The sheet follows the finger
 * (transform only); under Reduce Motion it stays put and closes on release.
 * Closing this way is the same as tapping the dimmed screen: nothing is applied.
 *
 * Spread `grab` on the parts that can be pulled (the handle, the title, a
 * photo) and add `style` to the sheet. The grab areas take the touch as it
 * starts, because inside a Modal a view cannot take it over once it has moved.
 * Buttons inside a grab area still get their own taps.
 */
export function useSwipeToClose(visible: boolean, onClose: () => void) {
  const reduceMotion = useReducedMotion();
  const drag = useSharedValue(0);
  const pull = useRef<Pull | null>(null);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: drag.value }] }));

  // Each opening starts from rest.
  useEffect(() => {
    if (visible) drag.set(0);
  }, [visible, drag]);

  const settle = () => {
    pull.current = null;
    drag.set(reduceMotion ? 0 : withTiming(0, { duration: motion.fast }));
  };
  const distance = (e: GestureResponderEvent) => (pull.current ? e.nativeEvent.pageY - pull.current.y : 0);

  const grab: ViewProps = {
    onStartShouldSetResponder: () => true,
    onResponderGrant: (e) => {
      const { pageY, timestamp } = e.nativeEvent;
      pull.current = { y: pageY, lastY: pageY, lastAt: timestamp, velocity: 0 };
    },
    onResponderMove: (e) => {
      const p = pull.current;
      if (!p) return;
      const { pageY, timestamp } = e.nativeEvent;
      if (timestamp > p.lastAt) p.velocity = (pageY - p.lastY) / (timestamp - p.lastAt);
      p.lastY = pageY;
      p.lastAt = timestamp;
      if (!reduceMotion) drag.set(Math.max(0, distance(e)));
    },
    onResponderRelease: (e) => {
      const far = distance(e) > CLOSE_DISTANCE || (pull.current?.velocity ?? 0) > CLOSE_VELOCITY;
      pull.current = null;
      if (far) onClose();
      else settle();
    },
    onResponderTerminationRequest: () => true,
    onResponderTerminate: settle,
  };

  return { grab, style };
}

/**
 * A bottom sheet over the current screen. The screen behind reads at 35%
 * (a 65% black dim), the sheet sits on the black ground with its 1px border.
 * Tapping the dimmed screen, pulling the sheet down or the system back closes it.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  action,
  children,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** A text action on the title row, e.g. Reset. */
  action?: ReactNode;
  children: ReactNode;
  testID?: string;
}) {
  const c = useTheme();
  const swipe = useSwipeToClose(visible, onClose);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID={testID}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]}
        />
        <Animated.View style={[styles.sheet, swipe.style]}>
          <BottomSheetFrame style={styles.frame} grab={swipe.grab}>
            <View style={styles.head} {...swipe.grab}>
              <View style={styles.titleRow}>
                <Text variant="headline" accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                {action}
              </View>
              {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
            </View>
            {children}
          </BottomSheetFrame>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%' },
  frame: { flexShrink: 1 },
  head: { gap: space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.row },
  title: { flex: 1 },
});
