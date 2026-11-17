import { ArrowRight, ArrowUpRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Notice, OverlaySheet, Text } from '@/components/ui';
import type { Booking } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { font, radius, space } from '@/theme/tokens';

import { CONTINUE_TITLE, continueBody, handoffSummary, LINK_EXPIRED, OPEN_FAILED, OPEN_IN_GELATIN, OPEN_NOTE } from './copy';
import type { HandoffProblem } from './useGelatinHandoff';

/**
 * Continue in Gelatin (GEL-1024, the Portal board): says where the organizer
 * is going and how they get back, then opens Gelatin. The launch is asked for
 * when Open in Gelatin is tapped, never when this sheet opens.
 */
export function ContinueInGelatinSheet({
  booking,
  eventName,
  opening,
  problem,
  onOpen,
  onClose,
}: {
  booking: Booking;
  eventName: string;
  opening: boolean;
  problem: HandoffProblem;
  onOpen: () => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const dj = booking.dj;
  return (
    <OverlaySheet visible onClose={onClose} testID="continue-in-gelatin" accessibilityLabel={CONTINUE_TITLE}>
      <View style={styles.marks} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.mark, { backgroundColor: c.brand, borderColor: c.brand }]}>
          <Text style={[styles.letter, { color: c.onBrand }]}>M</Text>
        </View>
        <ArrowRight size={20} color={c.mutedText} strokeWidth={2} />
        <View style={[styles.mark, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.letter, { color: c.foreground }]}>G</Text>
        </View>
      </View>
      <View style={styles.text}>
        <Text variant="headline" accessibilityRole="header" style={styles.title}>
          {CONTINUE_TITLE}
        </Text>
        <Text tone="muted">{continueBody(dj.name)}</Text>
      </View>
      <View style={[styles.booking, { borderColor: c.border, backgroundColor: c.card }]} testID="handoff-booking">
        <Avatar source={dj.photo} initials={dj.initials} size={40} />
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {[dj.name, eventName].filter(Boolean).join(' · ')}
          </Text>
          <Text variant="helper" tone="muted" numberOfLines={1}>
            {handoffSummary(booking)}
          </Text>
        </View>
      </View>
      {problem ? <Notice tone="error">{problem === 'expired' ? LINK_EXPIRED : OPEN_FAILED}</Notice> : null}
      <Button
        testID="open-in-gelatin"
        label={OPEN_IN_GELATIN}
        loading={opening}
        trailingIcon={<ArrowUpRight size={16} color={c.onBrand} strokeWidth={2} />}
        onPress={onOpen}
      />
      <Text variant="helper" tone="muted" align="center">
        {OPEN_NOTE}
      </Text>
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  marks: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  mark: { width: 44, height: 44, borderRadius: radius.notice, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: font.extrabold, fontSize: 20, lineHeight: 24 },
  text: { gap: space.sm },
  title: { fontSize: 22, lineHeight: 26 },
  booking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: space.row,
    paddingHorizontal: space.card,
  },
  flex: { flex: 1, minWidth: 0 },
});
