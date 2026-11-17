import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { GroupedList, Sheet, Text } from '@/components/ui';
import { useCities } from '@/data/RepositoryProvider';
import type { City } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/** Choose the city a community is based in. Closing it changes nothing. */
export function CitySheet({
  visible,
  selected,
  onPick,
  onClose,
}: {
  visible: boolean;
  selected: City | null;
  onPick: (city: City) => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const cities = useCities();
  return (
    <Sheet visible={visible} onClose={onClose} title="City" subtitle="Where your community meets." testID="city-sheet">
      <GroupedList>
        {(cities.data ?? []).map((city) => {
          const on = selected?.id === city.id;
          return (
            <Pressable
              key={city.id}
              testID={`city-${city.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${city.name}, ${city.region}`}
              onPress={() => onPick(city)}
              style={({ pressed }) => [styles.row, pressed ? { backgroundColor: c.muted } : null]}>
              <View style={styles.flex}>
                <Text variant="bodyStrong" tone={on ? 'brand' : 'default'}>
                  {city.name}, {city.region}
                </Text>
              </View>
              {on ? <Check size={18} color={c.brandText} strokeWidth={2} /> : null}
            </Pressable>
          );
        })}
      </GroupedList>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: space.row },
});
