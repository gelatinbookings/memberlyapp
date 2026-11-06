import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  ErrorState,
  GroupedList,
  Screen,
  ScreenHeader,
  SelectField,
  Sheet,
  Text,
  TextField,
} from '@/components/ui';
import { useCities, useRepository } from '@/data/RepositoryProvider';
import {
  formatWallTime,
  halfHourSlots,
  isoDateInZone,
  timeHelper,
  timeZoneName,
  type WallTime,
} from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { size, space } from '@/theme/tokens';

import { useEventDraft } from './EventDraftProvider';
import { MonthCalendar } from './MonthCalendar';

const SLOTS = halfHourSlots();
const CHIP_ROW = size.chip + space.sm;
const FALLBACK_ZONE = 'America/New_York';

const done = () => (router.canGoBack() ? router.back() : router.replace('/manage'));

/** Pick a time on the half hour. Wall-clock at the venue; the zone never comes from the phone. */
function TimeSheet({
  which,
  value,
  start,
  zone,
  onPick,
  onClose,
}: {
  which: 'Starts' | 'Ends' | null;
  value: WallTime | null;
  /** For Ends: list from just after the start, so past-midnight times follow on. */
  start: WallTime | null;
  zone: string | null;
  onPick: (t: WallTime) => void;
  onClose: () => void;
}) {
  const from = which === 'Ends' && start ? (SLOTS.indexOf(start) + 1) % SLOTS.length : 0;
  const slots = [...SLOTS.slice(from), ...SLOTS.slice(0, from)];
  // Open near the chosen time; Starts opens at 6 PM by default.
  const index = slots.indexOf(value ?? (which === 'Ends' && start ? slots[0] : '18:00'));
  const offset = Math.max(0, Math.floor(index / 4) - 1) * CHIP_ROW;
  return (
    <Sheet
      visible={which != null}
      onClose={onClose}
      title={which ?? ''}
      subtitle={zone ? `${timeZoneName(zone)}, from the venue` : 'In the venue’s time zone'}>
      <ScrollView style={styles.slots} contentOffset={{ x: 0, y: offset }} showsVerticalScrollIndicator={false}>
        <View style={styles.slotGrid}>
          {slots.map((t) => (
            <Chip
              key={t}
              testID={`time-${t}`}
              label={formatWallTime(t)}
              selected={t === value}
              style={styles.slot}
              onPress={() => onPick(t)}
            />
          ))}
        </View>
      </ScrollView>
    </Sheet>
  );
}

/**
 * Date & time and Location for the open draft (the "Date, time and place"
 * board). Times are stored as the venue's wall clock with its IANA zone.
 */
export function WhenWhereScreen() {
  const c = useTheme();
  const repo = useRepository();
  const cities = useCities();
  const { draft, update } = useEventDraft();
  const [timeSheet, setTimeSheet] = useState<'Starts' | 'Ends' | null>(null);
  const [citySheet, setCitySheet] = useState(false);

  if (!draft) {
    return (
      <Screen>
        <ScreenHeader title="Date & time" />
        <ErrorState title="No event open" detail="Open Create New Event from Manage first." />
      </Screen>
    );
  }
  const f = draft.fields;
  const zone = f.city?.timeZone ?? null;
  const today = isoDateInZone(repo.now(), zone ?? FALLBACK_ZONE);

  return (
    <Screen footer={<Button testID="when-done" label="Done" onPress={done} />} contentStyle={styles.content}>
      <ScreenHeader title="Date & time" subtitle={f.name.trim() || 'New event'} />
      <MonthCalendar selected={f.date} today={today} onSelect={(date) => update({ date })} />

      <View style={styles.timesBlock}>
        <View style={styles.times}>
          <SelectField
            testID="field-starts"
            label="Starts"
            strong
            value={f.startTime ? formatWallTime(f.startTime) : null}
            placeholder="Add"
            onPress={() => setTimeSheet('Starts')}
            style={styles.flex}
          />
          <SelectField
            testID="field-ends"
            label="Ends"
            strong
            value={f.endTime ? formatWallTime(f.endTime) : null}
            placeholder="Add"
            onPress={() => setTimeSheet('Ends')}
            style={styles.flex}
          />
        </View>
        <Text variant="helper" tone="muted" testID="time-helper">
          {timeHelper(zone, f.startTime, f.endTime)}
        </Text>
      </View>

      <View style={styles.location}>
        <Text variant="title" accessibilityRole="header">
          Location
        </Text>
        <TextField
          testID="field-venue"
          label="Venue"
          value={f.venue}
          placeholder="Where it happens"
          maxLength={120}
          onChangeText={(venue) => update({ venue })}
        />
        <SelectField
          testID="field-city"
          label="City"
          value={f.city ? `${f.city.name}, ${f.city.region}` : null}
          placeholder="Choose a city"
          onPress={() => setCitySheet(true)}
        />
        <Text variant="helper" tone="muted">
          The city and date decide which DJs you can book in Lineup.
        </Text>
      </View>

      <TimeSheet
        which={timeSheet}
        value={timeSheet === 'Ends' ? f.endTime : f.startTime}
        start={f.startTime}
        zone={zone}
        onClose={() => setTimeSheet(null)}
        onPick={(t) => {
          update(timeSheet === 'Ends' ? { endTime: t } : { startTime: t });
          setTimeSheet(null);
        }}
      />
      <Sheet
        visible={citySheet}
        onClose={() => setCitySheet(false)}
        title="City"
        subtitle="Event times follow the venue’s time zone.">
        <GroupedList>
          {(cities.data ?? []).map((city) => {
            const selected = f.city?.id === city.id;
            return (
              <Pressable
                key={city.id}
                testID={`city-${city.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${city.name}, ${city.region}, ${timeZoneName(city.timeZone)}`}
                onPress={() => {
                  update({ city });
                  setCitySheet(false);
                }}
                style={({ pressed }) => [styles.cityRow, pressed ? { backgroundColor: c.muted } : null]}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong" tone={selected ? 'brand' : 'default'}>
                    {city.name}, {city.region}
                  </Text>
                  <Text variant="helper" tone="muted">
                    {timeZoneName(city.timeZone)}
                  </Text>
                </View>
                {selected ? <Check size={18} color={c.brandText} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
        </GroupedList>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  flex: { flex: 1 },
  timesBlock: { gap: space.sm },
  times: { flexDirection: 'row', gap: space.stack },
  location: { gap: space.stack },
  slots: { maxHeight: CHIP_ROW * 6 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  slot: { width: '23%', paddingHorizontal: 4 },
  cityRow: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: space.row },
});
