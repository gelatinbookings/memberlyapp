import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import type { DjTier } from '@/data/types';
import { Wrap } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { TierPill } from './TierPill';

const TIERS: DjTier[] = ['Verified', 'Top performer', 'Resident', 'City pillar'];

const meta = {
  title: 'Atoms/TierPill',
  component: TierPill,
  tags: ['autodocs'],
  args: { tier: 'Top performer' },
  argTypes: { tier: { control: 'select', options: TIERS } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A DJ’s Gelatin tier in a small grey pill: Verified, Top performer, Resident or City pillar. Same type as a status pill, 4px 8px padding.',
          use: 'beside a DJ’s name: on a DJ card in Browse talent, at the head of a DJ profile, on the public lineup.',
          avoid: 'for a booking’s state (use `StatusPill`) or anything a person can tap (use `Chip`).',
          usage: `<TierPill tier={dj.tier} />`,
          a11y: [
            'Read as its label; it follows the DJ’s name, so VoiceOver says “KOYO, Top performer”.',
            'Label type scales with Dynamic Type up to 1.4×.',
          ],
          do: ['Show the tier exactly as the catalog sends it.', 'Keep it grey: every tier is equal in colour.'],
          dont: ['Colour a higher tier purple or green; purple is for actions, selection and state.', 'Show a tier the catalog didn’t send.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TierPill>;

export default meta;
type Story = StoryObj<typeof meta>;

const one = (tier: DjTier, when: string): Story => ({ name: tier, args: { tier }, parameters: storyDoc(when) });

export const Verified = one('Verified', 'A DJ new to the catalog whose identity Gelatin has checked.');
export const TopPerformer = one('Top performer', 'A DJ with a strong record of bookings and reviews.');
export const Resident = one('Resident', 'A DJ who holds a regular night in the city.');
export const CityPillar = one('City pillar', 'A DJ the city’s scene is built around.');

export const EveryTier: Story = {
  name: 'Every tier',
  render: () => (
    <Wrap>
      {TIERS.map((t) => (
        <TierPill key={t} tier={t} />
      ))}
    </Wrap>
  ),
  parameters: storyDoc('All four, side by side: same grey, same size.'),
};
