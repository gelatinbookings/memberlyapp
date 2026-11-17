import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { GroupedList, Sheet, Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';


/** The countries the web offers first. */
export const COUNTRIES = ['United States', 'Canada', 'United Kingdom'] as const;

function OptionRow({ label, on, onPress, testID }: { label: string; on: boolean; onPress: () => void; testID: string }) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: c.muted } : null]}>
      <View style={styles.flex}>
        <Text variant="bodyStrong" tone={on ? 'brand' : 'default'}>
          {label}
        </Text>
      </View>
      {on ? <Check size={18} color={c.brandText} strokeWidth={2} /> : null}
    </Pressable>
  );
}

/** Choose the country a community operates in. Closing it changes nothing. */
export function CountrySheet({
  visible,
  selected,
  onPick,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onPick: (country: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Country" subtitle="Where your community operates." testID="country-sheet">
      <GroupedList>
        {COUNTRIES.map((name) => (
          <OptionRow key={name} testID={`country-${name}`} label={name} on={selected === name} onPress={() => onPick(name)} />
        ))}
      </GroupedList>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: space.row },
});
