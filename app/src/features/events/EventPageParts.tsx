import { Image } from 'expo-image';
import { BadgeCheck, Gift } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Pill, Text } from '@/components/ui';
import type { EventPageDetails, ImageAsset, RichSpan } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/**
 * The parts of an event's page (Pages / Event page), each one section of the
 * web's event page carried to the phone: who hosts it, the details rows,
 * who's going, the About text, member perks and the host community.
 */

/** The category and who can come, above the title. */
export function EventBadges({ category, details }: { category?: string; details: EventPageDetails }) {
  const access =
    details.access === 'members-only' ? 'Members only' : details.access === 'free-for-members' ? 'Free for members' : null;
  return (
    <View style={styles.badges}>
      {category ? <Pill label={category} tone="held" /> : null}
      {access ? <Pill label={access} tone="success" /> : null}
      {details.sales === 'ended' ? <Pill label="Sales ended" tone="neutral" /> : null}
    </View>
  );
}

/** "Hosted by Second Sundays ✓": the host's logo, its name as a link, and the verified mark. */
export function HostedBy({ host, onOpen }: { host: EventPageDetails['host']; onOpen: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      testID="event-host"
      accessibilityRole="link"
      accessibilityLabel={`Hosted by ${host.name}${host.verified ? ', verified' : ''}`}
      onPress={onOpen}
      hitSlop={8}
      style={styles.hostedBy}>
      <Logo source={host.logo} name={host.name} size={24} />
      <Text variant="secondary" tone="muted">
        Hosted by{' '}
        <Text variant="secondaryStrong" tone="brand">
          {host.name}
        </Text>
      </Text>
      {host.verified ? <BadgeCheck size={16} color={c.brandText} strokeWidth={2} /> : null}
    </Pressable>
  );
}

/** One fact about the event: an icon tile, a small label and the value under it. */
export function DetailRow({ icon, label, value, detail, onPress }: { icon: ReactNode; label: string; value: ReactNode; detail?: string; onPress?: () => void }) {
  const c = useTheme();
  const body = (
    <>
      <View style={[styles.tile, { backgroundColor: c.muted }]}>{icon}</View>
      <View style={styles.flex}>
        <Text variant="helper" tone="muted">
          {label}
        </Text>
        {typeof value === 'string' ? <Text variant="bodyStrong">{value}</Text> : value}
        {detail ? (
          <Text variant="secondary" tone="muted">
            {detail}
          </Text>
        ) : null}
      </View>
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${typeof value === 'string' ? value : ''} ${detail ?? ''}`.trim()} onPress={onPress} style={({ pressed }) => [styles.detailRow, pressed ? { opacity: 0.7 } : null]}>
      {body}
    </Pressable>
  ) : (
    <View style={styles.detailRow} accessible>
      {body}
    </View>
  );
}

/** Who's going: a few faces, their names, and the rest as a count. Hidden when nobody has said yet. */
export function GoingRow({ going }: { going: EventPageDetails['going'] }) {
  const c = useTheme();
  const { people, othersCount } = going;
  if (people.length === 0 && othersCount === 0) return null;
  const names = people.map((p) => p.name).join(', ');
  const line =
    people.length === 0 ? `${othersCount} going` : othersCount > 0 ? `${names}, and ${othersCount} more going` : `${names} going`;
  return (
    <View style={styles.going} testID="event-going" accessible accessibilityLabel={line}>
      <View style={styles.faces}>
        {people.slice(0, 4).map((p, i) => (
          <View key={p.name} style={[styles.face, { borderColor: c.background, marginLeft: i === 0 ? 0 : -10 }]}>
            <Avatar source={p.photo} initials={p.initials} size={36} />
          </View>
        ))}
        {othersCount > 0 ? (
          <View style={[styles.face, styles.more, { borderColor: c.background, backgroundColor: c.muted, marginLeft: people.length ? -10 : 0 }]}>
            <Text variant="helper">{`+${othersCount}`}</Text>
          </View>
        ) : null}
      </View>
      <Text variant="secondary" tone="muted">
        {line}
      </Text>
    </View>
  );
}

/** About this event: paragraphs with the web's bold, italic and links. Links open in the browser. */
export function RichText({ paragraphs }: { paragraphs: RichSpan[][] }) {
  return (
    <View style={styles.rich}>
      {paragraphs.map((runs, i) => (
        <Text key={i} tone="muted">
          {runs.map((r, j) => (
            <Text
              key={j}
              tone={r.link ? 'brand' : r.bold ? 'default' : 'muted'}
              variant={r.bold ? 'bodyStrong' : 'body'}
              style={[r.italic ? styles.italic : null, r.link ? styles.link : null]}
              accessibilityRole={r.link ? 'link' : undefined}
              onPress={r.link ? () => Linking.openURL(r.link!) : undefined}>
              {r.text}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}

/** Member perks: what belonging gets you at this event. */
export function MemberPerks({ perks }: { perks: EventPageDetails['memberPerks'] }) {
  const c = useTheme();
  return (
    <View style={styles.perks}>
      {perks.map((p) => (
        <View key={p.title} style={styles.detailRow} accessible accessibilityLabel={`${p.title}. ${p.kind}. ${p.detail}`}>
          <View style={[styles.tile, { backgroundColor: c.muted }]}>
            <Gift size={18} color={c.foreground} strokeWidth={2} />
          </View>
          <View style={styles.flex}>
            <View style={styles.perkHead}>
              <Text variant="bodyStrong">{p.title}</Text>
              <Pill label={p.kind} tone="held" />
            </View>
            <Text variant="secondary" tone="muted">
              {p.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** About the community: the host's logo, name and line, and a way to its page. */
export function HostCard({ host, onVisit }: { host: EventPageDetails['host']; onVisit: () => void }) {
  const c = useTheme();
  return (
    <View testID="event-host-card" style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text variant="title" accessibilityRole="header">
        About the community
      </Text>
      <View style={styles.hostRow}>
        <Logo source={host.logo} name={host.name} size={44} />
        <View style={styles.flex}>
          <View style={styles.perkHead}>
            <Text variant="cardTitle">{host.name}</Text>
            {host.verified ? (
              <View accessible accessibilityLabel="Verified">
                <BadgeCheck size={16} color={c.brandText} strokeWidth={2} />
              </View>
            ) : null}
          </View>
          <Text variant="secondary" tone="muted">
            Event host
          </Text>
        </View>
      </View>
      {host.about ? (
        <Text variant="secondary" tone="muted">
          {host.about}
        </Text>
      ) : null}
      <Button label="Visit community" variant="secondary" onPress={onVisit} />
    </View>
  );
}

/** A community's mark: its logo, or its initials on the muted tile. */
function Logo({ source, name, size }: { source: ImageAsset | null; name: string; size: number }) {
  const c = useTheme();
  const box = { width: size, height: size, borderRadius: size / 4 };
  if (source) return <Image source={source} style={[box, { backgroundColor: c.muted }]} contentFit="cover" accessibilityIgnoresInvertColors />;
  return (
    <View style={[box, styles.center, { backgroundColor: c.muted }]}>
      <Text variant="helper">{name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hostedBy: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44, alignSelf: 'flex-start' },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.row, paddingVertical: space.row, minHeight: 44 },
  going: { gap: space.sm },
  faces: { flexDirection: 'row', alignItems: 'center' },
  face: { borderWidth: 2, borderRadius: radius.pill },
  more: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  rich: { gap: space.row },
  italic: { fontStyle: 'italic' },
  link: { textDecorationLine: 'underline' },
  perks: { gap: 0 },
  perkHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  card: { borderWidth: 1, borderRadius: radius.card, padding: space.card, gap: space.row },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
});
