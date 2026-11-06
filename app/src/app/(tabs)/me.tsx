import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CalendarDays, Gift, LogOut, Moon, QrCode, SlidersHorizontal, Wrench } from 'lucide-react-native';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar, Card, ErrorState, GroupedList, ListRow, PillButton, Screen, SectionHeader, Skeleton, Text } from '@/components/ui';
import { useMyEvents, useOrganizedCommunities, usePreferences, useViewer } from '@/data/RepositoryProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { LATER } from '@/features/navigation/later';
import { countPicked } from '@/features/preferences/steps';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** Not native yet: the labelled stop for the web page. */
function onWeb(title: string) {
  router.push({ pathname: '/later', params: { title, milestone: LATER.web.milestone, note: LATER.web.note } });
}

export default function MeScreen() {
  const c = useTheme();
  const viewer = useViewer();
  const organized = useOrganizedCommunities();
  const preferences = usePreferences();
  const upcoming = useMyEvents('upcoming');
  const auth = useAuth();
  const v = viewer.data;
  const passes = (upcoming.data ?? []).filter((e) => e.relation === 'pass').length;

  const confirmSignOut = () =>
    Alert.alert('Sign out of Memberly?', 'You’ll sign back in with a code sent to your email.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => auth.signOut() },
    ]);
  const icon = (I: typeof Gift) => <I size={18} color={c.foreground} strokeWidth={2} />;

  return (
    <Screen tabs>
      {viewer.isPending ? (
        <View style={styles.profile}>
          <Skeleton height={64} width={64} round />
          <View style={styles.flex}>
            <Skeleton height={20} width="60%" round />
          </View>
        </View>
      ) : null}
      {viewer.isError ? <ErrorState title="Couldn’t load your profile" onRetry={() => viewer.refetch()} /> : null}
      {v ? (
        <View style={styles.profile}>
          <Avatar initials={v.initials} size={64} accessibilityLabel={`${v.firstName} ${v.lastName}`} />
          <View style={styles.flex}>
            <Text variant="headline" accessibilityRole="header">
              {v.firstName} {v.lastName}
            </Text>
            <Text variant="secondary" tone="muted" numberOfLines={1}>
              {v.email}
            </Text>
          </View>
          <PillButton label="Edit" onPress={() => onWeb('Edit profile')} />
        </View>
      ) : null}

      <GroupedList>
        <ListRow
          label="Preferences"
          value={preferences.data ? `${countPicked(preferences.data)} picked` : undefined}
          icon={icon(SlidersHorizontal)}
          onPress={() => router.push({ pathname: '/preferences', params: { edit: '1' } })}
        />
        <ListRow label="My Memberly Card" value={v ? `${v.communityCount} active` : undefined} icon={icon(QrCode)} onPress={() => router.push('/card')} />
        <ListRow
          label="Upcoming events"
          value={upcoming.data ? `${passes} ${passes === 1 ? 'pass' : 'passes'}` : undefined}
          icon={icon(CalendarDays)}
          onPress={() => router.push('/events')}
        />
        <ListRow label="Referrals" value="Earn 10%" icon={icon(Gift)} onPress={() => onWeb('Referrals')} />
      </GroupedList>

      {(organized.data ?? []).length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="You organize" />
          {(organized.data ?? []).map((community) => (
            <Card key={community.id} selected padding={12} style={styles.organize}>
              <Image source={community.cover} style={styles.cover} contentFit="cover" />
              <View style={styles.flex}>
                <Text variant="cardTitle" numberOfLines={1}>
                  {community.name}
                </Text>
                <Text variant="helper" tone="brand">
                  Owner · {community.memberCount.toLocaleString('en-US')} members
                </Text>
              </View>
              <PillButton label="Manage" filled onPress={() => router.push('/manage')} />
            </Card>
          ))}
        </View>
      ) : null}

      <GroupedList>
        <ListRow label="Appearance" value="Dark" icon={icon(Moon)} />
        {__DEV__ ? <ListRow label="Parts kit" value="Dev only" icon={icon(Wrench)} onPress={() => router.push('/kit')} /> : null}
        <ListRow
          label="Sign out"
          tone="error"
          icon={<LogOut size={18} color={c.errorText} strokeWidth={2} />}
          chevron={false}
          onPress={confirmSignOut}
        />
      </GroupedList>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  section: { gap: space.stack },
  organize: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  cover: { width: 44, height: 44, borderRadius: radius.notice },
});
