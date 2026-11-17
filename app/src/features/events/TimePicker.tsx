import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Button, Chip, Sheet, Text } from '@/components/ui';
import { addMinutes, durationLabel, endsNextMorning, formatWallTime, fromClock, timeZoneName, toClock, type WallTime } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

export type TimeEdge = 'start' | 'end';

const ROW = 44;
const VISIBLE = 5;
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 15, 30, 45];
const PERIODS = ['AM', 'PM'];

/** A start nobody has picked yet opens here; an end opens four hours after the start. */
export const DEFAULT_START: WallTime = '20:00';
export const DEFAULT_LENGTH_MIN = 240;
/** One tap for the usual nights out. */
export const START_PICKS: WallTime[] = ['18:00', '19:00', '20:00', '21:00', '22:00'];
/** How long it runs, from the start. */
export const LENGTH_PICKS = [120, 180, 240, 300, 360];

/** The nearest quarter hour, so a saved 10:20 still lands on the wheel. */
function snap(time: WallTime): WallTime {
  const { hour, minute, pm } = toClock(time);
  const q = Math.round(minute / 15) * 15;
  return q === 60 ? addMinutes(fromClock(hour, 0, pm), 60) : fromClock(hour, q, pm);
}

/**
 * One wheel: scroll and it settles on a row, tap a row to jump to it.
 * Screen readers get it as an adjustable control (swipe up or down).
 */
function Wheel({
  label,
  items,
  index,
  onIndex,
  testID,
}: {
  label: string;
  items: string[];
  index: number;
  onIndex: (i: number) => void;
  testID?: string;
}) {
  const c = useTheme();
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (i !== index) onIndex(i);
  };
  // Follow changes made elsewhere (a quick pick, the other wheel rolling past midnight).
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ROW, animated: true });
  }, [index]);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const next = e.nativeEvent.actionName === 'increment' ? index + 1 : index - 1;
        if (next >= 0 && next < items.length) onIndex(next);
      }}
      style={styles.wheel}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: index * ROW }}
        contentContainerStyle={{ paddingVertical: ROW * ((VISIBLE - 1) / 2) }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={(e) => {
          // A drag that stops dead has no momentum event; settle on it here.
          if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) settle(e);
        }}>
        {items.map((item, i) => (
          <Pressable key={item} onPress={() => onIndex(i)} style={styles.row} importantForAccessibility="no">
            <Text variant={i === index ? 'headline' : 'body'} tone={i === index ? 'default' : 'muted'}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={[styles.band, { borderColor: c.border }]} />
    </View>
  );
}

/** Hour, minute and AM/PM wheels for one wall time, on the quarter hour. */
export function TimeWheel({ value, onChange, edge }: { value: WallTime; onChange: (t: WallTime) => void; edge: TimeEdge }) {
  const { hour, minute, pm } = toClock(value);
  const name = edge === 'start' ? 'Start' : 'End';
  return (
    <View style={styles.wheels}>
      <Wheel
        testID={`${edge}-hour`}
        label={`${name} hour`}
        items={HOURS.map(String)}
        index={HOURS.indexOf(hour)}
        onIndex={(i) => onChange(fromClock(HOURS[i], minute, pm))}
      />
      <Text variant="headline" tone="muted">
        :
      </Text>
      <Wheel
        testID={`${edge}-minute`}
        label={`${name} minutes`}
        items={MINUTES.map((m) => String(m).padStart(2, '0'))}
        index={Math.max(0, MINUTES.indexOf(minute))}
        onIndex={(i) => onChange(fromClock(hour, MINUTES[i], pm))}
      />
      <Wheel
        testID={`${edge}-period`}
        label={`${name} AM or PM`}
        items={PERIODS}
        index={pm ? 1 : 0}
        onIndex={(i) => onChange(fromClock(hour, minute, i === 1))}
      />
    </View>
  );
}

function EdgeTab({ label, value, active, onPress, testID }: { label: string; value: string; active: boolean; onPress: () => void; testID: string }) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${value}`}
      onPress={onPress}
      style={[styles.tab, { borderColor: active ? c.brandLine : c.border, backgroundColor: active ? c.tint : c.card }]}>
      <Text variant="helper" tone={active ? 'brand' : 'muted'}>
        {label}
      </Text>
      <Text variant="cardTitle">{value}</Text>
    </Pressable>
  );
}

const lengthLabel = (min: number) => (min < 60 ? `${min} min` : min === 60 ? '1 hr' : `${min / 60} hrs`);

/**
 * Start and end together in one sheet: two tabs on top (each showing its time),
 * wheels for the one being set, quick picks under them, and the length of the
 * night in words. An end opens four hours after the start; ends at or before
 * the start are the next morning. Done saves both. Give it a `key` that
 * changes per opening, so each one starts from the saved times.
 */
export function TimesSheet({
  visible,
  edge: openedOn,
  start,
  end,
  zone,
  onDone,
  onClose,
  title = 'Event time',
  startPicks = START_PICKS,
  lengthPicks = LENGTH_PICKS,
  testID = 'times-sheet',
}: {
  /** "Event time", or "Set time" for a DJ's set. */
  title?: string;
  /** One-tap starts; the event's usual start times by default. */
  startPicks?: WallTime[];
  /** One-tap lengths in minutes, counted from the start. */
  lengthPicks?: number[];
  testID?: string;
  visible: boolean;
  /** Which tab it opens on: the field that was tapped. */
  edge: TimeEdge;
  start: WallTime | null;
  end: WallTime | null;
  zone: string | null;
  onDone: (times: { start: WallTime; end: WallTime }) => void;
  onClose: () => void;
}) {
  const [edge, setEdge] = useState<TimeEdge>(openedOn);
  const [from, setFrom] = useState<WallTime>(snap(start ?? DEFAULT_START));
  const [to, setTo] = useState<WallTime>(snap(end ?? addMinutes(start ?? DEFAULT_START, DEFAULT_LENGTH_MIN)));
  // The end follows the start until it is set on its own, so the length stays as it was.
  const [endTouched, setEndTouched] = useState(end != null);


  const setStart = (t: WallTime) => {
    if (!endTouched) setTo(addMinutes(t, DEFAULT_LENGTH_MIN));
    setFrom(t);
  };
  const setEnd = (t: WallTime) => {
    setEndTouched(true);
    setTo(t);
  };

  const length = durationLabel(from, to);
  const summary = [length, endsNextMorning(from, to) ? 'ends the next morning' : null, zone ? timeZoneName(zone) : null].filter(Boolean).join(' · ');

  return (
    <Sheet visible={visible} onClose={onClose} title={title} testID={testID}>
      <View style={styles.body}>
        <View style={styles.tabs} accessibilityRole="tablist">
          <EdgeTab testID="tab-start" label="Starts" value={formatWallTime(from)} active={edge === 'start'} onPress={() => setEdge('start')} />
          <EdgeTab testID="tab-end" label="Ends" value={formatWallTime(to)} active={edge === 'end'} onPress={() => setEdge('end')} />
        </View>

        {edge === 'start' ? <TimeWheel edge="start" value={from} onChange={setStart} /> : <TimeWheel edge="end" value={to} onChange={setEnd} />}

        <View style={styles.picks}>
          {edge === 'start'
            ? startPicks.map((t) => (
                <Chip key={t} testID={`pick-start-${t}`} label={formatWallTime(t).replace(':00', '')} selected={t === from} onPress={() => setStart(t)} />
              ))
            : lengthPicks.map((min) => {
                const t = addMinutes(from, min);
                return (
                  <Chip
                    key={min}
                    testID={`pick-length-${min}`}
                    label={lengthLabel(min)}
                    accessibilityLabel={`${lengthLabel(min)}, ends ${formatWallTime(t)}`}
                    selected={t === to}
                    onPress={() => setEnd(t)}
                  />
                );
              })}
        </View>

        <Text variant="secondary" tone="muted" align="center" testID="times-summary">
          {summary}
        </Text>
        <Button testID="times-done" label="Done" onPress={() => onDone({ start: from, end: to })} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: space.md, paddingTop: space.sm },
  tabs: { flexDirection: 'row', gap: space.stack },
  tab: { flex: 1, borderWidth: 1, borderRadius: radius.control, paddingVertical: space.sm, paddingHorizontal: 14, gap: 2 },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  wheel: { width: 72, height: ROW * VISIBLE },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, top: ROW * ((VISIBLE - 1) / 2), height: ROW, borderTopWidth: 1, borderBottomWidth: 1 },
  picks: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
});
