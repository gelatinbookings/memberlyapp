import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { cityHints } from './cityHints';

const REGION_LABEL: Record<string, string> = { 'United States': 'State', Canada: 'Province', 'United Kingdom': 'Region' };

/**
 * City, typed freely: any city works. Suggestions appear as you type for
 * common ones and fill in the state or province; the state can also be typed.
 */
export function CityField({
  country,
  city,
  region,
  onChange,
}: {
  country: string;
  city: string;
  region: string;
  onChange: (patch: { city?: string; region?: string }) => void;
}) {
  const c = useTheme();
  const [focused, setFocused] = useState(false);
  const hints = focused ? cityHints(city, country) : [];
  const regionLabel = REGION_LABEL[country] ?? 'State or region';
  return (
    <View style={styles.wrap}>
      <TextField
        testID="community-city"
        label="City (optional)"
        value={city}
        placeholder="Any city, like Atlanta"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={60}
        returnKeyType="next"
        onChangeText={(text) => onChange({ city: text })}
        onFocus={() => setFocused(true)}
        // Leave the list up long enough for a tap on it to land.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {hints.length > 0 ? (
        <View testID="city-hints" style={[styles.hints, { borderColor: c.border, backgroundColor: c.card }]}>
          {hints.map((h) => (
            <Pressable
              key={`${h.name}-${h.region}`}
              testID={`city-hint-${h.name}`}
              accessibilityRole="button"
              accessibilityLabel={`${h.name}, ${h.region}`}
              onPress={() => {
                onChange({ city: h.name, region: h.region });
                setFocused(false);
              }}
              style={({ pressed }) => [styles.hint, pressed ? { backgroundColor: c.muted } : null]}>
              <MapPin size={14} color={c.mutedText} strokeWidth={2} />
              <Text variant="body">
                {h.name}
                <Text variant="secondary" tone="muted">{`, ${h.region}`}</Text>
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {city.trim() ? (
        <TextField
          testID="community-region"
          label={`${regionLabel} (optional)`}
          value={region}
          placeholder={country === 'United States' ? 'e.g. GA' : ''}
          autoCapitalize={country === 'United States' ? 'characters' : 'words'}
          autoCorrect={false}
          maxLength={40}
          returnKeyType="done"
          onChangeText={(text) => onChange({ region: text })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.stack },
  hints: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden', marginTop: -space.xs },
  hint: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 14 },
});
