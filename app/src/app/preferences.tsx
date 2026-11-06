import { useLocalSearchParams } from 'expo-router';

import { PreferencesView } from '@/features/preferences/PreferencesView';

/** Onboarding step 5 (F1), and Me → Preferences with `?edit=1`. */
export default function PreferencesScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  return <PreferencesView editing={edit === '1'} />;
}
