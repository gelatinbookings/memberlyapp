import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { tiersFrom } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { newTier, TIER_MAX, type TierDraft } from './communityForm';
import { TierEditor } from './TierEditor';

/** The sample community whose membership tiers the stories start from. */
const SAMPLE_COMMUNITY = 'c_second_sundays';

/** Tiers read from the fake repository, then held in local state so the fields type. */
function Editable({ count }: { count: number }) {
  return (
    <Sample name={`tiers-${count}`} load={(repo) => repo.getCommunityPasses(SAMPLE_COMMUNITY)}>
      {(passes) => <EditableFrom initial={fill(tiersFrom(passes), count)} />}
    </Sample>
  );
}

/** Takes the sample tiers and, past them, adds empty ones as Add a tier does. */
function fill(seed: TierDraft[], count: number): TierDraft[] {
  const tiers = seed.slice(0, count);
  while (tiers.length < count) tiers.push(newTier());
  return tiers;
}

function EditableFrom({ initial }: { initial: TierDraft[] }) {
  const [tiers, setTiers] = useState(initial);
  return <TierEditor tiers={tiers} onChange={setTiers} />;
}

const meta = {
  title: 'Organisms/TierEditor',
  component: TierEditor,
  tags: ['autodocs'],
  args: { tiers: [], onChange: fn() },
  argTypes: { tiers: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The paid membership tiers on Create community’s Membership pricing step: one card per tier with a name, a monthly price and one line on what’s included. Add a tier sits under the cards; Remove appears on each card once there are two or more. Up to five tiers.',
          use: 'when a community chooses paid membership, on the last step of Create community.',
          avoid: 'for a single event pass or a community pass set up later: those use the pass form (`PassFormScreen`). It never shows what members pay in total or any fee.',
          usage: `const [tiers, setTiers] = useState<TierDraft[]>([newTier(true)]);

<TierEditor tiers={tiers} onChange={setTiers} />`,
          a11y: [
            'Each card title (“Your membership”, “Tier 2”) is a header, so VoiceOver can move card to card.',
            'Remove is a 44pt round pill spoken as “Remove Inner Circle” (or “Remove tier 2” before it has a name).',
            'Fields have visible labels; the price field opens the number pad and shows a muted “$” prefix.',
            'Add a tier disappears at five; the helper line says the limit.',
          ],
          do: [
            'Show tiers in the order members will see them.',
            'Use the round pill for Add and Remove: they are lighter than the step’s Continue button.',
          ],
          dont: ['Nest a card inside a tier card.', 'Show a revenue figure or a fee next to a tier.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TierEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneTier: Story = {
  name: 'One tier',
  render: () => <Editable count={1} />,
  parameters: storyDoc('Paid membership with a single tier, the sample community’s paid one: no Remove, and the card reads “Your membership”.'),
};

export const TwoTiers: Story = {
  name: 'Two tiers',
  render: () => <Editable count={2} />,
  parameters: storyDoc('The sample community’s two tiers, each with Remove; the free one still needs a monthly price to be a paid tier.'),
};

export const AtTheLimit: Story = {
  name: `At the limit of ${TIER_MAX}`,
  render: () => <Editable count={TIER_MAX} />,
  parameters: storyDoc('Five tiers, three of them just added and empty: Add a tier is gone and the helper line states the limit.'),
};

function FromEmpty() {
  const [tiers, setTiers] = useState<TierDraft[]>(() => [newTier(true)]);
  return <TierEditor tiers={tiers} onChange={setTiers} />;
}

export const Interactive: Story = {
  render: () => <FromEmpty />,
  parameters: storyDoc('Start from one empty tier: type, add tiers up to five, and remove them again.'),
};
