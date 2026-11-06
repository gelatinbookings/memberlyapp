import { CalendarDays, Compass, House, LayoutGrid, User } from 'lucide-react-native';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton, tabBarStyles } from '@/components/navigation/TabBar';
import { useViewer } from '@/data/RepositoryProvider';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/**
 * Members see four tabs: Home, Explore, Events, Me. Organizers get a fifth,
 * Manage. The Memberly Card is reached from Home and Me, not from a tab.
 */
export default function TabsLayout() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { data: viewer } = useViewer();
  const isOrganizer = !!viewer?.roles.includes('organizer');

  return (
    <Tabs>
      <TabSlot />
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="events" href="/events" />
        {isOrganizer ? <TabTrigger name="manage" href="/manage" /> : null}
        <TabTrigger name="me" href="/me" />
      </TabList>
      <View
        accessibilityRole="tablist"
        style={[
          tabBarStyles.bar,
          { bottom: Math.max(insets.bottom, space.md), backgroundColor: c.card, borderColor: c.border },
        ]}>
        <TabTrigger name="index" asChild>
          <TabButton label="Home" Icon={House} />
        </TabTrigger>
        <TabTrigger name="explore" asChild>
          <TabButton label="Explore" Icon={Compass} />
        </TabTrigger>
        <TabTrigger name="events" asChild>
          <TabButton label="Events" Icon={CalendarDays} />
        </TabTrigger>
        {isOrganizer ? (
          <TabTrigger name="manage" asChild>
            <TabButton label="Manage" Icon={LayoutGrid} />
          </TabTrigger>
        ) : null}
        <TabTrigger name="me" asChild>
          <TabButton label="Me" Icon={User} />
        </TabTrigger>
      </View>
    </Tabs>
  );
}
