import { Image } from 'expo-image';
import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, IconButton, Pill, SheetHandle, Text, useSwipeToClose } from '@/components/ui';
import type { Dj } from '@/data/types';
import { formatDraw, formatRate } from '@/features/booking/money';
import { useTheme } from '@/theme/theme';
import { font, radius, space } from '@/theme/tokens';

import { Attribution } from './BrowseStates';
import { spokenDraw, spokenRate } from './djLabel';

export const PRIVATE_RATE_HELPER = 'Make an offer and the DJ will accept, counter in Gelatin or pass.';

function Stat({ label, value, note, big, spoken }: { label: string; value: string; note?: string; big: boolean; spoken: string }) {
  const c = useTheme();
  return (
    <View accessible accessibilityLabel={spoken} style={[styles.stat, { borderColor: c.border, backgroundColor: c.card }]}>
      <Text variant="helper" tone="muted">
        {label}
      </Text>
      <Text variant={big ? 'money' : 'bodyStrong'} style={big ? styles.statValue : null}>
        {value}
      </Text>
      {note ? (
        <Text variant="helper" tone="muted" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * DJ profile (GEL-1014): a tall sheet with the large photo, name, tier,
 * genres, rate, draw and a short bio when the catalog has one. Add to lineup
 * adds and closes; once added the button removes. No contact details, booking
 * history or reviews.
 */
export function DjProfileSheet({
  dj,
  day,
  added,
  onAdd,
  onRemove,
  onClose,
}: {
  /** Null keeps the sheet closed. */
  dj: Dj | null;
  /** The event's night, e.g. "Fri, Nov 20". */
  day: string;
  added: boolean;
  onAdd: (dj: Dj) => void;
  onRemove: (dj: Dj) => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const swipe = useSwipeToClose(dj != null, onClose);
  return (
    <Modal visible={dj != null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID="dj-profile">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]}
        />
        {dj ? (
          <Animated.View
            style={[styles.sheet, { backgroundColor: c.background, borderColor: c.border, marginTop: insets.top + space.sm }, swipe.style]}>
            {/* The photo is the part to pull down by. */}
            <View
              {...swipe.grab}
              style={[styles.hero, dj.photo ? { backgroundColor: c.muted } : [styles.heroPlain, { backgroundColor: c.card }]]}>
              {dj.photo ? (
                <Image source={dj.photo} accessibilityLabel={dj.name} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
              ) : (
                <Avatar initials={dj.initials} size={112} accessibilityLabel={dj.name} />
              )}
              <View style={styles.handle}>
                <SheetHandle />
              </View>
              <View style={styles.heroBar}>
                <IconButton
                  accessibilityLabel="Close profile"
                  variant="scrim"
                  icon={<X size={18} color={c.onBrand} strokeWidth={2} />}
                  onPress={onClose}
                />
                <View style={[styles.open, { backgroundColor: c.scrim }]} accessible accessibilityLabel={`Open on ${day}`}>
                  <View style={[styles.dot, { backgroundColor: c.successText }]} />
                  <Text variant="helper" style={[styles.openText, { color: c.onBrand }]}>
                    Open {day}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.panel, { backgroundColor: c.background }]}>
              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.head}>
                  <View style={styles.flex}>
                    <Text variant="display" accessibilityRole="header">
                      {dj.name}
                    </Text>
                    <Text variant="secondary" tone="muted" style={styles.genres}>
                      {dj.genres.join(' · ')}
                    </Text>
                  </View>
                  <Pill label={dj.tier} tone="held" style={styles.tier} />
                </View>
                <View style={styles.stats}>
                  {dj.publishedRateCents == null ? (
                    <Stat label="Rate" value={formatRate(dj.publishedRateCents)} big={false} spoken="Private rate" />
                  ) : (
                    <Stat
                      label="Published rate"
                      value={formatRate(dj.publishedRateCents)}
                      note="You can offer any fee"
                      big
                      spoken={`Published rate, ${spokenRate(dj)}. You can offer any fee`}
                    />
                  )}
                  {dj.draw ? (
                    <Stat
                      label="Draw, last 90 days"
                      value={String(dj.draw.average)}
                      note={`${dj.draw.min}–${dj.draw.max}, venue-confirmed`}
                      big
                      spoken={`Draw over the last 90 days: ${spokenDraw(dj)}, average ${dj.draw.average}, venue-confirmed`}
                    />
                  ) : (
                    <Stat label="Draw, last 90 days" value={formatDraw(dj.draw)} big={false} spoken={formatDraw(dj.draw)} />
                  )}
                </View>
                {dj.publishedRateCents == null ? (
                  <Text variant="secondary" tone="muted" testID="private-rate-helper">
                    {PRIVATE_RATE_HELPER}
                  </Text>
                ) : null}
                {dj.bio ? <Text tone="muted">{dj.bio}</Text> : null}
              </ScrollView>
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
                {added ? (
                  <Button
                    testID="profile-toggle"
                    variant="secondary"
                    label="Added"
                    trailingIcon={<Check size={18} color={c.brandText} strokeWidth={2.5} />}
                    accessibilityHint={`Removes ${dj.name} from your lineup`}
                    onPress={() => onRemove(dj)}
                  />
                ) : (
                  <Button testID="profile-toggle" label="Add to lineup" onPress={() => onAdd(dj)} />
                )}
                <Attribution />
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const HERO = 300;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  hero: { height: HERO, alignItems: 'center', justifyContent: 'center' },
  // No photo: a shorter head with the initials, clear of the buttons above and the panel below.
  heroPlain: { height: 248, paddingTop: space.gutter + space.sm },
  handle: { position: 'absolute', top: 10, left: 0, right: 0 },
  heroBar: {
    position: 'absolute',
    top: space.gutter + space.sm,
    left: space.gutter,
    right: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  open: { height: 36, paddingHorizontal: space.row, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: space.label },
  openText: { fontFamily: font.semibold },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  // The panel rides up over the photo with the sheet's own radius, as on the board.
  panel: { flex: 1, marginTop: -radius.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
  content: { paddingHorizontal: space.gutter, paddingTop: space.gutter + 2, paddingBottom: space.md, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  genres: { marginTop: space.xs },
  tier: { marginTop: space.label, paddingHorizontal: 10, paddingVertical: 6 },
  stats: { flexDirection: 'row', gap: space.stack },
  stat: { flex: 1, borderWidth: 1, borderRadius: radius.card, padding: space.row, gap: 2 },
  statValue: { fontSize: 22, lineHeight: 26 },
  footer: { paddingHorizontal: space.gutter, paddingTop: space.row, gap: space.sm },
});
