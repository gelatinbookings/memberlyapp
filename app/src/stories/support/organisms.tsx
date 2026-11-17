/**
 * Helpers for the Organisms and Templates stories. Everything a story shows
 * still comes from the fake repository: these only find a sample DJ, event,
 * offer or tier by name, so a story never retypes one. The layout pieces
 * (ScreenBehind, Slot, StoryTabBar) are placeholders and the router-free tab bar.
 */
import { CalendarDays, Compass, House, LayoutGrid, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabButton, tabBarStyles } from '@/components/navigation/TabBar';
import { Skeleton, Text } from '@/components/ui';
import type { MemberlyRepository } from '@/data/repository';
import type { Dj, DraftOffer, OrganizerEventDetail, OrganizerPass } from '@/data/types';
import { centsToDollarsField } from '@/features/booking/offers';
import type { TierDraft } from '@/features/communities/communityForm';
import { formatIsoDate, formatIsoDateShort } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** Sample events by role, as the fake seeds them for the existing organizer. */
export const SAMPLE_EVENT = {
  /** Live, with DJs in motion: one Payment needed, one Card held, one Confirmed. */
  inMotion: 'e_warehouse_friday',
  /** Live, date and city set, nobody added. */
  empty: 'e_long_table',
  /** A draft with two DJs added and no offers sent (one published rate, one private). */
  draftsNotSent: 'e_late_service',
  /** Live, with one booking in each of the eight statuses. */
  everyStatus: 'e_sunday_sessions',
  /** A draft in a city Gelatin does not book yet. */
  noCoverage: 'e_river_street',
  /** A member-facing event with a members-free pass and a sold-out pass. */
  passes: 'e_rooftop_hours',
} as const;

/** An organizer's event exactly as the fake server returns it. */
export async function eventOf(repo: MemberlyRepository, id: string): Promise<OrganizerEventDetail> {
  const event = await repo.getOrganizerEvent(id);
  if (!event) throw new Error(`No sample event ${id}`);
  return event;
}

/** "Fri, Nov 20" and "Nov 20" for an event's night. */
export function nightOf(event: Pick<OrganizerEventDetail, 'date'>): { day: string; short: string } {
  return event.date ? { day: formatIsoDate(event.date), short: formatIsoDateShort(event.date) } : { day: '', short: '' };
}

/** A DJ open on this event's night, read page by page from the fake catalog. */
export async function findDj(repo: MemberlyRepository, eventId: string, name: string): Promise<Dj> {
  let cursor: string | null = null;
  do {
    const page = await repo.getTalent(eventId, { cursor });
    const found = page.djs.find((d) => d.name === name);
    if (found) return found;
    cursor = page.nextCursor;
  } while (cursor);
  throw new Error(`No sample DJ ${name} open for ${eventId}`);
}

/** One of the event's added, unsent offers, as the fake keeps it. The first one if no name is given. */
export async function draftOfferOf(repo: MemberlyRepository, eventId: string, djName?: string): Promise<DraftOffer> {
  const offers = await repo.getDraftOffers(eventId);
  const found = djName ? offers.find((o) => o.dj.name === djName) : offers[0];
  if (!found) throw new Error(`No sample offer${djName ? ` to ${djName}` : ''} on ${eventId}`);
  return found;
}

/** The sample community's membership tiers as Create community's tier editor holds them. */
export function tiersFrom(passes: OrganizerPass[]): TierDraft[] {
  const tiers = passes.filter((p) => p.scope === 'community');
  // Paid tiers first: the editor is only shown for paid membership.
  return [...tiers.filter((p) => p.priceCents != null), ...tiers.filter((p) => p.priceCents == null)].map((p) => ({
    key: `story-${p.id}`,
    name: p.name,
    price: centsToDollarsField(p.priceCents),
    included: p.included,
  }));
}

/**
 * Stand-in for the screen a sheet or dialog rises over: a title and a few
 * muted rows, so the 35% dim behind the sheet is visible. Placeholder only.
 */
export function ScreenBehind({ title = 'Screen behind', children }: { title?: string; children?: ReactNode }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.behind, { backgroundColor: c.background, paddingTop: insets.top + space.md }]}>
      <Text variant="headline">{title}</Text>
      {children ?? (
        <>
          <Skeleton height={150} />
          <Skeleton height={68} />
          <Skeleton height={68} />
          <Skeleton height={68} />
        </>
      )}
    </View>
  );
}

/**
 * A placeholder block for templates: a dashed outline with a one-line label
 * saying what goes there. Layout only; never real content.
 */
export function Slot({ label, height = 68, style }: { label: string; height?: number; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Placeholder: ${label}`}
      style={[styles.slot, { height, borderColor: c.border, backgroundColor: c.card }, style]}>
      <Text variant="secondary" tone="muted" align="center">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  behind: { ...StyleSheet.absoluteFill, paddingHorizontal: space.gutter, gap: space.stack },
  slot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.card,
  },
});

export type TabName = 'Home' | 'Explore' | 'Events' | 'Manage' | 'Me';

const TABS = [
  { name: 'Home', Icon: House },
  { name: 'Explore', Icon: Compass },
  { name: 'Events', Icon: CalendarDays },
  { name: 'Manage', Icon: LayoutGrid },
  { name: 'Me', Icon: User },
] as const;

/**
 * The floating tab bar exactly as the tabs layout (`src/app/(tabs)/_layout.tsx`)
 * draws it, without the router: the same bar style, the same TabButtons, the
 * same inset above the home indicator. Members see four tabs; organizers get Manage.
 */
export function StoryTabBar({
  organizer = true,
  active = 'Home',
  onSelect,
}: {
  organizer?: boolean;
  active?: TabName;
  onSelect?: (tab: TabName) => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[tabBarStyles.bar, { bottom: Math.max(insets.bottom, space.md), backgroundColor: c.card, borderColor: c.border }]}>
      {TABS.filter((t) => organizer || t.name !== 'Manage').map((t) => (
        <TabButton key={t.name} label={t.name} Icon={t.Icon} isFocused={active === t.name} onPress={() => onSelect?.(t.name)} />
      ))}
    </View>
  );
}
