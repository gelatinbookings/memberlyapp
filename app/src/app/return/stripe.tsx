import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spinner } from '@/components/ui';
import { useTheme } from '@/theme/theme';

/**
 * Where Stripe sends the organizer after onboarding: memberly://return/stripe.
 * Normally the in-app browser catches this link and closes itself. If the app
 * was closed meanwhile, the link lands here: read everything again and open
 * Manage, which shows whether Stripe is connected.
 */
export default function StripeReturnRoute() {
  const c = useTheme();
  const qc = useQueryClient();
  useEffect(() => {
    qc.invalidateQueries();
    router.replace('/manage');
  }, [qc]);
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Spinner />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
