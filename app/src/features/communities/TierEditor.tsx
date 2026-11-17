import { Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { PillButton, Text, TextField } from '@/components/ui';
import { sanitizeDollars } from '@/features/booking/offers';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { COMMUNITY_NAME_MAX, INCLUDED_MAX, newTier, STRIPE_HELPER, TIER_MAX, type TierDraft } from './communityForm';

/** Placeholders that show what a second or third tier is usually for. */
const NAME_HINTS = ['Member', 'VIP', 'Inner circle', 'Founding member', 'Patron'];
const INCLUDED_HINTS = [
  'Member pricing on every pass',
  'Guest list plus one, early passes',
  'A table and a monthly dinner',
  'Everything above, for life',
  'Everything above, plus backstage',
];

/**
 * Paid membership tiers, set up while the community is created: a card per
 * tier with its name, monthly price and one line on what's included. Add a
 * tier below; remove any while there is more than one.
 */
export function TierEditor({ tiers, onChange }: { tiers: TierDraft[]; onChange: (tiers: TierDraft[]) => void }) {
  const c = useTheme();
  const patch = (key: string, change: Partial<TierDraft>) => onChange(tiers.map((t) => (t.key === key ? { ...t, ...change } : t)));
  return (
    <View style={styles.wrap} testID="tier-editor">
      {tiers.map((t, i) => (
        <View key={t.key} testID={`tier-${i}`} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.head}>
            <Text variant="cardTitle" accessibilityRole="header">
              {tiers.length === 1 ? 'Your membership' : `Tier ${i + 1}`}
            </Text>
            {tiers.length > 1 ? (
              <PillButton
                testID={`tier-remove-${i}`}
                label="Remove"
                accessibilityLabel={`Remove ${t.name.trim() || `tier ${i + 1}`}`}
                onPress={() => onChange(tiers.filter((x) => x.key !== t.key))}
              />
            ) : null}
          </View>
          <TextField
            testID={`tier-name-${i}`}
            label="Name"
            value={t.name}
            placeholder={NAME_HINTS[i] ?? 'Tier name'}
            maxLength={COMMUNITY_NAME_MAX}
            autoCapitalize="words"
            returnKeyType="done"
            onChangeText={(name) => patch(t.key, { name })}
          />
          <TextField
            testID={`tier-price-${i}`}
            label="Monthly price"
            value={t.price}
            prefix="$"
            money
            placeholder="0"
            keyboardType="number-pad"
            onChangeText={(price) => patch(t.key, { price: sanitizeDollars(price) })}
          />
          <TextField
            testID={`tier-included-${i}`}
            label="What’s included (optional)"
            value={t.included}
            placeholder={INCLUDED_HINTS[i] ?? 'One line members will read'}
            maxLength={INCLUDED_MAX}
            returnKeyType="done"
            onChangeText={(included) => patch(t.key, { included })}
          />
        </View>
      ))}

      {tiers.length < TIER_MAX ? (
        <PillButton
          testID="tier-add"
          label="Add a tier"
          icon={<Plus size={16} color={c.foreground} strokeWidth={2.5} />}
          onPress={() => onChange([...tiers, newTier()])}
          style={styles.add}
        />
      ) : null}
      <Text variant="helper" tone="muted">
        {`Up to ${TIER_MAX} tiers, shown to members in this order. ${STRIPE_HELPER}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.stack },
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.card, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.row, minHeight: 44 },
  add: { alignSelf: 'flex-start' },
});
