import { router } from 'expo-router';
import { ArrowLeft, ArrowUpRight, CalendarDays, Plus, Search } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  BottomSheetFrame,
  Button,
  Card,
  Chip,
  GroupedList,
  IconButton,
  ListRow,
  MoneySummary,
  Notice,
  PassPill,
  PillButton,
  Screen,
  SectionHeader,
  Skeleton,
  StatusPill,
  Text,
  TierPill,
} from '@/components/ui';
import { sampleDjs } from '@/data/fakeRepository';
import { BOOKING_STATUSES } from '@/features/booking/status';
import { useTheme } from '@/theme/theme';
import { space, type TypeVariant } from '@/theme/tokens';

const TYPE_SAMPLES: [TypeVariant, string][] = [
  ['display', 'Display 28 / 800'],
  ['headline', 'Headline 20 / 700'],
  ['title', 'Title 17 / 700'],
  ['cardTitle', 'Card title 16 / 600'],
  ['body', 'Body 15 / 400'],
  ['secondary', 'Secondary 13 / 400'],
  ['helper', 'Helper 12 / 400'],
  ['money', '$457.00'],
  ['label', 'Label 10 / 700'],
];

/** Every shared component in its states. Dev only; the milestone 1 reference. */
export default function KitScreen() {
  const c = useTheme();
  const [chip, setChip] = useState('House');
  const swatches: [string, string][] = [
    ['Brand', c.brand],
    ['Pressed', c.brandPressed],
    ['Background', c.background],
    ['Card', c.card],
    ['Muted', c.muted],
    ['Border', c.border],
    ['Muted text', c.mutedText],
    ['Destructive', c.destructive],
  ];

  return (
    <Screen>
      <View style={styles.headerRow}>
        <IconButton accessibilityLabel="Back" icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />} onPress={() => router.back()} />
        <Text variant="headline" accessibilityRole="header">
          Parts kit
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Status pills" />
        <View style={styles.wrap}>
          {BOOKING_STATUSES.map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <PassPill />
        </View>
        <View style={styles.wrap}>
          {(['Verified', 'Top performer', 'Resident', 'City pillar'] as const).map((t) => (
            <TierPill key={t} tier={t} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Buttons" />
        <Button label="Browse talent" />
        <Button label="Save as draft" variant="secondary" />
        <Button label="Change date" variant="destructive" />
        <Button label="Send 2 offers" disabled />
        <Button label="Holding your card" loading />
        <View style={styles.wrap}>
          <PillButton label="Add" />
          <PillButton label="Added" filled />
          <PillButton label="New event" filled icon={<Plus size={14} color={c.onBrand} strokeWidth={2.5} />} />
          <IconButton accessibilityLabel="Search" variant="card" size={48} icon={<Search size={20} color={c.foreground} strokeWidth={2} />} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Chips" />
        <View style={styles.wrap}>
          {['House', 'Techno', '$300 – $600', 'Afrobeats'].map((g) => (
            <Chip key={g} label={g} selected={chip === g} onPress={() => setChip(g)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Cards and notices" />
        <Card>
          <View style={styles.djRow}>
            <Avatar source={sampleDjs.koyo.photo} initials="KY" />
            <View style={styles.flex}>
              <Text variant="cardTitle">KOYO</Text>
              <Text variant="secondary" tone="muted">
                Headline · midnight to 2
              </Text>
            </View>
            <StatusPill status="confirmed" />
          </View>
          <Text variant="secondary" tone="muted">
            $457.00 charged. KOYO is on your public lineup.
          </Text>
        </Card>
        <Card selected>
          <View style={styles.djRow}>
            <Avatar initials="BM" />
            <View style={styles.flex}>
              <Text variant="cardTitle">BLKMTN</Text>
              <Text variant="secondary" tone="muted">
                Selected card
              </Text>
            </View>
            <StatusPill status="requested" />
          </View>
          <View style={styles.linkRow}>
            <Text variant="secondaryStrong" tone="brand">
              Manage in Gelatin
            </Text>
            <ArrowUpRight size={14} color={c.brandText} strokeWidth={2} />
          </View>
        </Card>
        <Card attention>
          <Text variant="cardTitle">Attention card</Text>
          <Text variant="secondary" tone="muted">
            BLKMTN came back at $520. Your hold was released.
          </Text>
        </Card>
        <Notice>Your card is held, not charged. You’re charged only if KOYO accepts. If they pass or don’t answer, the hold is released.</Notice>
        <Notice tone="tint">Back from Gelatin. Your lineup is up to date.</Notice>
        <Notice tone="error" title="Talent is unavailable right now.">
          Your event is safe and nothing was sent.
        </Notice>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Money summary" />
        <MoneySummary
          lines={[
            { label: 'KOYO’s fee', cents: 45000 },
            { label: 'Gelatin service fee', cents: 700 },
          ]}
          total={{ label: 'Held on your card', cents: 45700 }}
          footnote="Sample figures. Totals always come from the server."
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="List rows" />
        <GroupedList>
          <ListRow label="Upcoming events" value="1 pass" icon={<CalendarDays size={18} color={c.foreground} strokeWidth={2} />} onPress={() => {}} />
          <ListRow label="Appearance" value="Dark" onPress={() => {}} />
          <ListRow label="Sign out" tone="error" chevron={false} />
        </GroupedList>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Bottom sheet frame" />
        <BottomSheetFrame padBottom={false} style={styles.sheetSample}>
          <Text variant="headline">Your offer to KOYO</Text>
          <Text variant="secondary" tone="muted">
            Sheets rise over a dimmed screen. Flat, 24px top radius.
          </Text>
          <Button label="Hold $457.00 and send" />
        </BottomSheetFrame>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Loading" />
        <Skeleton height={16} width="70%" round />
        <Skeleton height={64} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Type" />
        {TYPE_SAMPLES.map(([v, label]) => (
          <Text key={v} variant={v}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Colour" />
        <View style={styles.wrap}>
          {swatches.map(([name, value]) => (
            <View key={name} style={styles.swatch}>
              <View style={[styles.swatchChip, { backgroundColor: value, borderColor: c.border }]} />
              <Text variant="helper">{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  section: { gap: space.stack },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  djRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  sheetSample: { marginHorizontal: -space.gutter },
  swatch: { width: '22%', gap: 4 },
  swatchChip: { height: 36, borderRadius: 6, borderWidth: 1 },
});
