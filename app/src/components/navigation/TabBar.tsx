import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { LucideProps } from 'lucide-react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, size } from '@/theme/tokens';

export type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  Icon: ComponentType<LucideProps>;
};

/**
 * One item of the floating tab bar. Active: a 50px tint pill with icon and
 * label, wider than the rest. Inactive: a muted icon only.
 */
export function TabButton({ label, Icon, isFocused, style: _style, ref: _ref, ...props }: TabButtonProps) {
  const c = useTheme();
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!isFocused }}
      style={[
        styles.item,
        { flex: isFocused ? 1.6 : 1 },
        isFocused ? { backgroundColor: c.tint } : null,
      ]}>
      <Icon size={isFocused ? 20 : 22} color={isFocused ? c.brandText : c.mutedText} strokeWidth={2} />
      {isFocused ? (
        <Text variant="secondaryStrong" tone="brand" numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const tabBarStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: size.tabBar,
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

const styles = StyleSheet.create({
  item: {
    height: size.tabActive,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
