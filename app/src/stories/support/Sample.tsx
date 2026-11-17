import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ErrorState, Spinner } from '@/components/ui';
import { ALL_STATUSES_EVENT_ID } from '@/data/fakeRepository';
import { useRepository } from '@/data/RepositoryProvider';
import type { MemberlyRepository } from '@/data/repository';
import type { AnyBookingStatus, Booking, ImageAsset } from '@/data/types';

/**
 * Reads sample data from the story's fake repository, then renders it.
 * Stories never type an amount of their own: every booking, total and quote
 * on a story comes from here, exactly as the fake server returns it.
 */
export function Sample<T>({
  name,
  load,
  children,
}: {
  /** A key for this read, unique within the story. */
  name: string;
  load: (repo: MemberlyRepository) => Promise<T>;
  children: (data: T) => ReactNode;
}) {
  const repo = useRepository();
  const q = useQuery({ queryKey: ['story-sample', name], queryFn: () => load(repo) });
  if (q.isError) return <ErrorState title="Sample data didn’t load" detail={String(q.error)} />;
  if (q.data === undefined) return <Spinner />;
  return <>{children(q.data)}</>;
}

/** An event's bookings as the fake server returns them. */
export async function bookingsOf(repo: MemberlyRepository, eventId: string): Promise<Booking[]> {
  const answer = await repo.getEventBookings(eventId);
  return 'bookings' in answer ? answer.bookings : [];
}

/** The one booking in this status on Sunday Sessions, the sample event that has every status. */
export async function bookingIn(repo: MemberlyRepository, status: AnyBookingStatus): Promise<Booking> {
  const found = (await bookingsOf(repo, ALL_STATUSES_EVENT_ID)).find((b) => b.status === status);
  if (!found) throw new Error(`No sample booking in ${status}`);
  return found;
}

/** A bundled sample photo as a `{ uri }` string, for parts that take a library photo. */
export function sampleUri(asset: ImageAsset | undefined): string {
  const a = asset as unknown;
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object') {
    if ('uri' in a && typeof a.uri === 'string') return a.uri;
    if ('default' in a && typeof a.default === 'string') return a.default;
  }
  // Jest hands back a module number; any string will do there.
  return 'sample-photo.jpg';
}
