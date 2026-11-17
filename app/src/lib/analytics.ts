/**
 * The one place the app reports that something happened. There is no
 * analytics provider yet, so events go nowhere unless a sink is set: the
 * provider's SDK sets one when it is chosen, and tests set their own.
 * Never pass personal details, amounts or URLs.
 */
export type AnalyticsEvent = { name: 'booking_status_unknown'; props: { status: string } };

type Sink = (event: AnalyticsEvent) => void;

let sink: Sink | null = null;

export function setAnalyticsSink(next: Sink | null): void {
  sink = next;
}

export function logEvent(event: AnalyticsEvent): void {
  sink?.(event);
}
