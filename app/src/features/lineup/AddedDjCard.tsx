import { X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Card, IconButton, Text, TextField } from '@/components/ui';
import type { DraftOffer, DraftOfferPatch } from '@/data/types';
import { formatRate } from '@/features/booking/money';
import { centsToDollarsField, dollarsToCents, FEE_MISSING_MESSAGE, sanitizeDollars } from '@/features/booking/offers';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/** A DJ added to the lineup with an offer not sent yet: Your offer and Note to [DJ]. Fee and note only. */
export function AddedDjCard({
  offer,
  onChange,
  onRemove,
}: {
  offer: DraftOffer;
  onChange: (patch: DraftOfferPatch) => void;
  onRemove: () => void;
}) {
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
      <TextField
        testID={`note-${dj.id}`}
        label={`Note to ${dj.name}`}
        value={note}
        placeholder="Set time, the room, what you need"
        maxLength={280}
        onChangeText={setNote}
        onEndEditing={() => onChange({ note })}
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
});
