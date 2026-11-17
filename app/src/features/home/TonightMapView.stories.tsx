import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { fn } from 'storybook/test';

import type { MemberlyRepository } from '@/data/repository';
import type { MemberEvent } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { StoryTabBar } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { MapPlaceholder } from './MapPlaceholder';
import { TonightMapView } from './TonightMapView';

/** Tonight's events in the signed-in person's city, as the fake returns them. */
function Tonight({ count, children }: { count?: number; children: (events: MemberEvent[]) => ReactNode }) {
  return (
    <Sample name={`tonight-${count ?? 'all'}`} load={async (repo) => (await loadTonight(repo)).slice(0, count)}>
      {children}
    </Sample>
  );
}

async function loadTonight(repo: MemberlyRepository): Promise<MemberEvent[]> {
  const viewer = await repo.getViewer();
  return repo.getTonight(viewer.city);
}

const meta = {
  title: 'Organisms/TonightMapView',
  component: TonightMapView,
  subcomponents: { MapPlaceholder },
  tags: ['autodocs'],
  render: () => (
    <Tonight>
      {(events) => (
        <>
          <TonightMapView events={events} onList={fn()} />
          <StoryTabBar active="Home" />
        </>
      )}
    </Tonight>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Tonight on the map: the map fills the top 60% of the screen with a numbered brand pin per event, and the list of tonight’s events rises in a sheet frame over its foot, your own pass first, with List view to go back. `MapPlaceholder` stands in for the map until a provider is chosen: a few streets, two blocks and the pins at each event’s sample position.',
          use: 'behind See all → Map on Home. The map is a secondary view, never Home’s default.',
          avoid: 'as Home itself (Home leads with the greeting, the Memberly card and tonight’s pass), or for an organizer’s events (Manage).',
          usage: `<TonightMapView events={tonight} onList={() => setView('list')} />`,
          a11y: [
            'The placeholder map is one image element, “Map of tonight’s events, 4 pins. Map is a placeholder.”; pins are hidden, the list below names every event.',
            'List view is a 44pt text action on the section header.',
            'The list clears the floating tab bar.',
          ],
          do: ['Number the pins in the same order as the list.', 'Keep the pins round, in brand purple, with the name in 12px bold white.'],
          dont: ['Make the map the default view.', 'Draw the map with a gradient or a shadow under the sheet.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TonightMapView>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof TonightMapView>;

export const Default: Story = {
  parameters: storyDoc('Tonight in your city on the map, the list in the sheet below with your own pass first.'),
};

export const OneEvent: Story = {
  name: 'One event',
  render: () => (
    <Tonight count={1}>
      {(events) => (
        <>
          <TonightMapView events={events} onList={fn()} />
          <StoryTabBar active="Home" />
        </>
      )}
    </Tonight>
  ),
  parameters: storyDoc('A quiet night with a single event: one pin, and the header reads “1 event tonight”.'),
};

export const MapPlaceholderOnly: Story = {
  name: 'MapPlaceholder',
  render: () => <Tonight>{(events) => <MapPlaceholder events={events} height={420} />}</Tonight>,
  parameters: { frame: 'bare', ...storyDoc('The stand-in map on its own: streets, blocks and one numbered pin per event.') },
};
