import { useLocalSearchParams } from 'expo-router';

import { MembersScreen } from '@/features/members/MembersScreen';

/** Manage → Members. */
export default function MembersRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MembersScreen communityId={id} />;
}
