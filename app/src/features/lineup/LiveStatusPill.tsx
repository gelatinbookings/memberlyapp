import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { StatusPill } from '@/components/ui';
import { statusUi } from '@/features/booking/status';
import { motion } from '@/theme/tokens';

/** What VoiceOver says when a booking changes while the Lineup is open: "KOYO: Confirmed". */
export function statusAnnouncement(djName: string, status: string): string {
  return `${djName}: ${statusUi(status).label}`;
}

/**
 * A booking's status pill on the Lineup. When the status changes while the
 * card is on screen, the old pill fades out as the new one fades in (200 ms,
 * opacity only) and the change is announced. Under Reduce Motion the pill
 * simply changes. A card that has just appeared neither fades nor announces.
 */
export function LiveStatusPill({ djName, status }: { djName: string; status: string }) {
  const reduceMotion = useReducedMotion();
  const [seen, setSeen] = useState(status);
  const [changed, setChanged] = useState(false);
  if (seen !== status) {
    setSeen(status);
    setChanged(true);
  }

  const announced = useRef(status);
  useEffect(() => {
    if (announced.current === status) return;
    announced.current = status;
    AccessibilityInfo.announceForAccessibility(statusAnnouncement(djName, status));
  }, [djName, status]);

  const fade = changed && !reduceMotion;
  return (
    <View style={styles.slot}>
      <Animated.View
        key={status}
        testID="status-pill"
        entering={fade ? FadeIn.duration(motion.base) : undefined}
        exiting={reduceMotion ? undefined : FadeOut.duration(motion.base)}>
        <StatusPill status={status} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The leaving pill fades where it stood while the new one takes its place.
  slot: { alignSelf: 'flex-start' },
});
