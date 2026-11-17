import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  ErrorState,
  GroupedList,
  Notice,
  Screen,
  ScreenHeader,
  SelectField,
  Sheet,
  Text,
} from '@/components/ui';
import { useCities, useDraftOffers, useEventBookings, useOrganizerEvent, useRepository } from '@/data/RepositoryProvider';
import type { Booking } from '@/data/types';
import {
  formatIsoDate,
  formatWallTime,
  isoDateInZone,
  timeHelper,
  timeZoneName,
} from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { recheckNotice } from './dateChange';
import { DateChangeHost, useDateChangeGuard } from './DateChangeGuard';
import { useEventDraft } from './EventDraftProvider';
import { MonthCalendar } from './MonthCalendar';
import { RepeatChips } from './RepeatChips';
import { TimesSheet, type TimeEdge } from './TimePicker';
import { VenueField } from './VenueField';

const FALLBACK_ZONE = 'America/New_York';
const NO_BOOKINGS: Booking[] = [];

const done = () => (router.canGoBack() ? router.back() : router.replace('/manage'));

/**
 * Date & time and Location for the open draft (the "Date, time and place"
 * board). Times are stored as the venue's wall clock with its IANA zone.
 *
 * On a saved event with bookings the date is guarded (GEL-1025): a confirmed
 * DJ or an open offer keeps the event on its date, a dialog says why, and the
 * way forward is Gelatin. DJs added but not sent do not hold the date.
 */
export function WhenWhereScreen() {
  const c = useTheme();
  const repo = useRepository();
  const cities = useCities();
  const { draft, update } = useEventDraft();
  const [timeSheet, setTimeSheet] = useState<TimeEdge | null>(null);
  const [citySheet, setCitySheet] = useState(false);
  // The saved event behind this draft, and what is booked on it.
  const savedId = draft && draft.key !== 'new' ? draft.key : undefined;
  const stored = useOrganizerEvent(savedId);
  const bookings = useEventBookings(savedId);
  const added = useDraftOffers(savedId);
  const storedDate = stored.data?.date ?? null;
  const guard = useDateChangeGuard({
    eventId: savedId,
    eventName: draft?.fields.name.trim() || 'New event',
    storedDate,
    bookings: bookings.data ?? NO_BOOKINGS,
  });

  if (!draft) {
    return (
      <Screen header={<ScreenHeader title="Date & time" />}>
        <ErrorState title="No event open" detail="Open Create New Event from Manage first." />
      </Screen>
    );
  }
  const f = draft.fields;
  const zone = f.city?.timeZone ?? null;
  const today = isoDateInZone(repo.now(), zone ?? FALLBACK_ZONE);
  const addedCount = added.data?.length ?? 0;
  const moved = !!savedId && !!storedDate && !!f.date && f.date !== storedDate;

  return (
    <View style={styles.fill}>
    <Screen
      header={<ScreenHeader title="Date & time" subtitle={f.name.trim() || 'New event'} />}
      footer={<Button testID="when-done" label="Done" onPress={done} />}
      contentStyle={styles.content}>
      <MonthCalendar
        selected={f.date}
        today={today}
        onSelect={(date) => {
          // A booking can hold the event to its date; the guard says so and the date stays.
          if (guard.allow(date)) update({ date });
        }}
      />
      {moved && addedCount > 0 && f.date ? <Notice>{recheckNotice(addedCount, formatIsoDate(f.date))}</Notice> : null}

      <View style={styles.timesBlock}>
        <View style={styles.times}>
          <SelectField
            testID="field-starts"
            label="Starts"
            strong
            value={f.startTime ? formatWallTime(f.startTime) : null}
            placeholder="Add"
            onPress={() => setTimeSheet('start')}
            style={styles.flex}
          />
          <SelectField
            testID="field-ends"
            label="Ends"
            strong
            value={f.endTime ? formatWallTime(f.endTime) : null}
            placeholder="Add"
            onPress={() => setTimeSheet('end')}
            style={styles.flex}
          />
        </View>
        <Text variant="helper" tone="muted" testID="time-helper">
          {timeHelper(zone, f.startTime, f.endTime)}
        </Text>
        <RepeatChips date={f.date} value={f.recurrence ?? null} onChange={(recurrence) => update({ recurrence })} />
      </View>

      <View style={styles.location}>
        <Text variant="title" accessibilityRole="header">
          Location
        </Text>
        <VenueField
          value={f.venue}
          place={f.place ?? null}
          onChangeText={(venue) => update({ venue })}
          // A recognized venue brings its address and city, and the city its time zone.
          onPick={(place) => update({ venue: place.name, place, city: place.city })}
          onClear={() => update({ place: null })}
        />
        {f.place ? null : (
          <SelectField
            testID="field-city"
            label="City"
            value={f.city ? `${f.city.name}, ${f.city.region}` : null}
            placeholder="Choose a city"
            onPress={() => setCitySheet(true)}
          />
        )}
        <Text variant="helper" tone="muted">
          The city and date decide which DJs you can book in Lineup.
        </Text>
      </View>

      <TimesSheet
        key={timeSheet ?? 'closed'}
        visible={timeSheet != null}
        edge={timeSheet ?? 'start'}
        start={f.startTime}
        end={f.endTime}
        zone={zone}
        onClose={() => setTimeSheet(null)}
        onDone={({ start, end }) => {
          update({ startTime: start, endTime: end });
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
    <DateChangeHost guard={guard} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: 18 },
  flex: { flex: 1 },
  timesBlock: { gap: space.sm },
  times: { flexDirection: 'row', gap: space.stack },
  location: { gap: space.stack },
  cityRow: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: space.row },
});
