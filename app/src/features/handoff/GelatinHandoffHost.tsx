import type { Booking } from '@/data/types';
import { PortalOutlet } from '@/lib/portal';

import { ContinueInGelatinSheet } from './ContinueInGelatinSheet';
import type { GelatinHandoff } from './useGelatinHandoff';

/**
 * Everything the hand-off puts over a screen: the Continue in Gelatin sheet
 * and, on sample data, the test portal. Render it last inside the screen's
 * full-size container, beside (not inside) anything that unmounts when the
 * lineup changes.
 */
export function GelatinHandoffHost({
  handoff,
  eventName,
  bookings,
}: {
  handoff: GelatinHandoff;
  eventName: string;
  /** The lineup as it is now, so the sheet shows the booking's current status. */
  bookings?: Booking[];
}) {
  const opened = handoff.booking;
  // The sheet belongs to the hand-off, not to the list: if the booking changes or leaves the list, it keeps its own copy.
  const booking = opened ? (bookings?.find((b) => b.requestId === opened.requestId) ?? opened) : null;
  return (
    <>
      {booking ? (
        <ContinueInGelatinSheet
          booking={booking}
          eventName={eventName}
          opening={handoff.opening}
          problem={handoff.problem}
          onOpen={handoff.confirm}
          onClose={handoff.close}
        />
      ) : null}
      <PortalOutlet />
    </>
  );
}
