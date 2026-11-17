import { useCallback, useEffect, useRef, useState } from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';

import { isRepositoryError } from '@/data/errors';
import { fetchEventBookings, queryKeys, useDraftOfferActions, useRepository, useStorage } from '@/data/RepositoryProvider';
import type { Booking, Dj, DraftOffer, PaymentSession } from '@/data/types';
import { sessionExpired, usePayments, type PaymentResult } from '@/lib/payments';

import { SEND_FAILED } from './copy';
import { clearPendingOffer, ensurePendingOffer } from './pendingOffers';
import { pendingOffersKey, usePendingOffers } from './sync';

/**
 * Where the organizer is between "Send N offers" and the last card hold.
 * `rest` is the DJs still to review, in the order they were added.
 */
export type OfferFlowStep =
  | { kind: 'idle' }
  | { kind: 'review'; offer: DraftOffer; rest: DraftOffer[]; error: string | null }
  | { kind: 'taken'; dj: Dj; rest: DraftOffer[] }
  | { kind: 'held'; booking: Booking; rest: DraftOffer[] }
  | { kind: 'failed'; booking: Booking; rest: DraftOffer[] };

/** `confirming`: paid, and the server has not caught up yet. `payment-unavailable`: no session could be made. */
export type OfferFlowNotice = 'confirming' | 'payment-unavailable' | null;

const IDLE: OfferFlowStep = { kind: 'idle' };

/**
 * Sending offers and holding the card (GEL-1018 to GEL-1020), one DJ at a
 * time: review, create the request, hold the card, read the result back from
 * the server. Every amount on the way is one the server sent.
 */
export function useOfferFlow({
  eventId,
  eventName,
  bookings,
  offers,
}: {
  eventId: string;
  eventName: string;
  bookings: Booking[];
  offers: DraftOffer[];
}) {
  const repo = useRepository();
  const storage = useStorage();
  const qc = useQueryClient();
  const payments = usePayments();
  const actions = useDraftOfferActions(eventId);
  const pending = usePendingOffers(eventId);

  const [step, setStep] = useState<OfferFlowStep>(IDLE);
  const [sending, setSending] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<OfferFlowNotice>(null);
  /** Requests whose last payment was refused, for this visit to the screen. */
  const [failedIds, setFailedIds] = useState<string[]>([]);
  /** A session is reused until it is spent or expires. */
  const sessions = useRef(new Map<string, PaymentSession>());

  const refreshPending = useCallback(() => qc.invalidateQueries({ queryKey: pendingOffersKey }), [qc]);

  /** Bookings straight from the server; drafts and Manage follow. */
  const refreshLineup = useCallback(async (): Promise<Booking[] | null> => {
    qc.invalidateQueries({ queryKey: queryKeys.draftOffers(eventId) });
    qc.invalidateQueries({ queryKey: ['community-overview'] });
    qc.invalidateQueries({ queryKey: ['talent', eventId] });
    try {
      return await fetchEventBookings(qc, repo, eventId);
    } catch {
      return null;
    }
  }, [qc, repo, eventId]);

  const review = (list: DraftOffer[]): OfferFlowStep =>
    list.length > 0 ? { kind: 'review', offer: list[0], rest: list.slice(1), error: null } : IDLE;

  /** No connection: keep each offer with its id; they go out when the connection returns. */
  const queueOffline = async (list: DraftOffer[]) => {
    for (const o of list) {
      if (o.offerCents == null) continue;
      await ensurePendingOffer(
        storage,
        { eventId, djId: o.dj.id, offerCents: o.offerCents, note: o.note, setStart: o.setStart, setEnd: o.setEnd },
        { queued: true },
      );
    }
    await refreshPending();
    setStep(IDLE);
  };

  const freshSession = async (requestId: string): Promise<PaymentSession> => {
    const kept = sessions.current.get(requestId);
    if (kept && !sessionExpired(kept)) return kept;
    let session = await repo.createPaymentSession(requestId);
    // An expired session is replaced without a word.
    if (sessionExpired(session)) session = await repo.createPaymentSession(requestId);
    sessions.current.set(requestId, session);
    return session;
  };

  /** The card hold for one request. The server, not the sheet, says how it ended. */
  const hold = async (booking: Booking, rest: DraftOffer[]) => {
    const { requestId } = booking;
    setPayingId(requestId);
    setNotice(null);
    let session: PaymentSession;
    try {
      session = await freshSession(requestId);
    } catch (error) {
      setPayingId(null);
      setStep(IDLE);
      // not_payable: the request moved on; the refreshed lineup shows where it is.
      if (!isRepositoryError(error, 'not_payable')) setNotice('payment-unavailable');
      refreshLineup();
      return;
    }
    // The review sheet steps aside for the payment sheet.
    setStep(IDLE);
    let result: PaymentResult;
    try {
      result = await payments.presentPaymentSheet({ ...session, purpose: { kind: 'hold', djName: booking.dj.name, eventName } });
    } catch {
      setPayingId(null);
      setNotice('payment-unavailable');
      return;
    }
    const latest = (await refreshLineup())?.find((b) => b.requestId === requestId) ?? booking;
    setPayingId(null);
    if (result.status === 'cancelled') return;
    sessions.current.delete(requestId);
    if (result.status === 'failed') {
      setFailedIds((ids) => (ids.includes(requestId) ? ids : [...ids, requestId]));
      setStep({ kind: 'failed', booking: latest, rest });
      return;
    }
    setFailedIds((ids) => ids.filter((id) => id !== requestId));
    if (latest.status === 'authorization_required') setNotice('confirming');
    else setStep({ kind: 'held', booking: latest, rest });
  };

  /** Create the request for the DJ on the review sheet, then hold the card. */
  const confirm = async () => {
    if (step.kind !== 'review' || sending) return;
    const { offer, rest } = step;
    if (offer.offerCents == null) return;
    if (!onlineManager.isOnline()) return queueOffline([offer, ...rest]);
    const ref = { eventId, djId: offer.dj.id };
    setSending(true);
    setStep({ ...step, error: null });
    try {
      const stored = await ensurePendingOffer(storage, { ...ref, offerCents: offer.offerCents, note: offer.note, setStart: offer.setStart, setEnd: offer.setEnd });
      let booking: Booking;
      try {
        booking = await repo.createOffer(eventId, {
          djId: offer.dj.id,
          offerCents: offer.offerCents,
          note: offer.note,
          setStart: offer.setStart ?? null,
          setEnd: offer.setEnd ?? null,
          clientOfferId: stored.clientOfferId,
        });
      } catch (error) {
        if (isRepositoryError(error, 'offline')) return await queueOffline([offer, ...rest]);
        if (isRepositoryError(error, 'dj_unavailable')) {
          await clearPendingOffer(storage, ref);
          refreshPending();
          actions.remove(offer.dj.id).catch(() => undefined);
          qc.invalidateQueries({ queryKey: ['talent', eventId] });
          setStep({ kind: 'taken', dj: offer.dj, rest });
          return;
        }
        if (isRepositoryError(error, 'offer_open')) {
          // An offer to this DJ is already open: show it, and carry on with the others.
          await clearPendingOffer(storage, ref);
          refreshPending();
          await refreshLineup();
          setStep(review(rest));
          return;
        }
        // A timeout or anything unexpected: the id stays stored, so Try again is the same request.
        setStep({ kind: 'review', offer, rest, error: SEND_FAILED });
        return;
      }
      await clearPendingOffer(storage, ref);
      refreshPending();
      // The new request joins the lineup before its draft leaves, so the list is never empty in
      // between: an empty lineup swaps the screen and this flow would lose its place.
      qc.setQueryData<Booking[]>(queryKeys.bookings(eventId), (prev) =>
        prev?.some((b) => b.requestId === booking.requestId) ? prev : [...(prev ?? []), booking],
      );
      qc.setQueryData<DraftOffer[]>(queryKeys.draftOffers(eventId), (prev) => prev?.filter((o) => o.dj.id !== offer.dj.id));
      await refreshLineup();
      await hold(booking, rest);
    } finally {
      setSending(false);
    }
  };

  // Things learnt while the organizer was elsewhere: a queued offer the DJ could not take,
  // and ids whose request the server already has.
  const idle = step.kind === 'idle' && !sending && !payingId;
  useEffect(() => {
    if (!idle) return;
    const gone = pending.find((p) => p.unavailable);
    if (gone) {
      const draft = offers.find((o) => o.dj.id === gone.djId);
      clearPendingOffer(storage, gone).then(() => {
        refreshPending();
        if (!draft) return;
        actions.remove(draft.dj.id).catch(() => undefined);
        setStep({ kind: 'taken', dj: draft.dj, rest: [] });
      });
      return;
    }
    const answered = pending.filter((p) => !p.queued && bookings.some((b) => b.dj.id === p.djId));
    if (answered.length > 0) Promise.all(answered.map((p) => clearPendingOffer(storage, p))).then(refreshPending);
    // `actions` is rebuilt every render; the ids above are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle, pending, bookings, offers, storage, refreshPending]);

  return {
    step,
    sending,
    payingId,
    notice,
    /** True while offers from this event wait for a connection. */
    queued: pending.some((p) => p.queued),
    paymentFailed: (requestId: string) => failedIds.includes(requestId),
    /** Send N offers: review the first DJ, or queue them all when there is no connection. */
    start: (list: DraftOffer[]) => {
      setNotice(null);
      if (onlineManager.isOnline()) setStep(review(list));
      else void queueOffline(list);
    },
    /** Hold and send, from the review sheet. Runs on by itself; what happens shows in `step`. */
    confirm: () => {
      void confirm();
    },
    /** The connection went while the review sheet was open. */
    wentOffline: () => {
      if (step.kind === 'review') void queueOffline([step.offer, ...step.rest]);
    },
    /** Pay now, or Try again: the same hold for a request that already exists. */
    pay: (booking: Booking) => {
      void hold(booking, step.kind === 'failed' ? step.rest : []);
    },
    /** After Card held or DJ taken: the next DJ's review, if any. */
    next: () => setStep(step.kind === 'held' || step.kind === 'taken' ? review(step.rest) : IDLE),
    /** An alternate from DJ taken: added to the lineup with its own offer fields. */
    addAlternate: (dj: Dj) => {
      actions.add(dj).catch(() => undefined);
      setStep(IDLE);
    },
    close: () => setStep(IDLE),
    dismissNotice: () => setNotice(null),
  };
}

export type OfferFlow = ReturnType<typeof useOfferFlow>;
