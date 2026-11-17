import { useLocalSearchParams } from 'expo-router';

import { MarketingScreen } from '@/features/members/MarketingScreen';

/** Manage → Marketing. */
export default function MarketingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MarketingScreen communityId={id} />;
}
