import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { IconButton } from './IconButton';
import { Text } from './Text';

/**
 * A pushed screen's header: round back button, 20px title, one muted line,
 * and an optional round action on the right. No eyebrow.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  subtitleLines = 1,
}: {
  title: string;
  subtitle?: string;
  /** Shows the round back button before the title. */
  onBack?: () => void;
  /** Round actions on the right of the title, such as Edit or Add more talent. */
  right?: ReactNode;
  /** Lines the subtitle may take before it is cut; 2 for a lineup summary with many parts. */
  subtitleLines?: number;
}) {
  const c = useTheme();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/manage')));
  return (
    <View style={styles.row}>
      <IconButton accessibilityLabel="Back" icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />} onPress={back} />
      <View style={styles.titles}>
        <Text variant="headline" accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" tone="muted" numberOfLines={subtitleLines}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  titles: { flex: 1, minWidth: 0 },
});
