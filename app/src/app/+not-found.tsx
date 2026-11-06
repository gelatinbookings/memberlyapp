import { router } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        That page isn’t here
      </Text>
      <Text tone="muted">The link may be old, or the event may have ended.</Text>
      <Button label="Go to Home" onPress={() => router.replace('/')} />
    </Screen>
  );
}
