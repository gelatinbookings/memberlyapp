import { PaymentSheetOutlet } from '@/lib/payments';

import { CardHeldScreen } from './CardHeldScreen';
import { DjTakenSheet } from './DjTakenSheet';
import { OfferReviewSheet } from './OfferReviewSheet';
import { PaymentFailedSheet } from './PaymentFailedSheet';
import type { OfferFlow } from './useOfferFlow';

/**
 * Everything the offer flow puts over a screen: the review sheet, the payment
 * sheet, Card held, DJ taken and "Payment didn't go through". Render it last
 * inside the screen's full-size container.
 */
export function OfferFlowHost({
  flow,
  eventId,
  eventName,
  day,
  onBackToLineup,
  onBrowse,
}: {
  flow: OfferFlow;
  eventId: string;
  eventName: string;
  /** The event's night, "Sat, Nov 28". */
  day: string;
  /** Leaving Card held. On Lineup this only closes it. */
  onBackToLineup?: () => void;
  /** Open Browse talent: Add another DJ, and See everyone open that night. */
  onBrowse: () => void;
}) {
  const { step } = flow;
  const back = () => {
    flow.close();
    onBackToLineup?.();
  };
  return (
    <>
      {step.kind === 'review' ? (
        <OfferReviewSheet
          key={step.offer.dj.id}
          eventId={eventId}
          context={[eventName, day].filter(Boolean).join(' · ')}
          offer={step.offer}
          error={step.error}
          sending={flow.sending}
          onConfirm={flow.confirm}
          onEdit={flow.close}
          onOffline={flow.wentOffline}
        />
      ) : null}
      {step.kind === 'taken' ? (
        <DjTakenSheet
          eventId={eventId}
          dj={step.dj}
          day={day}
          onOffer={flow.addAlternate}
          onSeeEveryone={() => {
            flow.close();
            onBrowse();
          }}
          onClose={flow.next}
        />
      ) : null}
      {step.kind === 'failed' ? (
        <PaymentFailedSheet
          booking={step.booking}
          retrying={flow.payingId === step.booking.requestId}
          onRetry={() => flow.pay(step.booking)}
          onClose={flow.close}
        />
      ) : null}
      {step.kind === 'held' ? (
        <CardHeldScreen
          booking={step.booking}
          day={day}
          nextDj={step.rest[0]?.dj.name}
          onNext={flow.next}
          onBack={back}
          onAddAnother={() => {
            flow.close();
            onBrowse();
          }}
        />
      ) : null}
      <PaymentSheetOutlet />
    </>
  );
}
