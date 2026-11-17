import { router } from 'expo-router';
import { CalendarPlus, ChevronRight, Ticket, Users, type LucideIcon } from 'lucide-react-native';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, ErrorState, LoadingRows, Sheet, Text } from '@/components/ui';
import { useOrganizedCommunities, useOrganizerUpcomingEvents, type OrganizerUpcomingEvent } from '@/data/RepositoryProvider';
import type { Community } from '@/data/types';
import { CommunityThumb } from '@/features/communities/CommunityThumb';
import { NEEDS_COMMUNITY } from '@/features/passSetup/passForm';
import { newPassHref, openNewEvent } from '@/features/passSetup/routes';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

/** Which part of the Create sheet is showing. */
export type CreateStep = 'root' | 'event-for' | 'pass-for' | 'pass-community' | 'pass-event';

export const CREATE_ROWS = {
  community: {
    title: 'Create community',
    line: 'Start one of your own, free or paid.',
  },
  event: { title: 'Add event', line: 'Create New Event for your community.' },
  pass: { title: 'Add pass', line: 'A membership, or a pass for one event.' },
} as const;
export const NO_UPCOMING_EVENTS = 'No upcoming events';
export const NO_UPCOMING_LINE = 'Create an event first, then add its passes.';

type CreateSheetValue = { open: () => void };
const CreateSheetContext = createContext<CreateSheetValue | null>(null);

/**
 * Holds the Create sheet (GEL-1055) above the tabs, so nothing that unmounts
 * under it (a tab, a loading state on Home) takes the open sheet with it.
 */
export function CreateSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  // Mounted from the first opening on, so it reads nothing until someone taps "+", and still fades out when it closes.
  const [opened, setOpened] = useState(false);
  const open = useCallback(() => {
    setOpened(true);
    setVisible(true);
  }, []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <CreateSheetContext.Provider value={value}>
      {children}
      {opened ? <CreateSheet visible={visible} onClose={() => setVisible(false)} /> : null}
    </CreateSheetContext.Provider>
  );
}

export function useCreateSheet(): CreateSheetValue {
  const ctx = useContext(CreateSheetContext);
  if (!ctx) throw new Error('useCreateSheet must be used inside CreateSheetProvider');
  return ctx;
}

/** One row: an icon tile, a title and one line. Disabled rows are dimmed and say nothing on tap. */
function ChoiceRow({
  Icon,
  title,
  line,
  disabled = false,
  onPress,
  testID,
}: {
  Icon: LucideIcon;
  title: string;
  line: string;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${line}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? c.muted : c.card,
          borderColor: c.border,
          opacity: disabled ? 0.45 : 1,
        },
      ]}>
      <View style={[styles.tile, { backgroundColor: c.tint }]}>
        <Icon size={20} color={c.brandText} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <Text variant="cardTitle">{title}</Text>
        <Text variant="secondary" tone="muted" numberOfLines={2}>
          {line}
        </Text>
      </View>
      {disabled ? null : <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />}
    </Pressable>
  );
}

/** A community or an event to choose: cover, name, one line. */
function PickRow({
  cover,
  title,
  line,
  onPress,
  testID,
}: {
  cover: Community['cover'];
  title: string;
  line: string;
  onPress: () => void;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${line}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.muted : c.card, borderColor: c.border }]}>
      <CommunityThumb cover={cover} />
      <View style={styles.text}>
        <Text variant="cardTitle" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="secondary" tone="muted" numberOfLines={1}>
          {line}
        </Text>
      </View>
      <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />
    </Pressable>
  );
}

/** A list that scrolls inside the sheet once it is taller than the sheet allows. */
function PickList({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const members = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'member' : 'members'}`;

/**
 * The Create sheet behind Home's "+": Create community, Add event, Add pass.
 * Add event asks which community first when there are several; Add pass asks
 * whether it is for a community or an event. Closing it changes nothing.
 */
export function CreateSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState<CreateStep>('root');
  const organized = useOrganizedCommunities();
  const communities = organized.data ?? [];
  // Disabled only once it is known that they run none; while the list loads, the next step shows it loading.
  const runsNone = organized.isSuccess && communities.length === 0;
  const upcoming = useOrganizerUpcomingEvents();

  const close = () => {
    setStep('root');
    onClose();
  };
  /** Close the sheet, then go. */
  const go = (to: () => void) => {
    close();
    to();
  };

  const addEvent = () => {
    if (communities.length === 1) return go(() => openNewEvent(communities[0].id));
    setStep('event-for');
  };
  const passForCommunity = () => {
    // With one community there is nothing to choose.
    if (communities.length === 1) return go(() => router.push(newPassHref('community', communities[0].id)));
    setStep('pass-community');
  };

  const loading = organized.isPending ? <LoadingRows count={2} label="Loading your communities" /> : null;
  const failed = organized.isError ? <ErrorState title="Couldn’t load your communities" onRetry={() => organized.refetch()} /> : null;

  let title = 'Create';
  let subtitle: string | undefined;
  let onBack: (() => void) | undefined;
  let body: ReactNode;

  switch (step) {
    case 'event-for':
      title = 'Add an event for';
      onBack = () => setStep('root');
      body = (
        <PickList>
          {communities.map((x) => (
            <PickRow
              key={x.id}
              testID={`create-event-for-${x.id}`}
              cover={x.cover}
              title={x.name}
              line={`${x.city} · ${members(x.memberCount)}`}
              onPress={() => go(() => openNewEvent(x.id))}
            />
          ))}
        </PickList>
      );
      break;
    case 'pass-for':
      title = 'Add a pass for';
      onBack = () => setStep('root');
      body = (
        <View style={styles.list}>
          <ChoiceRow
            testID="create-pass-community"
            Icon={Users}
            title="A community"
            line="A membership, free or monthly."
            onPress={passForCommunity}
          />
          <ChoiceRow
            testID="create-pass-event"
            Icon={CalendarPlus}
            title="An event"
            line="A pass to get in to one event."
            onPress={() => setStep('pass-event')}
          />
        </View>
      );
      break;
    case 'pass-community':
      title = 'Add a pass for';
      subtitle = 'Choose a community.';
      onBack = () => setStep('pass-for');
      body = (
        <PickList>
          {communities.map((x) => (
            <PickRow
              key={x.id}
              testID={`create-pass-for-${x.id}`}
              cover={x.cover}
              title={x.name}
              line={`${x.city} · ${members(x.memberCount)}`}
              onPress={() => go(() => router.push(newPassHref('community', x.id)))}
            />
          ))}
        </PickList>
      );
      break;
    case 'pass-event':
      title = 'Add a pass for';
      subtitle = upcoming.events.length > 0 ? 'Choose an upcoming event.' : undefined;
      onBack = () => setStep('pass-for');
      body = upcoming.isPending ? (
        <LoadingRows count={2} label="Loading your events" />
      ) : upcoming.isError ? (
        <ErrorState title="Couldn’t load your events" onRetry={upcoming.refetch} />
      ) : upcoming.events.length === 0 ? (
        <View style={styles.empty} testID="create-no-events">
          <View style={styles.emptyText}>
            <Text variant="cardTitle" align="center">
              {NO_UPCOMING_EVENTS}
            </Text>
            <Text variant="secondary" tone="muted" align="center">
              {NO_UPCOMING_LINE}
            </Text>
          </View>
          <Button testID="create-no-events-new" label="New event" onPress={() => go(() => openNewEvent(communities[0]?.id))} />
        </View>
      ) : (
        <PickList>
          {upcoming.events.map((e: OrganizerUpcomingEvent) => (
            <PickRow
              key={e.id}
              testID={`create-pass-event-${e.id}`}
              cover={e.cover}
              title={e.name}
              line={communities.length > 1 ? `${e.dateLabel} · ${e.community.name}` : e.dateLabel}
              onPress={() => go(() => router.push(newPassHref('event', e.id)))}
            />
          ))}
        </PickList>
      );
      break;
    default:
      body = (
        <View style={styles.list}>
          <ChoiceRow
            testID="create-community"
            Icon={Users}
            title={CREATE_ROWS.community.title}
            line={CREATE_ROWS.community.line}
            onPress={() => go(() => router.push('/organizer/communities/new'))}
          />
          <ChoiceRow
            testID="create-event"
            Icon={CalendarPlus}
            title={CREATE_ROWS.event.title}
            line={CREATE_ROWS.event.line}
            disabled={runsNone}
            onPress={addEvent}
          />
          <ChoiceRow
            testID="create-pass"
            Icon={Ticket}
            title={CREATE_ROWS.pass.title}
            line={CREATE_ROWS.pass.line}
            disabled={runsNone}
            onPress={() => setStep('pass-for')}
          />
          {runsNone ? (
            <Text variant="helper" tone="muted" testID="create-needs-community">
              {NEEDS_COMMUNITY}
            </Text>
          ) : null}
        </View>
      );
  }

  return (
    <Sheet visible={visible} onClose={close} title={title} subtitle={subtitle} onBack={onBack} testID="create-sheet">
      {step !== 'root' && step !== 'pass-for' ? (loading ?? failed ?? body) : body}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.stack },
  scroll: { flexGrow: 0, flexShrink: 1 },
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.row,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.card,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.notice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  empty: { gap: space.card, paddingVertical: space.sm },
  emptyText: { gap: space.xs },
});
