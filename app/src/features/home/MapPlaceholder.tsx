import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { MemberEvent } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { font, radius } from '@/theme/tokens';

/**
 * Stand-in for the map until a provider is chosen. Draws a few streets and
 * the numbered event pins at each event's sample position.
 */
export function MapPlaceholder({ events, height }: { events: MemberEvent[]; height: number }) {
  const c = useTheme();
  const streets = [
    { top: '26%', rotate: '-12deg' },
    { top: '52%', rotate: '8deg' },
    { top: '78%', rotate: '-20deg' },
  ] as const;
  const avenues = [
    { left: '30%', rotate: '14deg' },
    { left: '66%', rotate: '-6deg' },
  ] as const;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Map of tonight's events, ${events.length} pins. Map is a placeholder.`}
      style={[styles.map, { height, backgroundColor: c.mapGround }]}>
      {streets.map((s, i) => (
        <View key={`s${i}`} style={[styles.street, { top: s.top, backgroundColor: c.mapLine, transform: [{ rotate: s.rotate }] }]} />
      ))}
      {avenues.map((a, i) => (
        <View key={`a${i}`} style={[styles.avenue, { left: a.left, backgroundColor: c.mapLine, transform: [{ rotate: a.rotate }] }]} />
      ))}
      <View style={[styles.block, { top: '38%', left: '44%', backgroundColor: c.card }]} />
      <View style={[styles.block, { top: '60%', left: '12%', width: 90, backgroundColor: c.card }]} />
      {events.map((e, i) => (
        <View
          key={e.id}
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.pin, { left: `${e.mapPin.x * 100}%`, top: `${e.mapPin.y * 100}%`, backgroundColor: c.brand }]}>
          <View style={styles.pinNumber}>
            <Text style={[styles.pinNumberText, { color: c.brand }]}>{i + 1}</Text>
          </View>
          <Text variant="helper" style={styles.pinLabel} numberOfLines={1}>
            {e.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  street: { position: 'absolute', left: '-10%', width: '120%', height: 2 },
  avenue: { position: 'absolute', top: '-10%', height: '120%', width: 2 },
  block: { position: 'absolute', width: 70, height: 50, borderRadius: 10 },
  pin: {
    position: 'absolute',
    height: 34,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    transform: [{ translateX: -17 }, { translateY: -17 }],
  },
  pinNumber: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinNumberText: { fontFamily: font.bold, fontSize: 11, lineHeight: 13 },
  pinLabel: { color: '#FFFFFF', fontFamily: font.bold },
});
