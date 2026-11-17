import { Clock, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, IconButton, SelectField, Text, TextField } from '@/components/ui';
import type { DraftOffer, DraftOfferPatch } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { centsToDollarsField, dollarsToCents, FEE_MISSING_MESSAGE, sanitizeDollars } from '@/features/booking/offers';
import { TimesSheet } from '@/features/events/TimePicker';
import { addMinutes, durationLabel, formatSetTime, type WallTime } from '@/lib/dates';

import { SET_LENGTH_PICKS, suggestedLine, type SetTime } from './setTimes';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/** A note is optional and short; the counter appears near the end. */
export const NOTE_MAX = 280;
export const NOTE_COUNTER_FROM = 240;

/** With no event start to go from, the set sheet opens at 10 PM. */
const FALLBACK_SET_START: WallTime = '22:00';

/**
 * A DJ added to the lineup with an offer not sent yet: Your offer, Set time
 * and Note to [DJ]. The set is suggested from the event's start until the
 * organizer changes it.
 */
export function AddedDjCard({
  offer,
  setTime = null,
  eventStart = null,
  zone = null,
  onChange,
  onRemove,
}: {
  offer: DraftOffer;
  /** The set it goes out with: chosen, or suggested from the event's start. */
  setTime?: SetTime | null;
  /** The event's start, for the suggestion line and the sheet's quick picks. */
  eventStart?: WallTime | null;
  /** The venue's zone, named in the sheet. */
  zone?: string | null;
  /** Saves the fee, the note or the set as it changes. */
  onChange: (patch: DraftOfferPatch) => void;
  onRemove: () => void;
}) {
  const [setSheet, setSetSheet] = useState(false);
  const c = useTheme();
  const dj = offer.dj;
  const [fee, setFee] = useState(() => centsToDollarsField(offer.offerCents));
  const [note, setNote] = useState(offer.note);
  const missing = dollarsToCents(fee) == null;
  const rate = dj.publishedRateCents == null ? 'private rate' : `rate ${formatRate(dj.publishedRateCents)}`;

  return (
    <Card testID={`added-${dj.id}`} style={styles.card}>
      <View style={styles.head}>
        <Avatar source={dj.photo} initials={dj.initials} accessibilityLabel={dj.name} />
        <View style={styles.flex}>
          <Text variant="cardTitle" numberOfLines={1}>
            {dj.name}
          </Text>
          <Text variant="secondary" tone="muted" numberOfLines={1}>
            {dj.tier} · {rate}
          </Text>
        </View>
        <IconButton
          accessibilityLabel={`Remove ${dj.name}`}
          variant="plain"
          size={36}
          icon={<X size={18} color={c.mutedText} strokeWidth={2} />}
          onPress={onRemove}
        />
      </View>
      <View style={styles.feeBlock}>
        <View style={styles.feeRow}>
          <Text variant="bodyStrong" style={styles.flex}>
            Your offer
          </Text>
          <TextField
            testID={`fee-${dj.id}`}
            label={`Your offer to ${dj.name}, in dollars`}
            hideLabel
            prefix="$"
            money
            value={fee}
            placeholder="Fee"
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={6}
            style={styles.fee}
            inputStyle={missing ? { borderColor: c.warningText } : null}
            onChangeText={(text) => {
              const clean = sanitizeDollars(text);
              setFee(clean);
              onChange({ offerCents: dollarsToCents(clean) });
            }}
          />
        </View>
        {missing ? (
          <Text variant="helper" tone="warning" testID={`fee-missing-${dj.id}`}>
            {FEE_MISSING_MESSAGE}
          </Text>
        ) : null}
      </View>
      <View style={styles.setBlock}>
        <SelectField
          testID={`set-${dj.id}`}
          label="Set time"
          strong
          value={setTime ? `${formatSetTime(setTime.start, setTime.end)} · ${durationLabel(setTime.start, setTime.end)}` : null}
          placeholder="Add a set time"
          onPress={() => setSetSheet(true)}
        />
        {setTime?.suggested && eventStart ? (
          <View style={styles.suggested}>
            <Clock size={12} color={c.mutedText} strokeWidth={2} />
            <Text variant="helper" tone="muted" testID={`set-suggested-${dj.id}`}>
              {suggestedLine(eventStart)}
            </Text>
          </View>
        ) : null}
        {!setTime && !eventStart ? (
          <Text variant="helper" tone="muted">
            Add the event’s start time and sets are suggested for you.
          </Text>
        ) : null}
      </View>
      <TimesSheet
        key={setSheet ? 'open' : 'closed'}
        testID={`set-sheet-${dj.id}`}
        title={`${dj.name}’s set`}
        visible={setSheet}
        edge="start"
        start={setTime?.start ?? eventStart ?? FALLBACK_SET_START}
        end={setTime?.end ?? null}
        zone={zone}
        startPicks={[0, 60, 120, 180, 240].map((m) => addMinutes(eventStart ?? setTime?.start ?? FALLBACK_SET_START, m))}
        lengthPicks={SET_LENGTH_PICKS}
        onClose={() => setSetSheet(false)}
        onDone={({ start, end }) => {
          onChange({ setStart: start, setEnd: end });
          setSetSheet(false);
        }}
      />
      <TextField
        testID={`note-${dj.id}`}
        label={`Note to ${dj.name}`}
        value={note}
        placeholder="The room, what you need"
        maxLength={NOTE_MAX}
        // Saved as it is typed, so Send picks up a note even while the keyboard is still up.
        onChangeText={(text) => {
          setNote(text);
          onChange({ note: text });
        }}
        helper={note.length >= NOTE_COUNTER_FROM ? `${note.length} of ${NOTE_MAX} characters` : undefined}
      />
      <Text variant="helper" tone="muted">
        {dj.name} can accept, pass or come back with a new price.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.row },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0 },
  feeBlock: { gap: space.label },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  fee: { width: 150 },
  setBlock: { gap: space.label },
  suggested: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
