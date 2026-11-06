import { router } from 'expo-router';
import { Clock, Image as ImageIcon, MapPin, Music, Ticket } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorState, LoadingRows, Notice, Screen, ScreenHeader, Sheet } from '@/components/ui';
import {
  useDraftOffers,
  useEventBookings,
  useOrganizedCommunities,
  useOrganizerEvent,
  useSaveEvent,
} from '@/data/RepositoryProvider';
import type { EventFields, OrganizerEventDetail } from '@/data/types';
import { draftHoldNotice } from '@/features/booking/statusLine';
import { openLater } from '@/features/navigation/later';
import { space } from '@/theme/tokens';

import {
  detailsComplete,
  detailsSummary,
  EMPTY_FIELDS,
  lineupCardSummary,
  locationComplete,
  locationSummary,
  publishBlocker,
  SECTION_TITLES,
  whenComplete,
  whenSummary,
} from './completeness';
import { useEventDraft } from './EventDraftProvider';
import { SectionCard } from './SectionCard';

export const NO_LINEUP_NOTICE =
  'You can publish without a lineup. Nothing is sent to a DJ and nothing is charged until you pay for an offer.';

function fieldsOf(e: OrganizerEventDetail): EventFields {
  const { name, tagline, description, cover, date, startTime, endTime, venue, city } = e;
  return { name, tagline, description, cover, date, startTime, endTime, venue, city };
}

function backToManage() {
  router.dismissTo('/manage');
}

/**
 * Create New Event (GEL-1008), shared by /organizer/events/new and
 * /organizer/events/[id]/edit. Five sections; Lineup and Access & passes never
 * block publishing. `open="when"` jumps straight to Date & time.
 */
export function EventFormScreen({ eventId, open }: { eventId?: string; open?: string }) {
  const { draft, begin, rekey, end } = useEventDraft();
  const communities = useOrganizedCommunities();
  const persisted = useOrganizerEvent(eventId);
  // Each visit to the form starts its own draft; sub-screens pushed on top share it.
  const [session] = useState(() => `form-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const started = draft?.session === session;
  const [holdNotice, setHoldNotice] = useState<string | null>(null);
  const save = useSaveEvent();

  const community = communities.data?.[0];

  // Start a fresh draft for this screen: empty for a new event, the saved event otherwise.
  useEffect(() => {
    if (started) return;
    if (!eventId) {
      begin({ key: 'new', communityId: '', fields: EMPTY_FIELDS, session });
    } else if (persisted.data) {
      begin({ key: persisted.data.id, communityId: persisted.data.communityId, fields: fieldsOf(persisted.data), session });
      if (open === 'when') router.push('/organizer/events/when');
    }
  }, [started, eventId, persisted.data, begin, open, session]);

  // Unsaved edits go when the form closes; the saved event is the truth again.
  useEffect(() => () => end(session), [end, session]);

  const key = draft?.key;
  const savedId = key && key !== 'new' ? key : undefined;
  const bookings = useEventBookings(savedId);
  const offers = useDraftOffers(savedId);

  const header = (
    <ScreenHeader
      title={eventId ? 'Edit event' : 'Create New Event'}
      subtitle={`${persisted.data?.communityName ?? community?.name ?? 'Your community'} · ${persisted.data?.status === 'published' ? 'live' : 'draft'}`}
    />
  );

  if (eventId && persisted.isError) {
    return (
      <Screen>
        {header}
        <ErrorState title="Couldn’t load this event" onRetry={() => persisted.refetch()} />
      </Screen>
    );
  }
  if (eventId && persisted.isSuccess && !persisted.data) {
    return (
      <Screen>
        {header}
        <ErrorState title="This event isn’t available" detail="It may have been removed." />
      </Screen>
    );
  }
  if (!started || !draft) {
    return (
      <Screen>
        {header}
        <LoadingRows count={5} label="Loading the event" />
      </Screen>
    );
  }

  const f = draft.fields;
  const blocker = publishBlocker(f);
  const isLive = persisted.data?.status === 'published';
  const lineupKey = draft.key;

  const submit = (publish: boolean) => {
    save.mutate(
      { id: savedId, communityId: draft.communityId || community?.id || '', fields: f, publish },
      {
        onSuccess: (event) => {
          rekey(event.id);
          if (publish) {
            router.replace({ pathname: '/organizer/events/[id]/published', params: { id: event.id } });
            return;
          }
          const notice = draftHoldNotice(bookings.data ?? []);
          if (notice) setHoldNotice(notice);
          else backToManage();
        },
      },
    );
  };

  return (
    <Screen
      testID="event-form"
      contentStyle={styles.content}
      footer={
        <>
          {save.isError ? (
            <Notice tone="error">Couldn’t save. Your changes are still here; try again.</Notice>
          ) : null}
          <View style={styles.actions}>
            <Button
              testID="save-draft"
              label="Save as draft"
              variant="secondary"
              loading={save.isPending && !save.variables?.publish}
              disabled={save.isPending}
              onPress={() => submit(false)}
              style={styles.action}
            />
            <Button
              testID="publish"
              label={blocker ?? (isLive ? 'Save & publish' : 'Create & publish')}
              disabled={!!blocker || save.isPending}
              loading={save.isPending && !!save.variables?.publish}
              onPress={() => submit(true)}
              style={styles.action}
            />
          </View>
        </>
      }>
      {header}
      <View style={styles.sections}>
        <SectionCard
          testID="section-details"
          title={SECTION_TITLES.details}
          summary={detailsSummary(f)}
          Icon={ImageIcon}
          state={detailsComplete(f) ? 'done' : 'todo'}
          onPress={() => router.push('/organizer/events/details')}
        />
        <SectionCard
          testID="section-when"
          title={SECTION_TITLES.when}
          summary={whenSummary(f)}
          Icon={Clock}
          state={whenComplete(f) ? 'done' : 'todo'}
          onPress={() => router.push('/organizer/events/when')}
        />
        <SectionCard
          testID="section-location"
          title={SECTION_TITLES.location}
          summary={locationSummary(f)}
          Icon={MapPin}
          state={locationComplete(f) ? 'done' : 'todo'}
          onPress={() => router.push({ pathname: '/organizer/events/when', params: { focus: 'location' } })}
        />
        <SectionCard
          testID="section-lineup"
          title={SECTION_TITLES.lineup}
          summary={lineupCardSummary(f, bookings.data ?? [], offers.data ?? [])}
          Icon={Music}
          state="new"
          onPress={() =>
            router.push({ pathname: '/organizer/events/[id]/lineup', params: { id: lineupKey, from: 'form' } })
          }
        />
        <SectionCard
          testID="section-access"
          title={SECTION_TITLES.access}
          summary="Who can come, and what it costs"
          Icon={Ticket}
          state="todo"
          onPress={() => openLater('Access & passes', 'web')}
        />
      </View>
      <Notice>{NO_LINEUP_NOTICE}</Notice>

      <Sheet
        visible={!!holdNotice}
        onClose={() => setHoldNotice(null)}
        title="Saved as draft"
        subtitle={holdNotice ?? undefined}>
        <Button
          label="Back to Manage"
          onPress={() => {
            setHoldNotice(null);
            backToManage();
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  sections: { gap: space.stack },
  actions: { flexDirection: 'row', gap: space.stack },
  action: { flex: 1, height: 52, paddingHorizontal: space.sm },
});
