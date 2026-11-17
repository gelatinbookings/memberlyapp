import { Building2, MapPin, PencilLine, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { IconButton, Pill, Spinner, Text, TextField, useScrollIntoView } from '@/components/ui';
import { useVenueSearch } from '@/data/RepositoryProvider';
import { venueAddress } from '@/data/sampleVenues';
import type { Venue } from '@/data/types';
import { timeZoneName } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** Waits this long after the last keystroke before searching. */
export const VENUE_SEARCH_DEBOUNCE_MS = 250;
export const VENUE_PLACEHOLDER = 'Search a venue name or address';
export const VENUE_NO_MATCH = 'No venues match yet. Keep typing, or use it as typed.';
export const VENUE_SEARCH_ERROR = 'Venue search isn’t reachable. You can still use the name as typed.';
export const VENUE_MIN_CHARS = 2;

function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/** The venue's name with the typed words in bold, so the match is easy to see. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const typed = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const parts = text.split(/(\s+)/);
  return (
    <Text variant="body" numberOfLines={1}>
      {parts.map((part, i) => {
        const hit = typed.find((t) => part.toLowerCase().startsWith(t));
        if (!hit) return part;
        return (
          <Text key={i} variant="bodyStrong">
            {part.slice(0, hit.length)}
            <Text variant="body">{part.slice(hit.length)}</Text>
          </Text>
        );
      })}
    </Text>
  );
}

function ResultRow({ venue, query, onPick }: { venue: Venue; query: string; onPick: (v: Venue) => void }) {
  const c = useTheme();
  const Icon = venue.source === 'gelatin' ? Building2 : MapPin;
  return (
    <Pressable
      testID={`venue-${venue.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name}, ${venueAddress(venue)}${venue.source === 'gelatin' ? ', Gelatin venue' : ''}`}
      onPress={() => onPick(venue)}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: c.muted } : null]}>
      <View style={[styles.rowIcon, { backgroundColor: venue.source === 'gelatin' ? c.tint : c.muted }]}>
        <Icon size={16} color={venue.source === 'gelatin' ? c.brandText : c.mutedText} strokeWidth={2} />
      </View>
      <View style={styles.flex}>
        <Highlighted text={venue.name} query={query} />
        <Text variant="helper" tone="muted" numberOfLines={1}>
          {venueAddress(venue)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Venue, as a type-ahead. Typing searches Gelatin's venues first, then
 * Google's public places. Picking one fills in the street, city, state and
 * postcode, and the city brings the time zone the event's times are in.
 * Anything can still be used as typed; then the city is picked by hand.
 */
export function VenueField({
  value,
  place,
  onChangeText,
  onPick,
  onClear,
}: {
  /** The venue name as it stands. */
  value: string;
  /** The recognized venue, when one was picked. */
  place: Venue | null;
  onChangeText: (text: string) => void;
  onPick: (venue: Venue) => void;
  /** Change: drop the recognized venue and search again. */
  onClear: () => void;
}) {
  const c = useTheme();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const wrap = useRef<ComponentRef<typeof View>>(null);
  const scrollIntoView = useScrollIntoView();
  // Bring the field to the top so the suggestions under it have room, above the keyboard.
  const lift = () => setTimeout(() => scrollIntoView(wrap.current), 120);
  const [open, setOpen] = useState(false);
  const query = useDebounced(value, VENUE_SEARCH_DEBOUNCE_MS);
  const search = useVenueSearch(open ? query : '');
  const typed = value.trim();
  const searching = open && typed.length >= VENUE_MIN_CHARS;
  const results = search.data;
  const settling = search.isFetching || query !== value;
  const none = !!results && results.gelatin.length === 0 && results.google.length === 0;
  // Once the list opens there is room to scroll; bring it into view.
  const listed = searching && !!results;
  useEffect(() => {
    if (!listed) return;
    const timer = setTimeout(() => scrollIntoView(wrap.current), 60);
    return () => clearTimeout(timer);
  }, [listed, scrollIntoView]);

  if (place) {
    return (
      <View style={styles.wrap} testID="venue-picked">
        <Text variant="secondaryStrong">Venue</Text>
        <View style={[styles.picked, { borderColor: c.border, backgroundColor: c.card }]}>
          <View style={[styles.rowIcon, { backgroundColor: place.source === 'gelatin' ? c.tint : c.muted }]}>
            {place.source === 'gelatin' ? (
              <Building2 size={16} color={c.brandText} strokeWidth={2} />
            ) : (
              <MapPin size={16} color={c.mutedText} strokeWidth={2} />
            )}
          </View>
          <View style={styles.flex}>
            <Text variant="cardTitle" numberOfLines={1}>
              {place.name}
            </Text>
            <Text variant="secondary" tone="muted">
              {place.street}
            </Text>
            <Text variant="secondary" tone="muted">
              {place.city.name}, {place.city.region} {place.postalCode}
            </Text>
            <View style={styles.pills}>
              <Pill label={place.source === 'gelatin' ? 'Gelatin venue' : 'Google'} tone={place.source === 'gelatin' ? 'held' : 'neutral'} />
              {place.capacity ? <Pill label={`Holds ${place.capacity.toLocaleString('en-US')}`} tone="neutral" /> : null}
            </View>
          </View>
          <IconButton
            testID="venue-change"
            accessibilityLabel={`Change venue, ${place.name}`}
            size={36}
            icon={<X size={16} color={c.foreground} strokeWidth={2} />}
            onPress={() => {
              onClear();
              setOpen(true);
              setTimeout(() => input.current?.focus(), 0);
            }}
          />
        </View>
        <Text variant="helper" tone="muted" testID="venue-zone">
          Times are in {timeZoneName(place.city.timeZone)}, the venue’s time zone.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap} ref={wrap}>
      <TextField
        ref={input}
        testID="field-venue"
        label="Venue"
        value={value}
        placeholder={VENUE_PLACEHOLDER}
        maxLength={120}
        autoCorrect={false}
        returnKeyType="done"
        onChangeText={(text) => {
          onChangeText(text);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          lift();
        }}
        // Leave the list up long enough for a tap on it to land.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        accessibilityHint="Suggestions from Gelatin and Google appear as you type"
      />
      {searching ? (
        <View testID="venue-results" style={[styles.results, { borderColor: c.border, backgroundColor: c.card }]}>
          {search.isError ? (
            <Text variant="secondary" tone="muted" style={styles.note}>
              {VENUE_SEARCH_ERROR}
            </Text>
          ) : null}
          {!results && settling ? (
            <View style={[styles.note, styles.loading]} accessibilityLabel="Searching venues">
              <Spinner />
              <Text variant="secondary" tone="muted">
                Searching venues
              </Text>
            </View>
          ) : null}
          {/* Gelatin's venues first, then Google's places; the icon tells them apart. */}
          {results
            ? [...results.gelatin, ...results.google].map((v) => <ResultRow key={v.id} venue={v} query={query} onPick={onPick} />)
            : null}
          {none && !settling ? (
            <Text variant="secondary" tone="muted" style={styles.note} testID="venue-no-match">
              {VENUE_NO_MATCH}
            </Text>
          ) : null}
          <Pressable
            testID="venue-as-typed"
            accessibilityRole="button"
            accessibilityLabel={`Use ${typed} as typed`}
            onPress={() => {
              setOpen(false);
              input.current?.blur();
            }}
            style={({ pressed }) => [styles.row, styles.asTyped, { borderTopColor: c.border }, pressed ? { backgroundColor: c.muted } : null]}>
            <View style={[styles.rowIcon, { backgroundColor: c.muted }]}>
              <PencilLine size={16} color={c.mutedText} strokeWidth={2} />
            </View>
            <Text variant="body" numberOfLines={1} style={styles.flex}>
              Use “{typed}”
            </Text>
          </Pressable>
          {results && results.google.length > 0 ? (
            <Text variant="helper" tone="muted" style={styles.attribution}>
              Places powered by Google
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.label },
  flex: { flex: 1, minWidth: 0 },
  results: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden', paddingVertical: space.xs },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.row, paddingHorizontal: 14, paddingVertical: space.sm },
  rowIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  asTyped: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: space.xs },
  note: { paddingHorizontal: 14, paddingVertical: space.row },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  attribution: { paddingHorizontal: 14, paddingTop: space.xs, paddingBottom: space.sm, textAlign: 'right' },
  picked: { flexDirection: 'row', alignItems: 'flex-start', gap: space.row, borderWidth: 1, borderRadius: radius.card, padding: 14 },
  pills: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' },
});
