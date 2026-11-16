import { Bell, CalendarOff, Check, MapPin, RefreshCw, SlidersHorizontal, WifiOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Notice, Skeleton, Text } from '@/components/ui';
import { useCityWaitlist, useTalentCount } from '@/data/RepositoryProvider';
import type { TalentFilters } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { radius, size, space } from '@/theme/tokens';

import { ANY_BUDGET, ANY_GENRE, loosenLabel, NO_FILTERS, showAllLabel, tooTightBody } from './filters';

export const TALENT_ATTRIBUTION = 'DJs, availability and rates from Gelatin';

/** The attribution under every view of the catalog. */
export function Attribution() {
  return (
    <Text variant="helper" tone="muted" align="center">
      {TALENT_ATTRIBUTION}
    </Text>
  );
}

/** A centred state: round badge, one heading, one line, then the way out. */
function CenteredState({
  icon,
  tone = 'muted',
  title,
  body,
  children,
  testID,
}: {
  icon: ReactNode;
  tone?: 'muted' | 'error';
  title: string;
  body: string;
  children?: ReactNode;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <View style={styles.center} testID={testID}>
      <View style={[styles.badge, { backgroundColor: tone === 'error' ? c.errorBg : c.muted }]}>{icon}</View>
      <View style={styles.copy}>
        <Text variant="headline" align="center" accessibilityRole="header">
          {title}
        </Text>
        <Text tone="muted" align="center">
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** A quiet text action under a primary button. 44pt tall. */
function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.link}>
      <Text variant="bodyStrong" tone="brand">
        {label}
      </Text>
    </Pressable>
  );
}

/** Loading (GEL-1015): four skeleton cards in the muted colour. Never a spinner over a blank screen. */
export function TalentSkeleton() {
  const c = useTheme();
  const rows: { name: `${number}%`; meta: `${number}%` }[] = [
    { name: '44%', meta: '62%' },
    { name: '56%', meta: '48%' },
    { name: '38%', meta: '70%' },
    { name: '50%', meta: '55%' },
  ];
  return (
    <View testID="talent-loading" accessible accessibilityLabel="Finding DJs" accessibilityState={{ busy: true }} style={styles.skeletons}>
      <View style={styles.skeletonChips}>
        <Skeleton height={38} width={84} round />
        <Skeleton height={38} width={104} round />
        <Skeleton height={38} width={96} round />
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.skeletonCard, { borderColor: c.border, backgroundColor: c.card }]}>
          <View style={styles.skeletonTop}>
            <Skeleton height={52} width={52} round />
            <View style={styles.skeletonLines}>
              <Skeleton height={14} width={r.name} round />
              <Skeleton height={12} width={r.meta} round />
            </View>
          </View>
          <View style={styles.skeletonBottom}>
            <Skeleton height={16} width={56} round />
            <Skeleton height={40} width={72} round />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * City not served (GEL-1015): Gelatin has no coverage here yet. Notify me
 * joins the city waitlist once; the event can go on without talent.
 */
export function NoCityState({ city, isDraft, onContinue }: { city: string; isDraft: boolean; onContinue: () => void }) {
  const c = useTheme();
  const waitlist = useCityWaitlist(city);
  return (
    <CenteredState
      testID="talent-no-city"
      icon={<MapPin size={30} color={c.mutedText} strokeWidth={2} />}
      title={`No DJs in ${city} yet`}
      body={`Gelatin doesn’t book talent in ${city} right now. Tap Notify me and we’ll tell you the moment it opens.`}>
      {waitlist.joined ? (
        <View
          testID="notify-confirmed"
          accessible
          accessibilityLabel="We’ll let you know"
          style={[styles.confirmed, { borderColor: c.border }]}>
          <Text variant="cardTitle">We’ll let you know</Text>
          <Check size={18} color={c.successText} strokeWidth={2.5} />
        </View>
      ) : (
        <Button
          testID="notify-me"
          label="Notify me"
          icon={<Bell size={18} color={c.onBrand} strokeWidth={2} />}
          loading={waitlist.pending}
          onPress={waitlist.join}
          style={styles.full}
        />
      )}
      {waitlist.failed ? (
        <Text variant="secondary" tone="error" align="center">
          That didn’t go through. Try again.
        </Text>
      ) : null}
      <TextLink label={isDraft ? 'Create the event without talent' : 'Continue without talent'} onPress={onContinue} />
    </CenteredState>
  );
}

/**
 * Catalog unavailable or offline (GEL-1015). The event is untouched; Try again
 * re-reads behind the skeleton cards, and an offline read runs by itself when
 * the connection returns.
 */
export function UnavailableState({
  offline,
  onRetry,
  onContinue,
}: {
  offline: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const c = useTheme();
  return (
    <CenteredState
      testID={offline ? 'talent-offline' : 'talent-unavailable'}
      tone="error"
      icon={<WifiOff size={30} color={c.errorText} strokeWidth={2} />}
      title={offline ? 'You’re offline' : 'Talent is unavailable right now'}
      body={
        offline
          ? 'Your event is safe and nothing was sent. DJs load by themselves as soon as you’re back online.'
          : 'We couldn’t reach Gelatin. Your event is safe and nothing was sent. Try again in a moment.'
      }>
      <Button
        testID="talent-retry"
        label="Try again"
        icon={<RefreshCw size={18} color={c.onBrand} strokeWidth={2} />}
        onPress={onRetry}
        style={styles.full}
      />
      <TextLink label="Continue without talent" onPress={onContinue} />
    </CenteredState>
  );
}

/** Under the unavailable state: what a catalog outage does not touch. */
export function UnavailableFooter() {
  return <Notice>DJs you already booked keep their status. Any card hold stays exactly as it was.</Notice>;
}

/**
 * Filters too tight (GEL-1013): nobody matches, so say what is open and offer
 * one-tap ways to loosen. A loosening that would still show nobody is left out.
 */
export function TooTightState({
  eventId,
  filters,
  day,
  onChange,
}: {
  eventId: string;
  filters: TalentFilters;
  day: string;
  onChange: (next: TalentFilters) => void;
}) {
  const c = useTheme();
  const both = filters.budget != null && filters.genre != null;
  const all = useTalentCount(eventId, NO_FILTERS);
  const anyBudget = useTalentCount(eventId, { budget: null, genre: filters.genre }, both);
  const anyGenre = useTalentCount(eventId, { budget: filters.budget, genre: null }, both);
  return (
    <CenteredState
      testID="talent-too-tight"
      icon={<SlidersHorizontal size={30} color={c.mutedText} strokeWidth={2} />}
      title="No one matches all of that"
      body={tooTightBody(all.data, day, filters)}>
      {both ? (
        <View style={styles.loosen}>
          {anyBudget.data === 0 ? null : (
            <Button
              testID="loosen-budget"
              variant="secondary"
              label={loosenLabel(ANY_BUDGET, anyBudget.data)}
              onPress={() => onChange({ ...filters, budget: null })}
              style={styles.flex}
            />
          )}
          {anyGenre.data === 0 ? null : (
            <Button
              testID="loosen-genre"
              variant="secondary"
              label={loosenLabel(ANY_GENRE, anyGenre.data)}
              onPress={() => onChange({ ...filters, genre: null })}
              style={styles.flex}
            />
          )}
        </View>
      ) : null}
      <Button testID="show-all" label={showAllLabel(all.data)} onPress={() => onChange(NO_FILTERS)} style={styles.full} />
    </CenteredState>
  );
}

/** Nobody is open that night, with no filters on. No reason is given. */
export function NoneOpenState({ city, day, onContinue }: { city: string; day: string; onContinue: () => void }) {
  const c = useTheme();
  return (
    <CenteredState
      testID="talent-none-open"
      icon={<CalendarOff size={30} color={c.mutedText} strokeWidth={2} />}
      title="No DJs open that night"
      body={`Nobody in ${city} is open on ${day} right now. Check back later, or pick another night in Date & time.`}>
      <TextLink label="Continue without talent" onPress={onContinue} />
    </CenteredState>
  );
}

/** Browse opened for an event with no night or city yet, or one that is gone. */
export function NotReadyState({ missing, onBack }: { missing: boolean; onBack: () => void }) {
  const c = useTheme();
  return (
    <CenteredState
      testID="talent-not-ready"
      icon={<CalendarOff size={30} color={c.mutedText} strokeWidth={2} />}
      title={missing ? 'This event isn’t available' : 'Set the night and the city first'}
      body={
        missing
          ? 'It may have been removed.'
          : 'Gelatin shows DJs who are open on your event’s night in your event’s city. Add both, then come back here.'
      }>
      <Button label="Back to your lineup" variant="secondary" onPress={onBack} style={styles.full} />
    </CenteredState>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md, paddingHorizontal: space.sm },
  badge: { width: 72, height: 72, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: space.sm, alignItems: 'center' },
  full: { alignSelf: 'stretch' },
  flex: { flex: 1 },
  link: { minHeight: size.minTarget, justifyContent: 'center', paddingHorizontal: space.sm },
  loosen: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch' },
  confirmed: {
    alignSelf: 'stretch',
    height: size.primaryButton,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  skeletons: { gap: space.stack },
  skeletonChips: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
  skeletonCard: { borderWidth: 1, borderRadius: radius.card, padding: space.row, gap: space.row },
  skeletonTop: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  skeletonLines: { flex: 1, gap: space.sm },
  skeletonBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
