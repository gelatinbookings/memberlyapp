import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, size } from '@/theme/tokens';

/** 44×26 round switch, brand when on, 20px white knob. The hit area is the full 44px. */
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  testID,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={9}
      style={styles.hit}>
      <View style={[styles.track, { backgroundColor: value ? c.brand : c.muted, borderColor: value ? c.brand : c.border }]}>
        <View style={[styles.knob, { backgroundColor: c.onBrand, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: size.minTarget, justifyContent: 'center' },
  track: { width: 44, height: 26, borderRadius: radius.pill, borderWidth: 1, padding: 2, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: radius.pill },
});
