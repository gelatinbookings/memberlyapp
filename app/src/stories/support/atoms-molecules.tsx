import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MemberlyRepository } from '@/data/repository';
import type { EventFields, ImageAsset } from '@/data/types';
import { isoDateInZone, type IsoDate } from '@/lib/dates';
import type { LibraryPhoto } from '@/lib/photos';
import { space } from '@/theme/tokens';

import { sampleUri } from './Sample';

/**
 * Small helpers shared by the Atoms and Molecules stories. Layout only, plus
 * reads from the fake repository: nothing here types an amount.
 */

/** Parts side by side, wrapping, 8px apart: a row of chips or pills. */
export function Wrap({ children }: { children: ReactNode }) {
  return <View style={styles.wrap}>{children}</View>;
}

/** Parts stacked with the 10px card gap. */
export function Stack({ children, gap = space.stack }: { children: ReactNode; gap?: number }) {
  return <View style={{ gap }}>{children}</View>;
}

/** Every sample photo the fake repository has: tonight's covers, then community banners. */
async function sampleImages(repo: MemberlyRepository): Promise<ImageAsset[]> {
  const [tonight, communities] = await Promise.all([repo.getTonight('Atlanta'), repo.getTopCommunities('Atlanta')]);
  return [...tonight.map((e) => e.cover), ...communities.flatMap((c) => (c.cover ? [c.cover] : []))];
}

/** `count` library photos for the photo pickers' parts, cycling through the sample photos. */
export async function samplePhotos(repo: MemberlyRepository, count: number): Promise<LibraryPhoto[]> {
  const images = await sampleImages(repo);
  return Array.from({ length: count }, (_, i) => ({ uri: sampleUri(images[i % images.length]) }));
}

/** Today at the venue, as the fake clock has it (Atlanta). */
export function todayOf(repo: MemberlyRepository): IsoDate {
  return isoDateInZone(repo.now(), 'America/New_York');
}

/** An organizer's stored event as the fields Create New Event edits. */
export async function eventFieldsOf(repo: MemberlyRepository, eventId: string): Promise<EventFields> {
  const e = await repo.getOrganizerEvent(eventId);
  if (!e) throw new Error(`No sample event ${eventId}`);
  const { name, tagline, description, cover, date, startTime, endTime, venue, city } = e;
  return { name, tagline, description, cover, date, startTime, endTime, venue, city };
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
});
