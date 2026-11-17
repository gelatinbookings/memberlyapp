import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Booking } from '@/data/types';
import { GelatinHandoffHost } from '@/features/handoff/GelatinHandoffHost';
import { useGelatinHandoff, type GelatinHandoff } from '@/features/handoff/useGelatinHandoff';
import { formatIsoDate, type IsoDate } from '@/lib/dates';
import { usePortalReturn } from '@/lib/portal';

import { dateChangeBlock, type DateChangeBlock } from './dateChange';
import { DateChangeDialog } from './DateChangeDialog';

type Refusal = { block: DateChangeBlock; to: IsoDate | null };

export type DateChangeGuard = {
  /**
   * May the event move to this date? True when nothing stands in the way.
   * Otherwise the dialog opens, the date stays as it is, and this is false.
   */
  allow: (date: IsoDate) => boolean;
  /** The server refused a date change: show why. */
  refuse: (block: DateChangeBlock, to: IsoDate | null) => void;
  refusal: Refusal | null;
  dismiss: () => void;
  handoff: GelatinHandoff;
  storedDate: IsoDate | null;
  eventName: string;
  bookings: Booking[];
};

/**
 * Guards the date of a saved event against its bookings (GEL-1025). Date &
 * time asks `allow` before it takes a new date; the form calls `refuse` if the
 * server turns a save down. Either way the date is left alone and the
 * organizer is offered Gelatin, where a booking can actually be moved.
 */
export function useDateChangeGuard({
  eventId,
  eventName,
  storedDate,
  bookings,
}: {
  /** Undefined for an event not saved yet: no bookings, nothing to guard. */
  eventId: string | undefined;
  eventName: string;
  /** The date the saved event has now. */
  storedDate: IsoDate | null;
  bookings: Booking[];
}): DateChangeGuard {
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const { markReturn } = usePortalReturn();
  // Back from Gelatin: land on this event's Lineup, which says so. Opened over this screen, so nothing typed here is lost.
  const onReturned = useCallback(() => {
    if (!eventId) return;
    markReturn(eventId);
    router.push({ pathname: '/organizer/events/[id]/lineup', params: { id: eventId, from: 'form' } });
  }, [eventId, markReturn]);
  const handoff = useGelatinHandoff({ eventId, onReturned });

  return {
    allow: (date) => {
      if (!eventId || !storedDate || date === storedDate) return true;
      const block = dateChangeBlock(bookings);
      if (!block) return true;
      setRefusal({ block, to: date });
      return false;
    },
    refuse: (block, to) => setRefusal({ block, to }),
    refusal,
    dismiss: () => setRefusal(null),
    handoff,
    storedDate,
    eventName,
    bookings,
  };
}

/**
 * The date-change dialog and the hand-off it can lead to. Render it last
 * inside the screen's full-size container. `onKeep` runs when the organizer
 * keeps the current date.
 */
export function DateChangeHost({ guard, onKeep }: { guard: DateChangeGuard; onKeep?: () => void }) {
  const { refusal, handoff, storedDate } = guard;
  return (
    <>
      {refusal ? (
        <DateChangeDialog
          block={refusal.block}
          day={storedDate ? formatIsoDate(storedDate) : 'this date'}
          newDay={refusal.to ? formatIsoDate(refusal.to) : ''}
          onKeep={() => {
            guard.dismiss();
            onKeep?.();
          }}
          onManage={() => {
            const { manage } = refusal.block;
            guard.dismiss();
            onKeep?.();
            if (manage) handoff.open(manage);
          }}
        />
      ) : null}
      <GelatinHandoffHost handoff={handoff} eventName={guard.eventName} bookings={guard.bookings} />
    </>
  );
}
