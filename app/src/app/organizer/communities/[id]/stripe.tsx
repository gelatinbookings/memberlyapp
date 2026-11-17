import { useLocalSearchParams } from 'expo-router';

import { StripeConnectScreen } from '@/features/payouts/StripeConnectScreen';

/** Connect Stripe for a community's payouts, over the screen that asked for it. */
export default function StripeConnectRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StripeConnectScreen communityId={id} />;
}
