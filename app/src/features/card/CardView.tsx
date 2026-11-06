import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeft, WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ErrorState, GroupedList, IconButton, LoadingRows, Pill, Screen, SectionHeader, Text } from '@/components/ui';
import type { MemberCard, Membership } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { font, radius, size, space } from '@/theme/tokens';

import { useMemberCard } from './useMemberCard';

const logo = require('@/assets/images/logo-memberly.png');
const LOGO_RATIO = 740 / 210;
const QR_SIZE = 200;

export const OFFLINE_LINE = 'Shown offline';

function MembershipRow({ m }: { m: Membership }) {
  const active = m.status === 'active';
  return (
    <View style={styles.row} accessible accessibilityLabel={`${m.communityName}, ${m.tierLabel}, ${active ? 'Active' : 'Expired'}`}>
      <Image source={m.cover} style={[styles.cover, active ? null : styles.faded]} contentFit="cover" />
      <View style={styles.flex}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {m.communityName}
        </Text>
        <Text variant="helper" tone="muted" numberOfLines={2}>
          {m.tierLabel}
        </Text>
      </View>
      <Pill label={active ? 'Active' : 'Expired'} tone={active ? 'success' : 'neutral'} style={styles.pill} />
    </View>
  );
}

function TheCard({ card, offline }: { card: MemberCard; offline: boolean }) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.tint, borderColor: c.brandLine }]} testID="member-card">
      <View style={styles.cardTop}>
        <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Memberly" />
        <Text variant="helper" tone="brand" style={styles.scan}>
          Scan at the door
        </Text>
      </View>
      <View style={[styles.qr, { backgroundColor: c.qrPaper }]} accessible accessibilityRole="image" accessibilityLabel="Member QR code">
        <QRCode value={card.qr.token} size={QR_SIZE} color={c.qrInk} backgroundColor={c.qrPaper} ecl="M" />
      </View>
      <View style={styles.who}>
        <Text variant="headline" align="center">
          {card.name}
        </Text>
        <Text variant="secondary" tone="brand" align="center">
          Member · {card.communityCount} {card.communityCount === 1 ? 'community' : 'communities'}
        </Text>
        {offline ? (
          <View style={styles.offline} testID="card-offline">
            <WifiOff size={13} color={c.brandText} strokeWidth={2} />
            <Text variant="helper" tone="brand">
              {OFFLINE_LINE}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/**
 * My Memberly Card (F4): the purple card with a large QR on white, the
 * member's name and communities, then memberships. Add to Wallet stays
 * hidden until the wallet decision lands.
 */
export function CardView() {
  const c = useTheme();
  const state = useMemberCard();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen testID="card-screen">
      <View style={styles.header}>
        <IconButton accessibilityLabel="Back" icon={<ArrowLeft size={18} color={c.foreground} strokeWidth={2} />} onPress={back} />
        <Text variant="headline" accessibilityRole="header" align="center" style={styles.flex}>
          My Memberly Card
        </Text>
        <View style={styles.spacer} />
      </View>

      {state.status === 'loading' ? <LoadingRows count={2} label="Loading your card" /> : null}
      {state.status === 'unavailable' ? (
        <ErrorState
          title="Your card needs a connection"
          detail="We couldn’t reach Memberly and there’s no saved card on this phone yet. Try again when you’re back online."
          onRetry={state.retry}
        />
      ) : null}
      {state.status === 'ready' ? (
        <>
          <TheCard card={state.card} offline={state.offline} />
          <View style={styles.section}>
            <SectionHeader title="Your memberships" />
            <GroupedList>
              {state.card.memberships.map((m) => (
                <MembershipRow key={m.communityId} m={m} />
              ))}
            </GroupedList>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  spacer: { width: size.minTarget },
  flex: { flex: 1, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.gutter, alignItems: 'center', gap: 18 },
  cardTop: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { height: 24, width: 24 * LOGO_RATIO },
  scan: { fontFamily: font.semibold },
  qr: { padding: space.row, borderRadius: radius.notice },
  who: { gap: 2, alignItems: 'center' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  section: { gap: space.stack },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingVertical: space.row, paddingHorizontal: space.card, minHeight: size.minTarget },
  cover: { width: 40, height: 40, borderRadius: 10 },
  faded: { opacity: 0.5 },
  pill: { alignSelf: 'center' },
});
