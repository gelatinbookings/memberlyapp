import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, IconButton, Notice, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

const WHAT: Record<string, string> = {
  '3': 'Create New Event with the Lineup section: browse DJs from Gelatin, offer a fee, and see every booking status.',
  '4': 'The member screens beyond the shell: Memberly Card, preferences, passes and referrals.',
  '8': 'Live data through Memberly’s backend, in Gelatin’s test environment.',
};

/** A clearly labelled stop for flows that later milestones build. Dev builds only. */
export default function LaterScreen() {
  const c = useTheme();
  const { title, milestone, note } = useLocalSearchParams<{ title?: string; milestone?: string; note?: string }>();
  const m = milestone ?? '3';
  const what = note ?? WHAT[m];
  return (
    <Screen>
      <IconButton
        accessibilityLabel="Back"
        icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <View style={styles.block}>
        <Text variant="display" accessibilityRole="header">
          {title ?? 'Coming next'}
        </Text>
        <Text tone="muted">
          {m ? `Coming in M${m}. This screen arrives in milestone ${m} of the React Native build.` : 'Not native yet.'}
        </Text>
      </View>
      {what ? (
        <Notice tone="tint" title={m ? `Milestone ${m}:` : undefined}>
          {what}
        </Notice>
      ) : null}
      <Button label="Back" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
});
