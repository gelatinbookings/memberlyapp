import { ChevronDown } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { Text } from './Text';

/** A field that opens a picker sheet (a time, a city). Same box as TextField. */
export function SelectField({
  label,
  value,
  placeholder,
  onPress,
  strong = false,
  style,
  testID,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  /** 16px/600, for times. */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <Text variant="secondaryStrong">{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ?? placeholder}`}
        onPress={onPress}
        style={({ pressed }) => [styles.box, { borderColor: c.border, backgroundColor: pressed ? c.muted : c.card }]}>
        <Text variant={strong && value ? 'cardTitle' : 'body'} tone={value ? 'default' : 'muted'} numberOfLines={1} style={styles.value}>
          {value ?? placeholder}
        </Text>
        <ChevronDown size={16} color={c.mutedText} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.label },
  box: {
    height: size.field,
    borderRadius: radius.control,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  value: { flex: 1 },
});
