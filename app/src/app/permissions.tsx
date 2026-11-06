import { useState } from 'react';
import { Image } from 'expo-image';
import { ArrowRight, Bell, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, GroupedList, Screen, Text, Toggle } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { requestOsPermissions } from '@/features/permissions/requestPermissions';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

const faces = [
  require('@/assets/images/cover-warehouse.jpg'),
  require('@/assets/images/cover-rooftop.jpg'),
  require('@/assets/images/cover-dinner.jpg'),
];

function PermissionRow({
  icon,
  title,
  reason,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  reason: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: c.muted }]}>{icon}</View>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="helper" tone="muted">
          {reason}
        </Text>
      </View>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={`${title}: ${reason}`} />
    </View>
  );
}

/** Location and notifications (F1 step 6). Allow asks the OS in turn; Maybe later asks nothing. */
export default function PermissionsScreen() {
  const c = useTheme();
  const auth = useAuth();
  const [location, setLocation] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [busy, setBusy] = useState(false);

  const done = async (ask: boolean) => {
    setBusy(true);
    try {
      if (ask) await requestOsPermissions({ location, notifications });
      await auth.completeOnboarding(); // The gate then opens Home.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      testID="permissions"
      footer={
        <>
          <Button
            label="Allow & continue"
            loading={busy}
            trailingIcon={<ArrowRight size={18} color={c.onBrand} strokeWidth={2} />}
            onPress={() => done(true)}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Maybe later" disabled={busy} onPress={() => done(false)} style={styles.later}>
            <Text variant="bodyStrong" tone="muted">
              Maybe later
            </Text>
          </Pressable>
        </>
      }>
      <View style={styles.hero}>
        <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no">
          <View style={[styles.ring, { borderColor: c.border }]} />
          <View style={[styles.pin, { backgroundColor: c.tint, borderColor: c.brandLine }]}>
            <MapPin size={40} color={c.brandText} strokeWidth={2} />
          </View>
          <Image source={faces[0]} style={[styles.face, { left: 0, top: 30 }]} />
          <Image source={faces[1]} style={[styles.face, { right: 0, top: 10 }]} />
          <Image source={faces[2]} style={[styles.face, { right: 10, bottom: 10 }]} />
        </View>
        <View style={styles.head}>
          <Text variant="display" accessibilityRole="header" align="center">
            Get the most out of tonight
          </Text>
          <Text tone="muted" align="center">
            Both are optional. You can change them any time in Me.
          </Text>
        </View>
      </View>

      <GroupedList>
        <PermissionRow
          icon={<MapPin size={18} color={c.foreground} strokeWidth={2} />}
          title="Location"
          reason="Tonight’s events near you on the map"
          value={location}
          onChange={setLocation}
        />
        <PermissionRow
          icon={<Bell size={18} color={c.foreground} strokeWidth={2} />}
          title="Notifications"
          reason="Pass reminders, and when a DJ answers your offer"
          value={notifications}
          onChange={setNotifications}
        />
      </GroupedList>
    </Screen>
  );
}

const ART = 200;

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  art: { width: ART, height: ART },
  ring: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.pill, borderWidth: 1, borderStyle: 'dashed' },
  pin: {
    position: 'absolute',
    left: ART / 2 - 56,
    top: ART / 2 - 56,
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: { position: 'absolute', width: 44, height: 44, borderRadius: radius.pill },
  head: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, padding: space.card },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  later: { minHeight: size.minTarget, alignItems: 'center', justifyContent: 'center' },
});
