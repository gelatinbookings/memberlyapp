import { router } from 'expo-router';

/** What each later milestone brings, for the labelled stops in M3. */
export const LATER = {
  browse: { milestone: '4', note: 'Browse talent: DJs open on the event’s night in its city, from Gelatin, with filters and DJ cards.' },
  offer: { milestone: '5', note: 'The offer review and the card hold. Each DJ is a separate booking with its own hold.' },
  status: { milestone: '6', note: 'Booking status, other DJs open that night, and the hand-off to Gelatin.' },
  web: { milestone: '', note: 'Opens the existing Memberly web page in a browser sheet until a native version exists.' },
} as const;

/** Push the labelled placeholder screen for something a later milestone builds. */
export function openLater(title: string, which: keyof typeof LATER) {
  const { milestone, note } = LATER[which];
  router.push({ pathname: '/later', params: { title, milestone, note } });
}
