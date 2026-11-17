import { useLocalSearchParams } from 'expo-router';

import { PassListScreen } from '@/features/passSetup/PassListScreen';

/** A community's passes, its memberships (Manage → Tiers, GEL-1057). */
export default function CommunityPassesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PassListScreen scope="community" parentId={id} />;
}
