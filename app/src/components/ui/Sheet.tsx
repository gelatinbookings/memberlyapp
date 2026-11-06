import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { BottomSheetFrame } from './BottomSheetFrame';
import { Text } from './Text';

/**
 * A bottom sheet over the current screen. The screen behind reads at 35%
 * (a 65% black dim), the sheet sits on the black ground with its 1px border.
 * Tapping the dimmed screen or the system back closes it.
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID={testID}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]}
        />
        <BottomSheetFrame style={styles.sheet}>
          <View style={styles.head}>
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%' },
  head: { gap: space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.row },
  title: { flex: 1 },
});
