import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Card, Notice, Pill, StatusPill, Text } from '@/components/ui';
import type { FakeControls, FakePortalBooking, PortalAction } from '@/data/fakeRepository';
import { offerAndTotal } from '@/features/offers/copy';
import { useTheme } from '@/theme/theme';
import { motion, size, space } from '@/theme/tokens';

import type { PortalResult } from './types';

export const TEST_PORTAL_NOTE =
  'This screen stands in for Gelatin’s portal, on sample data only. No DJ is contacted and nothing is charged.';
export const TEST_PORTAL_EXPIRED = 'This link has expired or was already used. Go back and open Gelatin again.';

/** The DJ's side of a booking, one button each. What each does is in `fake.playDj`. */
export const TEST_PORTAL_ACTIONS: { action: PortalAction; label: string }[] = [
  { action: 'accept', label: 'Accept' },
  { action: 'pass', label: 'Pass' },
  { action: 'counter', label: 'Counter at a new price' },
  { action: 'expire', label: 'Let it expire' },
  { action: 'cancel', label: 'Cancel booking' },
];

/** How often the screen reads the booking again, so a counter landing shows without a tap. */
const REFRESH_MS = 1000;

/**
 * The test portal: what stands where Gelatin's portal will, on the fake
 * repository only. It is a full screen over the app, as the browser sheet is.
 * The buttons play the DJ so every status can be shown. This is not a design
 * for anything in Memberly: the organizer's real choices (accept a new price,
 * cancel, refunds) happen in Gelatin, and the app has no such screens.
 *
 * Back to Memberly ends the visit the way Gelatin's return link does; Close
 * ends it the way closing the browser sheet does.
 */
export function TestPortalScreen({
  booking: opened,
  fake,
  onDone,
}: {
  /** Null when the launch had expired or was used before. */
  booking: FakePortalBooking | null;
  fake: FakeControls;
  onDone: (result: PortalResult) => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState(opened);
  const requestId = opened?.booking.requestId;

  useEffect(() => {
    if (!requestId) return;
    const timer = setInterval(() => setView(fake.portalBooking(requestId)), REFRESH_MS);
    return () => clearInterval(timer);
  }, [fake, requestId]);

  const play = (action: PortalAction) => {
    if (!requestId) return;
    fake.playDj(requestId, action);
    setView(fake.portalBooking(requestId));
  };

  return (
    <Animated.View
      entering={FadeIn.duration(motion.base)}
      testID="test-portal"
      accessibilityViewIsModal
      accessibilityLabel="Test portal"
      style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.bar, { paddingTop: insets.top, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <Pressable
          testID="test-portal-close"
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => onDone('dismissed')}
          style={styles.barAction}>
          <Text variant="bodyStrong">Close</Text>
        </Pressable>
        <Text variant="secondary" tone="muted" style={styles.barTitle} numberOfLines={1}>
          Test portal
        </Text>
        <View style={styles.barAction} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pill label="Test portal" tone="warning" />
        {view ? (
          <>
            <View style={styles.block}>
              <Text variant="headline" accessibilityRole="header">
                Your booking with {view.booking.dj.name}
              </Text>
              <Text tone="muted">{TEST_PORTAL_NOTE}</Text>
            </View>
            <Card testID="test-portal-booking">
              <View style={styles.row}>
                <Avatar source={view.booking.dj.photo} initials={view.booking.dj.initials} size={40} />
                <View style={styles.flex}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {[view.booking.dj.name, view.eventName].filter(Boolean).join(' · ')}
                  </Text>
                  <Text variant="helper" tone="muted" numberOfLines={1}>
                    {offerAndTotal(view.booking)}
                  </Text>
                </View>
              </View>
              <StatusPill status={view.booking.status} />
            </Card>
            <View style={styles.block}>
              <Text variant="title" accessibilityRole="header">
                Play the DJ
              </Text>
              <Text variant="secondary" tone="muted">
                Each button changes this booking in the sample data. Your lineup shows it when you go back.
              </Text>
            </View>
            <View style={styles.actions}>
              {TEST_PORTAL_ACTIONS.map(({ action, label }) => (
                <Button key={action} testID={`test-portal-${action}`} label={label} variant="secondary" onPress={() => play(action)} />
              ))}
            </View>
          </>
        ) : (
          <Notice tone="error">{TEST_PORTAL_EXPIRED}</Notice>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <Button testID="test-portal-back" label="Back to Memberly" onPress={() => onDone(view ? 'returned' : 'dismissed')} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 20 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.gutter, borderBottomWidth: 1 },
  barAction: { minWidth: 64, minHeight: size.minTarget, justifyContent: 'center' },
  barTitle: { flex: 1, textAlign: 'center', minHeight: size.minTarget, textAlignVertical: 'center', paddingTop: 13 },
  content: { padding: space.gutter, gap: space.md },
  block: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  actions: { gap: space.sm },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.row },
});
