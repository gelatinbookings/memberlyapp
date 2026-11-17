import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { fetchEventBookings, useRepository } from '@/data/RepositoryProvider';
import type { Booking, PortalLaunch } from '@/data/types';
import { launchExpired, usePortal, usePortalReturn, type PortalResult } from '@/lib/portal';

/** `expired`: two launches in a row were already out of time. `failed`: no launch could be made. */
export type HandoffProblem = 'expired' | 'failed' | null;

/**
 * The hand-off to Gelatin and the way back (GEL-1024, F10).
 *
 * "Manage in Gelatin" opens the Continue in Gelatin sheet for one booking.
 * "Open in Gelatin" then asks for a launch, at that tap and not before: a
 * launch works once, for 60 seconds, so it is never prefetched, kept in the
 * query cache, stored or logged. It lives in one local variable on its way to
 * the portal. A launch that arrives already expired is replaced once, silently.
 *
 * When the portal closes, however it closed, the event's bookings are read
 * again at once. If Gelatin sent the organizer back, `back` turns true once
 * that read has succeeded, and the Lineup shows "Back from Gelatin".
 *
 * Keep this above anything that unmounts when the lineup changes: the sheet
 * and the portal must outlive a status changing underneath them.
 */
export function useGelatinHandoff({
  eventId,
  onReturned,
}: {
  /** The saved event the bookings belong to. Undefined while the event is unsaved: nothing to hand off. */
  eventId: string | undefined;
  /**
   * For a screen that is not the Lineup: called after a return from Gelatin
   * with the lineup already read again, in place of this hook's own `back`.
   */
  onReturned?: () => void;
}) {
  const repo = useRepository();
  const qc = useQueryClient();
  const portal = usePortal();
  const { takeReturn } = usePortalReturn();

  /** The booking on the Continue in Gelatin sheet, as it was when the sheet opened. */
  const [booking, setBooking] = useState<Booking | null>(null);
  const [opening, setOpening] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [problem, setProblem] = useState<HandoffProblem>(null);
  const [back, setBack] = useState(false);

  /** Bookings straight from the server, ignoring the poll timer. Null when the read failed. */
  const refresh = useCallback(async (): Promise<Booking[] | null> => {
    if (!eventId) return null;
    qc.invalidateQueries({ queryKey: ['community-overview'] });
    qc.invalidateQueries({ queryKey: ['talent', eventId] });
    try {
      return await fetchEventBookings(qc, repo, eventId);
    } catch {
      return null;
    }
  }, [qc, repo, eventId]);

  /** The organizer is back from Gelatin: read the lineup, then say so. */
  const arrived = useCallback(async () => {
    const fresh = await refresh();
    if (!fresh) return;
    if (onReturned) onReturned();
    else setBack(true);
  }, [refresh, onReturned]);

  const confirm = async () => {
    if (!booking || !eventId || opening) return;
    const { requestId } = booking;
    setOpening(true);
    setProblem(null);
    let launch: PortalLaunch;
    try {
      launch = await repo.createPortalLaunch(requestId);
      // An expired launch is replaced without a word, once.
      if (launchExpired(launch)) launch = await repo.createPortalLaunch(requestId);
    } catch {
      setOpening(false);
      setProblem('failed');
      return;
    }
    if (launchExpired(launch)) {
      setOpening(false);
      setProblem('expired');
      return;
    }
    // The sheet steps aside for the portal.
    setBooking(null);
    setOpening(false);
    setBack(false);
    setPortalOpen(true);
    let result: PortalResult = 'dismissed';
    try {
      result = await portal.openPortal(launch);
    } catch {
      // The portal could not be shown. The lineup is read again all the same.
    }
    setPortalOpen(false);
    // A return link that found no portal open (Android) leaves a note instead; it counts the same.
    const returned = takeReturn(eventId) || result === 'returned';
    if (returned) await arrived();
    else await refresh();
  };

  return {
    /** The booking on the Continue in Gelatin sheet, or null when the sheet is closed. */
    booking,
    /** True while a launch is being minted. */
    opening,
    /** True while Gelatin's portal is over the app: the Lineup does not poll behind it. */
    portalOpen,
    problem,
    /** True after a return from Gelatin, once the lineup has been read again. */
    back,
    /** Manage in Gelatin, or Review the new offer in Gelatin: open the sheet for this booking. */
    open: (b: Booking) => {
      setProblem(null);
      setBooking(b);
    },
    /** Open in Gelatin. Runs on by itself; where it stands shows in `opening`, `portalOpen` and `problem`. */
    confirm: () => {
      void confirm();
    },
    close: () => {
      if (!opening) setBooking(null);
    },
    /** A return that arrived while this screen was not there to see it (a cold start, another screen). */
    arrived,
  };
}

export type GelatinHandoff = ReturnType<typeof useGelatinHandoff>;
