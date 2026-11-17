import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Clock,
  Music,
  Pencil,
  Plus,
  RefreshCw,
  WifiOff,
} from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  Button,
  ErrorState,
  IconButton,
  LoadingRows,
  Notice,
  Screen,
  ScreenHeader,
  Text,
} from "@/components/ui";
import {
  queryKeys,
  useBookingsFreshness,
  useDraftOfferActions,
  useDraftOffers,
  useEventBookings,
  useOrganizerEvent,
  useRepository,
  useSaveEvent,
} from "@/data/RepositoryProvider";
import type { Booking, Dj, DraftOffer, EventFields } from "@/data/types";
import {
  LAST_UPDATED_TICK_MS,
  lastUpdatedLabel,
} from "@/features/booking/freshness";
import {
  lineupSummary,
  unbrokenParts,
} from "@/features/booking/lineupSummary";
import { canSendOffers, sendOffersLabel } from "@/features/booking/offers";
import { shouldPoll, statusUi } from "@/features/booking/status";
import {
  addedSummary,
  lineupUnlocked,
  locationSummary,
  whenSummary,
} from "@/features/events/completeness";
import {
  useDraftFor,
  useEventDraft,
} from "@/features/events/EventDraftProvider";
import {
  CONFIRMING_HOLD,
  OFFLINE_OFFERS_NOTICE,
  PAYMENT_UNAVAILABLE,
} from "@/features/offers/copy";
import { BACK_FROM_GELATIN } from "@/features/handoff/copy";
import { GelatinHandoffHost } from "@/features/handoff/GelatinHandoffHost";
import {
  useGelatinHandoff,
  type GelatinHandoff,
} from "@/features/handoff/useGelatinHandoff";
import { OfferFlowHost } from "@/features/offers/OfferFlowHost";
import { useOfferFlow } from "@/features/offers/useOfferFlow";
import { formatIsoDate, formatIsoDateShort } from "@/lib/dates";
import { usePortalReturn } from "@/lib/portal";
import { useQueryOnline } from "@/lib/queryClient";
import { useTheme } from "@/theme/theme";
import { radius, space } from "@/theme/tokens";

import { AddedDjCard } from "./AddedDjCard";
import { setTimesFor, withSetTimes } from "./setTimes";
import { AlternatesSheet } from "./AlternatesSheet";
import { BookingCard } from "./BookingCard";

export const FEE_FOOTER =
  "Each DJ is a separate booking with its own card hold. A $7 Gelatin service fee is added to each one.";
export const ATTRIBUTION = "DJs, availability and rates from Gelatin";
export const POLL_LINE = "Updates every few seconds while a DJ is deciding.";

export const SAVES_DRAFT_LINE =
  "Browsing talent saves this event as a draft first, so Gelatin knows the night and city.";
export const SAVE_FIRST_NOTICE =
  "Save your new date or city first. Talent is matched to the night and city saved on this event.";
export const SAVE_FAILED_NOTICE =
  "Couldn’t save your draft, so talent can’t load yet. Try again.";

export type LineupState = "blocked" | "empty" | "lineup";

/** What the Browse talent buttons need: the action, whether a save is running, and anything to say first. */
type Browse = { open: () => void; pending: boolean; notice: string | null };

/**
 * How current the bookings on screen are. `polling`: the list is asking again
 * every few seconds. `behind`: it may be out of date (the backend's last known
 * body, a refresh that failed, or no connection) and `since` is when a current
 * answer last arrived.
 */
type Freshness = { polling: boolean; behind: boolean; since: number | null };

/** Which Lineup screen to show: any booking or added DJ wins; otherwise the night and city decide. */
export function lineupState(
  fields: Pick<EventFields, "date" | "city">,
  bookings: unknown[],
  added: unknown[],
): LineupState {
  if (bookings.length > 0 || added.length > 0) return "lineup";
  return lineupUnlocked(fields) ? "empty" : "blocked";
}

/**
 * The Lineup section (GEL-1009): blocked, empty, DJs added, in motion.
 * `eventId` is "new" for an event not saved yet; its date and city come from
 * the Create New Event draft. `fromForm` is true when opened from that form.
 */
export function LineupView({
  eventId,
  fromForm = false,
  focused = true,
}: {
  eventId: string;
  fromForm?: boolean;
  /** False while another screen is in front of this one: the Lineup stops polling until it is back. */
  focused?: boolean;
}) {
  // A new event gets its id the first time Browse talent saves it as a draft.
  const [savedAs, setSavedAs] = useState<string | null>(null);
  const id = savedAs ?? eventId;
  const isNew = id === "new";
  const saved = isNew ? undefined : id;
  const draft = useDraftFor(id);
  const { rekey } = useEventDraft();
  const event = useOrganizerEvent(saved);
  // The hand-off and the alternates sheet are held here, above every lineup state, so a status
  // changing underneath (or the list emptying) never takes an open sheet or the portal with it.
  const handoff = useGelatinHandoff({ eventId: saved });
  const [alternatesFor, setAlternatesFor] = useState<Booking | null>(null);
  const { takeReturn } = usePortalReturn();
  const online = useQueryOnline();
  // Status is polled only while this screen is in front and Gelatin's portal is not over it (GEL-1022).
  const live = focused && !handoff.portalOpen;
  const bookingsQ = useEventBookings(saved, { live });
  const { behind, since } = useBookingsFreshness(saved, !online);
  const offersQ = useDraftOffers(saved);
  const repo = useRepository();
  const qc = useQueryClient();
  const save = useSaveEvent();
  const [saveFirst, setSaveFirst] = useState(false);

  // Back in front: read the bookings once, at once. If the organizer has just come back from
  // Gelatin (the return link, or a hand-off started from another screen), say so after that read.
  const { arrived } = handoff;
  const { refetch: refetchBookings } = bookingsQ;
  const wasFocused = useRef(focused);
  useEffect(() => {
    const returning = focused && !wasFocused.current;
    wasFocused.current = focused;
    if (!focused || !saved) return;
    if (takeReturn(saved)) void arrived();
    else if (returning) void refetchBookings();
  }, [focused, saved, takeReturn, arrived, refetchBookings]);

  // The open draft wins over the saved event; the saved one only says what Gelatin will be asked for.
  const fields: EventFields | null = draft?.fields ?? event.data ?? null;
  const loading =
    (!draft && event.isLoading) || bookingsQ.isLoading || offersQ.isLoading;

  if (loading) {
    return (
      <Screen header={<ScreenHeader title="Lineup" />}>
        <LoadingRows count={3} label="Loading your lineup" />
      </Screen>
    );
  }
  // Only a first load that failed is an error screen. A refresh that fails keeps the last known lineup.
  if (
    (!draft && event.isError && !event.data) ||
    (bookingsQ.isError && !bookingsQ.data) ||
    (offersQ.isError && !offersQ.data)
  ) {
    return (
      <Screen header={<ScreenHeader title="Lineup" />}>
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
      <Screen header={<ScreenHeader title="Lineup" />}>
        <ErrorState
          title="This event isn’t available"
          detail="It may have been removed."
        />
      </Screen>
    );
  }

  const bookings = bookingsQ.data ?? [];
  const offers = offersQ.data ?? [];
  const state = lineupState(fields, bookings, offers);

  // Date & time lives in the form. From Manage, open the form first so the change is saved with it.
  const editWhen = () => {
    if (draft) router.push("/organizer/events/when");
    else
      router.push({
        pathname: "/organizer/events/[id]/edit",
        params: { id, open: "when" },
      });
  };

  // From Manage, a round pencil opens Create New Event for this event; from the form, Back does.
  const onEdit =
    !fromForm && !isNew
      ? () =>
          router.push({
            pathname: "/organizer/events/[id]/edit",
            params: { id },
          })
      : undefined;
  const edit = onEdit ? (
    <EditButton name={fields.name} onPress={onEdit} />
  ) : undefined;

  // Browse talent (GEL-1012) reads the night and city from the saved event, so an unsaved one is saved as a draft first.
  const toBrowse = (to: string) =>
    router.push({
      pathname: "/organizer/events/[id]/browse",
      params: { id: to },
    });
  const openBrowse = async () => {
    if (!draft) return toBrowse(id);
    if (!isNew) {
      const stored = event.data;
      const nightChanged =
        !!stored &&
        (stored.date !== draft.fields.date ||
          stored.city?.id !== draft.fields.city?.id);
      if (!nightChanged) return toBrowse(id);
      // A live event's date is never changed behind the organizer's back.
      if (stored.status === "published") return setSaveFirst(true);
    }
    // A new event belongs to the organizer's community, as it does when the form saves it.
    const communityId =
      draft.communityId ||
      (await qc
        .ensureQueryData({
          queryKey: queryKeys.organized,
          queryFn: () => repo.getOrganizedCommunities(),
        })
        .then(
          (list) => list[0]?.id ?? "",
          () => "",
        ));
    save.mutate(
      { id: saved, communityId, fields: draft.fields, publish: false },
      {
        onSuccess: (e) => {
          rekey(e.id);
          setSavedAs(e.id);
          toBrowse(e.id);
        },
      },
    );
  };
  const browse: Browse = {
    open: openBrowse,
    pending: save.isPending,
    notice: save.isError
      ? SAVE_FAILED_NOTICE
      : saveFirst
        ? SAVE_FIRST_NOTICE
        : null,
  };

  const other =
    state === "blocked" ? (
      <BlockedLineup
        fields={fields}
        isDraft={!event.data || event.data.status === "draft"}
        onFix={editWhen}
        edit={edit}
      />
    ) : state === "empty" ? (
      <EmptyLineup
        fields={fields}
        edit={edit}
        browse={browse}
        savesDraft={isNew}
      />
    ) : null;
  // An unsaved event has no offers to send yet.
  if (isNew && other) return other;
  return (
    <LineupWithOffers
      eventId={id}
      fields={fields}
      bookings={bookings}
      offers={offers}
      edit={edit}
      browse={browse}
      other={other}
      handoff={handoff}
      alternatesFor={alternatesFor}
      onAlternates={setAlternatesFor}
      onEditWhen={editWhen}
      freshness={{
        polling: live && online && !behind && bookings.some((b) => shouldPoll(b.status)),
        behind,
        since,
      }}
    />
  );
}

/**
 * A saved event's Lineup in any state, with the offer flow above it. The flow
 * sits here, not in the list, so its sheets (Card held, DJ taken) survive the
 * list emptying underneath them, as it does when the only DJ's draft goes.
 * The alternates sheet and the hand-off to Gelatin are drawn here too, from
 * state LineupView holds, for the same reason.
 */
function LineupWithOffers({
  eventId,
  fields,
  bookings,
  offers,
  edit,
  browse,
  other,
  handoff,
  alternatesFor,
  onAlternates,
  onEditWhen,
  freshness,
}: {
  eventId: string;
  fields: EventFields;
  bookings: Booking[];
  offers: DraftOffer[];
  edit?: ReactNode;
  browse: Browse;
  /** The blocked or empty screen, when there is nothing in the lineup. */
  other: ReactNode;
  handoff: GelatinHandoff;
  /** The ended booking whose alternates sheet is open. */
  alternatesFor: Booking | null;
  onAlternates: (booking: Booking | null) => void;
  /** Open Date & time. */
  onEditWhen: () => void;
  freshness: Freshness;
}) {
  const eventName = fields.name.trim() || "New event";
  const flow = useOfferFlow({ eventId, eventName, bookings, offers });
  const actions = useDraftOfferActions(eventId);
  const closeAlternates = () => onAlternates(null);
  return (
    <View style={styles.fill}>
      {other ?? (
        <ActiveLineup
          eventId={eventId}
          fields={fields}
          bookings={bookings}
          offers={offers}
          edit={edit}
          browse={browse}
          flow={flow}
          onManage={handoff.open}
          onAlternates={onAlternates}
          backFromGelatin={handoff.back && !freshness.behind}
          freshness={freshness}
        />
      )}
      <OfferFlowHost
        flow={flow}
        eventId={eventId}
        eventName={eventName}
        day={fields.date ? formatIsoDate(fields.date) : ""}
        onBrowse={browse.open}
      />
      {alternatesFor ? (
        <AlternatesSheet
          eventId={eventId}
          booking={alternatesFor}
          shortDay={fields.date ? formatIsoDateShort(fields.date) : ""}
          onOffer={(dj: Dj) => {
            // The DJ joins the lineup as an unsent offer; the booking that ended stays where it is.
            actions.add(dj).catch(() => undefined);
            closeAlternates();
          }}
          onSeeEveryone={() => {
            closeAlternates();
            browse.open();
          }}
          onSearchDate={() => {
            closeAlternates();
            onEditWhen();
          }}
          onClose={closeAlternates}
        />
      ) : null}
      <GelatinHandoffHost
        handoff={handoff}
        eventName={eventName}
        bookings={bookings}
      />
    </View>
  );
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
  const name = fields.name.trim() || "New event";
  return (
    <Screen
      header={
        <ScreenHeader
          title="Lineup"
          subtitle={isDraft ? `${name} · draft` : name}
          right={edit}
        />
      }
      testID="lineup-blocked"
      footer={
        <Notice>
          You can still save or publish this event. Talent can be added any time
          before the night.
        </Notice>
      }
    >
      <View style={styles.center}>
        <View style={styles.centerText}>
          <Text variant="headline" align="center" accessibilityRole="header">
            Set the night and the city first
          </Text>
          <Text tone="muted" align="center">
            Gelatin shows DJs who are open on your event’s night in your event’s
            city. Add both, then come back here.
          </Text>
        </View>
        <ChecklistCard fields={fields} onFix={onFix} />
        <Button
          label={fields.date ? "Add a location" : "Add a date"}
          onPress={onFix}
        />
        <Text variant="helper" tone="muted" align="center">
          Browse talent unlocks as soon as both are set.
        </Text>
      </View>
    </Screen>
  );
}

function ChecklistCard({
  fields,
  onFix,
}: {
  fields: EventFields;
  onFix: () => void;
}) {
  const c = useTheme();
  const rows = [
    {
      title: "Date & time",
      done: !!fields.date,
      meta: fields.date ? whenSummary(fields) : "Add a date to see who’s open",
    },
    {
      title: "Location",
      done: !!fields.city,
      meta: fields.city
        ? locationSummary(fields)
        : "Add a city to see who’s open",
    },
  ];
  return (
    <View
      style={[
        styles.checklist,
        { borderColor: c.border, backgroundColor: c.card },
      ]}
    >
      {rows.map((r, i) => {
        const content = (
          <>
            <View
              style={[
                styles.tick,
                { backgroundColor: r.done ? c.successBg : c.warningBg },
              ]}
            >
              {r.done ? (
                <Check size={14} color={c.successText} strokeWidth={2.5} />
              ) : (
                <AlertCircle
                  size={14}
                  color={c.warningText}
                  strokeWidth={2.5}
                />
              )}
            </View>
            <View style={styles.flex}>
              <Text variant="bodyStrong">{r.title}</Text>
              <Text
                variant="secondary"
                tone={r.done ? "muted" : "warning"}
                numberOfLines={1}
              >
                {r.meta}
              </Text>
            </View>
            {r.done ? null : (
              <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />
            )}
          </>
        );
        const rowStyle = [
          styles.checkRow,
          i > 0 ? { borderTopWidth: 1, borderTopColor: c.border } : null,
        ];
        return r.done ? (
          <View
            key={r.title}
            style={rowStyle}
            accessible
            accessibilityLabel={`${r.title}, done. ${r.meta}`}
          >
            {content}
          </View>
        ) : (
          <Pressable
            key={r.title}
            accessibilityRole="button"
            accessibilityLabel={`${r.title}. ${r.meta}`}
            onPress={onFix}
            style={rowStyle}
          >
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyLineup({
  fields,
  edit,
  browse,
  savesDraft,
}: {
  fields: EventFields;
  edit?: ReactNode;
  browse: Browse;
  /** True for an event not saved yet: Browse talent saves it as a draft first. */
  savesDraft: boolean;
}) {
  const c = useTheme();
  const day = formatIsoDate(fields.date!);
  const city = fields.city!.name;
  return (
    <Screen
      header={
        <ScreenHeader
          title="Lineup"
          subtitle={[fields.name.trim() || "New event", day, city].join(" · ")}
          right={edit}
        />
      }
      testID="lineup-empty"
      footer={
        <Notice title="No lineup right now?">
          Create the event without talent and add DJs later. Nothing is sent and
          nothing is charged.
        </Notice>
      }
    >
      <View style={styles.center}>
        <View style={[styles.badge, { backgroundColor: c.tint }]}>
          <Music size={30} color={c.brandText} strokeWidth={2} />
        </View>
        <View style={styles.centerText}>
          <Text variant="headline" align="center" accessibilityRole="header">
            No talent booked yet
          </Text>
          <Text tone="muted" align="center">
            See which DJs are open on {day} in {city}. You offer a fee and hold
            your card, and you’re only charged if the DJ accepts.
          </Text>
        </View>
        {browse.notice ? <Notice tone="warning">{browse.notice}</Notice> : null}
        <Button
          label="Browse talent"
          loading={browse.pending}
          onPress={browse.open}
          style={styles.full}
        />
        {savesDraft ? (
          <Text variant="helper" tone="muted" align="center">
            {SAVES_DRAFT_LINE}
          </Text>
        ) : null}
        <Text variant="helper" tone="muted" align="center">
          {ATTRIBUTION}
        </Text>
      </View>
    </Screen>
  );
}

function ActiveLineup({
  eventId,
  fields,
  bookings,
  offers,
  edit,
  browse,
  flow,
  onManage,
  onAlternates,
  backFromGelatin,
  freshness,
}: {
  eventId: string;
  /** The event's times, which the suggested sets start from. */
  fields: EventFields;
  bookings: Booking[];
  offers: DraftOffer[];
  edit?: ReactNode;
  browse: Browse;
  flow: ReturnType<typeof useOfferFlow>;
  /** Manage in Gelatin, or Review the new offer in Gelatin, for one booking. */
  onManage: (booking: Booking) => void;
  /** Other DJs open that night, for a booking that is over. */
  onAlternates: (booking: Booking) => void;
  /** The organizer has just come back from Gelatin and the lineup has been read again. */
  backFromGelatin: boolean;
  freshness: Freshness;
}) {
  const c = useTheme();
  const actions = useDraftOfferActions(eventId);
  // Each added DJ's set: chosen, or suggested back to back from the event's start.
  const sets = setTimesFor(offers, fields);
  // Bookings still in play come first, then DJs added but not sent, then bookings that are over.
  const ended = (b: Booking) => statusUi(b.status).action === "other_djs";
  const card = (b: Booking) => (
    <BookingCard
      key={`booking:${b.requestId}`}
      booking={b}
      onPay={() => flow.pay(b)}
      paying={flow.payingId === b.requestId}
      paymentFailed={flow.paymentFailed(b.requestId)}
      onManage={() => onManage(b)}
      onAlternates={() => onAlternates(b)}
    />
  );
  const subtitle =
    bookings.length > 0
      ? unbrokenParts(lineupSummary(bookings))
      : addedSummary(offers.length);
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
          disabled={!ready || flow.queued}
          accessibilityHint={
            ready ? undefined : "Enter a fee for every DJ first"
          }
          onPress={() => {
            // The fee field may still have the keyboard up.
            Keyboard.dismiss();
            flow.start(withSetTimes(offers, fields));
          }}
        />
        <Text variant="helper" tone="muted" align="center">
          {ATTRIBUTION}
        </Text>
      </>
    ) : undefined;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Lineup"
          subtitle={subtitle}
          subtitleLines={2}
          right={
            <View style={styles.headActions}>
              {edit}
              <IconButton
                accessibilityLabel="Add more talent"
                icon={<Plus size={18} color={c.foreground} strokeWidth={2} />}
                onPress={browse.open}
              />
            </View>
          }
        />
      }
      testID={bookings.length > 0 ? "lineup-motion" : "lineup-added"}
      footer={footer}
      contentStyle={styles.tight}
    >
      {backFromGelatin ? <BackFromGelatin /> : null}
      {browse.notice ? <Notice tone="warning">{browse.notice}</Notice> : null}
      {flow.queued ? (
        <Notice
          icon={<WifiOff size={16} color={c.mutedText} strokeWidth={2} />}
        >
          {OFFLINE_OFFERS_NOTICE}
        </Notice>
      ) : null}
      {flow.notice ? (
        <Notice>
          {flow.notice === "confirming" ? CONFIRMING_HOLD : PAYMENT_UNAVAILABLE}
        </Notice>
      ) : null}
      {
        // One keyed list, so a card that moves down when its booking ends is the same card:
        // its pill fades to the new status and the change is announced.
        [
          ...bookings.filter((b) => !ended(b)).map(card),
          ...offers.map((o, i) => (
            <AddedDjCard
              key={`added:${o.dj.id}`}
              offer={o}
              setTime={sets[i]}
              eventStart={fields.startTime}
              zone={fields.city?.timeZone ?? null}
              onChange={(patch) => actions.update(o.dj.id, patch)}
              onRemove={() => actions.remove(o.dj.id)}
            />
          )),
          ...bookings.filter(ended).map(card),
        ]
      }
      {freshness.polling ? (
        <View style={styles.poll} testID="poll-line">
          <RefreshCw size={12} color={c.mutedText} strokeWidth={2} />
          <Text variant="helper" tone="muted">
            {POLL_LINE}
          </Text>
        </View>
      ) : null}
      {freshness.behind && bookings.length > 0 ? (
        <LastUpdated since={freshness.since} />
      ) : null}
    </Screen>
  );
}

/** The "Back from Gelatin" notice (the PortalReturn board), spoken once as it appears. */
function BackFromGelatin() {
  const c = useTheme();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(BACK_FROM_GELATIN);
  }, []);
  return (
    <View testID="back-from-gelatin">
      <Notice
        tone="tint"
        icon={<Check size={16} color={c.brandText} strokeWidth={2} />}
      >
        {BACK_FROM_GELATIN}
      </Notice>
    </View>
  );
}

/**
 * "Last updated 2 min ago": the lineup on screen is the last one the app has,
 * and may be behind. Quiet, under the cards; never an error screen.
 */
function LastUpdated({ since }: { since: number | null }) {
  const c = useTheme();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), LAST_UPDATED_TICK_MS);
    return () => clearInterval(tick);
  }, []);
  return (
    <View style={styles.poll} testID="last-updated">
      <Clock size={12} color={c.mutedText} strokeWidth={2} />
      <Text variant="helper" tone="muted">
        {lastUpdatedLabel(since, Math.max(now, since ?? 0))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: "center", gap: space.md },
  centerText: {
    gap: space.sm,
    paddingHorizontal: space.sm,
    alignItems: "center",
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  full: { alignSelf: "stretch" },
  checklist: { borderWidth: 1, borderRadius: radius.card, overflow: "hidden" },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.row,
    padding: space.card,
    minHeight: 44,
  },
  tick: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  headActions: { flexDirection: "row", gap: space.sm },
  poll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tight: { gap: space.stack },
});
