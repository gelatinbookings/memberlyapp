import { CalendarDays, Compass, House, User } from 'lucide-react-native';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton, tabBarStyles } from '@/components/navigation/TabBar';
import { CreateSheetProvider } from '@/features/create/CreateSheet';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/**
 * Four tabs for everyone: Home, Explore, Events, Me. Organizers reach Manage
 * from Me, under You organize. The Memberly Card is reached from Home and Me.
 */
export default function TabsLayout() {
  const c = useTheme();
  const insets = useSafeAreaInsets();

  return (
    // The Create sheet lives here, above every tab, so nothing under it can take it away while it is open.
    <CreateSheetProvider>
      <Tabs>
        <TabSlot />
        <TabList style={{ display: 'none' }}>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="explore" href="/explore" />
          <TabTrigger name="events" href="/events" />
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
          <TabTrigger name="me" asChild>
            <TabButton label="Me" Icon={User} />
          </TabTrigger>
        </View>
      </Tabs>
    </CreateSheetProvider>
  );
}
