import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme';
import { motion, space } from '@/theme/tokens';

import { BottomSheetFrame } from './BottomSheetFrame';
import { useSwipeToClose } from './Sheet';

/**
 * A bottom sheet drawn inside the current screen instead of a native modal,
 * so one sheet can follow another (review, then payment, then the result)
 * without waiting on the system to dismiss the last one. Same look as Sheet:
 * the screen behind reads at 35%, 1px border, 24px top radius, grab handle.
 * Put it last inside a full-screen container. Tapping the dimmed screen or
 * pulling the sheet down closes it.
 */
export function OverlaySheet({
  visible,
  onClose,
  children,
  testID,
  accessibilityLabel,
  closeLabel = 'Close',
  covered = false,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  testID?: string;
  /** The sheet's spoken name, e.g. "Your offer to KOYO". */
  accessibilityLabel?: string;
  /** Spoken name of the dimmed screen behind, which closes the sheet. */
  closeLabel?: string;
  /** Another sheet is open over this one: this one stays on screen but is out of reach of VoiceOver. */
  covered?: boolean;
}) {
  const c = useTheme();
  const reduceMotion = useReducedMotion();
  const swipe = useSwipeToClose(visible, onClose);
  if (!visible) return null;
  // Rises from the bottom edge; under Reduce Motion it fades in.
  const entering = reduceMotion ? FadeIn.duration(motion.fast) : SlideInDown.duration(motion.slow);
  return (
    <View
      style={styles.root}
      testID={testID}
      accessibilityViewIsModal={!covered}
      accessibilityElementsHidden={covered}
      importantForAccessibility={covered ? 'no-hide-descendants' : 'auto'}
      accessibilityLabel={accessibilityLabel}>
      <Animated.View entering={FadeIn.duration(motion.base)} style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View entering={entering} style={styles.rise}>
        <Animated.View style={[styles.sheet, swipe.style]}>
          <BottomSheetFrame style={styles.frame} grab={swipe.grab}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              {children}
            </ScrollView>
          </BottomSheetFrame>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', zIndex: 10 },
  rise: { maxHeight: '92%' },
  sheet: { flexShrink: 1 },
  frame: { flexShrink: 1 },
  content: { gap: space.md },
});
