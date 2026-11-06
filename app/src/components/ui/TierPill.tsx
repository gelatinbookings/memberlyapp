import { Pill } from './Pill';

/** Gelatin tier: Verified, Top performer, Resident, City pillar. */
export function TierPill({ tier }: { tier: string }) {
  return <Pill label={tier} tone="neutral" style={{ paddingHorizontal: 8, paddingVertical: 4 }} />;
}
