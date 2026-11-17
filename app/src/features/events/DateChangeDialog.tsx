import { ArrowUpRight } from 'lucide-react-native';
import { Modal, StyleSheet, View } from 'react-native';

import { Avatar, Button, StatusPill, Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { dateChangeCopy, MANAGE_IN_GELATIN, type DateChangeBlock } from './dateChange';

/**
 * The date-change dialogs (GEL-1025): a centred alert over the dimmed Date &
 * time screen. With a confirmed DJ it is the DateChangeAfter board. With open
 * offers it is the DateChangeBefore layout, saying the offers must be handled
 * in Gelatin first. Neither changes the date: the only ways out are keeping
 * it and, when a hold exists, Manage in Gelatin.
 */
export function DateChangeDialog({
  block,
  day,
  newDay,
  onKeep,
  onManage,
}: {
  block: DateChangeBlock;
  /** The event's current date, "Fri, Nov 20". */
  day: string;
  /** The date just picked, "Sat, Nov 21". */
  newDay: string;
  onKeep: () => void;
  /** Open the hand-off for `block.manage`. */
  onManage: () => void;
}) {
  const c = useTheme();
  const copy = dateChangeCopy(block, day, newDay);
  const lead = block.kind === 'confirmed' ? block.manage : null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKeep} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: c.dim }]}>
        <View
          testID="date-change-dialog"
          accessibilityViewIsModal
          accessibilityLabel={copy.label}
          style={[styles.dialog, { backgroundColor: c.card, borderColor: c.border }]}>
          {lead ? (
            <View style={styles.lead}>
              <Avatar source={lead.dj.photo} initials={lead.dj.initials} size={40} />
              <StatusPill status={lead.status} style={styles.pill} />
            </View>
          ) : null}
          <Text variant="headline" accessibilityRole="header">
            {copy.title}
          </Text>
          {copy.body.map((line) => (
            <Text key={line} variant="secondary" tone="muted" style={styles.body}>
              {line}
            </Text>
          ))}
          <View style={styles.actions}>
            <Button testID="date-change-keep" label={copy.keep} variant="secondary" compact onPress={onKeep} style={styles.action} />
            {block.manage ? (
              <Button
                testID="date-change-manage"
                label={MANAGE_IN_GELATIN}
                compact
                trailingIcon={<ArrowUpRight size={14} color={c.onBrand} strokeWidth={2} />}
                onPress={onManage}
                style={styles.action}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingHorizontal: space.gutter },
  dialog: { borderWidth: 1, borderRadius: radius.card, padding: space.gutter, gap: space.card },
  lead: { flexDirection: 'row', alignItems: 'center', gap: space.stack },
  pill: { alignSelf: 'center' },
  body: { fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  // Tight side padding: "Manage in Gelatin" and its arrow fit at the full 14px beside "Keep Fri, Nov 20".
  action: { flex: 1, height: size.secondaryButton, paddingHorizontal: space.xs },
});
