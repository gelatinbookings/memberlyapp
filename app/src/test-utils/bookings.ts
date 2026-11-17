import type { MemberlyRepository } from '@/data/repository';
import type { Booking } from '@/data/types';

/** An event's bookings, read in full (no ETag), for tests that check what the server holds. */
export async function bookingsOf(repository: Pick<MemberlyRepository, 'getEventBookings'>, eventId: string): Promise<Booking[]> {
  const answer = await repository.getEventBookings(eventId);
  if ('notModified' in answer) throw new Error('A read without an ETag cannot be "not modified"');
  return answer.bookings;
}
