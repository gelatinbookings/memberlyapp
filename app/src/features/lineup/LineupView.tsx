import { router } from 'expo-router';
import { AlertCircle, Check, ChevronRight, Music, Pencil, Plus, RefreshCw } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ErrorState, IconButton, LoadingRows, Notice, Screen, ScreenHeader, Text } from '@/components/ui';
import { useDraftOfferActions, useDraftOffers, useEventBookings, useOrganizerEvent } from '@/data/RepositoryProvider';
import type { Booking, DraftOffer, EventFields } from '@/data/types';
import { lineupSummary } from '@/features/booking/lineupSummary';
import { canSendOffers, sendOffersLabel } from '@/features/booking/offers';
import { shouldPoll } from '@/features/booking/status';
import { addedSummary, lineupUnlocked, locationSummary, whenSummary } from '@/features/events/completeness';
import { useDraftFor } from '@/features/events/EventDraftProvider';
import { openLater } from '@/features/navigation/later';
import { formatIsoDate } from '@/lib/dates';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { AddedDjCard } from './AddedDjCard';
import { BookingCard } from './BookingCard';

export const FEE_FOOTER = 'Each DJ is a separate booking with its own card hold. A $7 Gelatin service fee is added to each one.';
export const ATTRIBUTION = 'DJs, availability and rates from Gelatin';
export const POLL_LINE = 'Updates every few seconds while a DJ is deciding.';

export type LineupState = 'blocked' | 'empty' | 'lineup';

/** Which Lineup screen to show: any booking or added DJ wins; otherwise the night and city decide. */
export function lineupState(fields: Pick<EventFields, 'date' | 'city'>, bookings: unknown[], added: unknown[]): LineupState {
  if (bookings.length > 0 || added.length > 0) return 'lineup';
  return lineupUnlocked(fields) ? 'empty' : 'blocked';
}

/**
 * The Lineup section (GEL-1009): blocked, empty, DJs added, in motion.
 * `eventId` is "new" for an event not saved yet; its date and city come from
 * the Create New Event draft. `fromForm` is true when opened from that form.
 */
export function LineupView({ eventId, fromForm = false }: { eventId: string; fromForm?: boolean }) {
  const isNew = eventId === 'new';
  const saved = isNew ? undefined : eventId;
  const draft = useDraftFor(eventId);
  const event = useOrganizerEvent(draft ? undefined : saved);
  const bookingsQ = useEventBookings(saved);
  const offersQ = useDraftOffers(saved);

  const fields: EventFields | null = draft?.fields ?? event.data ?? null;
  const loading = event.isLoading || bookingsQ.isLoading || offersQ.isLoading;

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Lineup" />
        <LoadingRows count={3} label="Loading your lineup" />
      </Screen>
    );
  }
  if (event.isError || bookingsQ.isError || offersQ.isError) {
    return (
      <Screen>
        <ScreenHeader title="Lineup" />
        <ErrorState
          title="Couldn’t load your lineup"
          detail="Your event is safe and nothing was sent."
          onRetry={() => {
            event.refetch();
            bookingsQ.refetch();
            offersQ.refetch();
          }}
        />
      </Screen>
    );
  }
  if (!fields) {
    return (
      <Screen>
        <ScreenHeader title="Lineup" />
        <ErrorState title="This event isn’t available" detail="It may have been removed." />
      </Screen>
    );
  }

  const bookings = bookingsQ.data ?? [];
  const offers = offersQ.data ?? [];
  const state = lineupState(fields, bookings, offers);

  // Date & time lives in the form. From Manage, open the form first so the change is saved with it.
  const editWhen = () => {
    if (draft) router.push('/organizer/events/when');
    else router.push({ pathname: '/organizer/events/[id]/edit', params: { id: eventId, open: 'when' } });
  };

  // From Manage, a round pencil opens Create New Event for this event; from the form, Back does.
  const onEdit = !fromForm && !isNew ? () => router.push({ pathname: '/organizer/events/[id]/edit', params: { id: eventId } }) : undefined;
  const edit = onEdit ? <EditButton name={fields.name} onPress={onEdit} /> : undefined;

  if (state === 'blocked') {
    return <BlockedLineup fields={fields} isDraft={!event.data || event.data.status === 'draft'} onFix={editWhen} edit={edit} />;
  }
  if (state === 'empty') return <EmptyLineup fields={fields} edit={edit} />;
  return <ActiveLineup eventId={eventId} bookings={bookings} offers={offers} edit={edit} />;
}

function EditButton({ name, onPress }: { name: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <IconButton
      accessibilityLabel={`Edit ${name}`}
      icon={<Pencil size={18} color={c.foreground} strokeWidth={2} />}
      onPress={onPress}
    />
  );
}

function BlockedLineup({
  fields,
  isDraft,
  onFix,
  edit,
}: {
  fields: EventFields;
  isDraft: boolean;
  onFix: () => void;
  edit?: ReactNode;
}) {
  const name = fields.name.trim() || 'New event';
  return (
    <Screen
      testID="lineup-blocked"
      footer={<Notice>You can still save or publish this event. Talent can be added any time before the night.</Notice>}>
      <ScreenHeader title="Lineup" subtitle={isDraft ? `${name} · draft` : name} right={edit} />
      <View style={styles.center}>
        <View style={styles.centerText}>
          <Text variant="headline" align="center" accessibilityRole="header">
            Set the night and the city first
          </Text>
          <Text tone="muted" align="center">
            Gelatin shows DJs who are open on your event’s night in your event’s city. Add both, then come back here.
          </Text>
        </View>
        <ChecklistCard fields={fields} onFix={onFix} />
        <Button label={fields.date ? 'Add a location' : 'Add a date'} onPress={onFix} />
        <Text variant="helper" tone="muted" align="center">
          Browse talent unlocks as soon as both are set.
        </Text>
      </View>
    </Screen>
  );
}

function ChecklistCard({ fields, onFix }: { fields: EventFields; onFix: () => void }) {
  const c = useTheme();
  const rows = [
    {
      title: 'Date & time',
      done: !!fields.date,
      meta: fields.date ? whenSummary(fields) : 'Add a date to see who’s open',
    },
    {
      title: 'Location',
      done: !!fields.city,
      meta: fields.city ? locationSummary(fields) : 'Add a city to see who’s open',
    },
  ];
  return (
    <View style={[styles.checklist, { borderColor: c.border, backgroundColor: c.card }]}>
      {rows.map((r, i) => {
        const content = (
          <>
            <View style={[styles.tick, { backgroundColor: r.done ? c.successBg : c.warningBg }]}>
              {r.done ? (
                <Check size={14} color={c.successText} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={14} color={c.warningText} strokeWidth={2.5} />
              )}
            </View>
            <View style={styles.flex}>
              <Text variant="bodyStrong">{r.title}</Text>
              <Text variant="secondary" tone={r.done ? 'muted' : 'warning'} numberOfLines={1}>
                {r.meta}
              </Text>
            </View>
            {r.done ? null : <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />}
          </>
        );
        const rowStyle = [styles.checkRow, i > 0 ? { borderTopWidth: 1, borderTopColor: c.border } : null];
        return r.done ? (
          <View key={r.title} style={rowStyle} accessible accessibilityLabel={`${r.title}, done. ${r.meta}`}>
            {content}
          </View>
        ) : (
          <Pressable key={r.title} accessibilityRole="button" accessibilityLabel={`${r.title}. ${r.meta}`} onPress={onFix} style={rowStyle}>
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyLineup({ fields, edit }: { fields: EventFields; edit?: ReactNode }) {
  const c = useTheme();
  const day = formatIsoDate(fields.date!);
  const city = fields.city!.name;
  return (
    <Screen
      testID="lineup-empty"
      footer={
        <Notice title="No lineup right now?">
          Create the event without talent and add DJs later. Nothing is sent and nothing is charged.
        </Notice>
      }>
      <ScreenHeader title="Lineup" subtitle={[fields.name.trim() || 'New event', day, city].join(' · ')} right={edit} />
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: c.tint }]}>
          <Music size={30} color={c.brandText} strokeWidth={2} />
        </View>
        <View style={styles.centerText}>
          <Text variant="headline" align="center" accessibilityRole="header">
            No talent booked yet
          </Text>
          <Text tone="muted" align="center">
            See which DJs are open on {day} in {city}. You offer a fee and hold your card, and you’re only charged if the
            DJ accepts.
          </Text>
        </View>
        <Button label="Browse talent" onPress={() => openLater('Browse talent', 'browse')} style={styles.full} />
        <Text variant="helper" tone="muted" align="center">
          {ATTRIBUTION}
        </Text>
      </View>
    </Screen>
  );
}

function ActiveLineup({
  eventId,
  bookings,
  offers,
  edit,
}: {
  eventId: string;
  bookings: Booking[];
  offers: DraftOffer[];
  edit?: ReactNode;
}) {
  const c = useTheme();
  const actions = useDraftOfferActions(eventId);
  const polling = bookings.some((b) => shouldPoll(b.status));
  const subtitle = bookings.length > 0 ? lineupSummary(bookings) : addedSummary(offers.length);
  const ready = canSendOffers(offers);

  const footer =
    offers.length > 0 ? (
      <>
        <Text variant="helper" tone="muted" align="center">
          {FEE_FOOTER}
        </Text>
        <Button
          testID="send-offers"
          label={sendOffersLabel(offers.length)}
          disabled={!ready}
          accessibilityHint={ready ? undefined : 'Enter a fee for every DJ first'}
          onPress={() => openLater('Review your offers', 'offer')}
        />
        <Text variant="helper" tone="muted" align="center">
          {ATTRIBUTION}
        </Text>
      </>
    ) : undefined;

  return (
    <Screen testID={bookings.length > 0 ? 'lineup-motion' : 'lineup-added'} footer={footer} contentStyle={styles.tight}>
      <View style={styles.header}>
        <ScreenHeader
          title="Lineup"
          subtitle={subtitle}
          right={
            <View style={styles.headActions}>
              {edit}
              <IconButton
                accessibilityLabel="Add more talent"
                icon={<Plus size={18} color={c.foreground} strokeWidth={2} />}
                onPress={() => openLater('Browse talent', 'browse')}
              />
            </View>
          }
        />
      </View>
      {bookings.map((b) => (
        <BookingCard key={b.requestId} booking={b} />
      ))}
      {polling ? (
        <View style={styles.poll} testID="poll-line">
          <RefreshCw size={12} color={c.mutedText} strokeWidth={2} />
          <Text variant="helper" tone="muted">
            {POLL_LINE}
          </Text>
        </View>
      ) : null}
      {offers.map((o) => (
        <AddedDjCard
          key={o.dj.id}
          offer={o}
          onChange={(patch) => actions.update(o.dj.id, patch)}
          onRemove={() => actions.remove(o.dj.id)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { flex: 1, justifyContent: 'center', gap: space.md },
  centerText: { gap: space.sm, paddingHorizontal: space.sm, alignItems: 'center' },
  badge: { width: 72, height: 72, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  full: { alignSelf: 'stretch' },
  checklist: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.row, padding: space.card, minHeight: 44 },
  tick: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: space.sm },
  headActions: { flexDirection: 'row', gap: space.sm },
  poll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tight: { gap: space.stack },
});
