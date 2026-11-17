/**
 * The kinds of talent Create Event can book. The flow is built for all of
 * them; Gelatin books DJs today, so only DJs can be chosen for now.
 */
export type TalentType = 'dj' | 'band' | 'host' | 'photographer';

export const TALENT_TYPES: { id: TalentType; label: string; available: boolean }[] = [
  { id: 'dj', label: 'DJs', available: true },
  { id: 'band', label: 'Live bands', available: false },
  { id: 'host', label: 'MCs & hosts', available: false },
  { id: 'photographer', label: 'Photographers', available: false },
];

export const comingSoonLine = (label: string) => `${label} are coming soon. For now, Gelatin books DJs.`;
