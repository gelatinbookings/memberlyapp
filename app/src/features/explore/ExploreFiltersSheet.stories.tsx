import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Text } from '@/components/ui';
import type { ExploreFilters } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { ExploreFiltersSheet } from './ExploreFiltersSheet';
import { defaultFilters, filtersActive } from './filters';

/** The signed-in person's city from the fake, with the sheet open on filters built from it. */
function Filters({ make = defaultFilters, interactive = false }: { make?: (city: string) => ExploreFilters; interactive?: boolean }) {
  return (
    <Sample name="explore-viewer" load={(repo) => repo.getViewer()}>
      {(viewer) =>
        interactive ? (
          <Applying city={viewer.city} />
        ) : (
          <>
            <ScreenBehind title="Explore" />
            <ExploreFiltersSheet visible city={viewer.city} text="" category="All" applied={make(viewer.city)} onApply={fn()} onClose={fn()} />
          </>
        )
      }
    </Sample>
  );
}

function Applying({ city }: { city: string }) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const [applied, setApplied] = useState(() => defaultFilters(city));
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
      <Text variant="headline">Explore</Text>
      <Text tone="muted">{filtersActive(applied, city) ? 'Filters on' : 'No filters on'}</Text>
      <Button
        label="Filters"
        variant="secondary"
        onPress={() => {
          setOpening((n) => n + 1);
          setOpen(true);
        }}
      />
      <ExploreFiltersSheet
        key={opening}
        visible={open}
        city={city}
        text=""
        category="All"
        applied={applied}
        onApply={(f) => {
          setApplied(f);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const meta = {
  title: 'Organisms/ExploreFiltersSheet',
  component: ExploreFiltersSheet,
  tags: ['autodocs'],
  render: () => <Filters />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Explore’s filters: Communities or Events, then Location (Near me, your city, Anywhere), Community type, Music genres and Event vibes, each a group of chips with a small count beside its title. The primary button carries the live count, “Show 12 communities”, and is disabled with “No communities match” when nothing does. Reset goes back to your city with nothing picked.',
          use: 'from the Filters button on Explore.',
          avoid: 'for talent: Browse talent has its own filters (`TalentFiltersSheet`) bound to the event’s night and city.',
          usage: `<ExploreFiltersSheet
  key={sheetKey}
  visible={open}
  city={viewer.city}
  text={search}
  category={category}
  applied={filters}
  onApply={(f) => { setApplied(f); close(); }}
  onClose={close}
/>`,
          a11y: [
            'Chips are 44pt with `selected` state; several can be on in a group, except Location and the kind.',
            'The count beside each group is plain text (“2 picked”, “Any”).',
            'The button says what it will show, or that nothing matches, rather than going grey with no reason.',
          ],
          do: ['Count live, as chips are tapped, but apply only on the button.', 'Start from the member’s own city.'],
          dont: ['Apply on close.', 'Put more than one primary button in the sheet.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ExploreFiltersSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof ExploreFiltersSheet>;

export const Default: Story = {
  parameters: storyDoc('First opening: communities in your city, nothing else picked.'),
};

export const EventsWithPicks: Story = {
  name: 'Events, with picks',
  render: () => <Filters make={(city) => ({ ...defaultFilters(city), kind: 'events', genres: ['House', 'Afrobeats'], vibes: ['Underground'] })} />,
  parameters: storyDoc('Switched to events with two genres and a vibe picked: the counts and the button narrow.'),
};

export const NothingMatches: Story = {
  name: 'Nothing matches',
  render: () => <Filters make={(city) => ({ ...defaultFilters(city), communityTypes: ['Wellness'], genres: ['Techno'], vibes: ['Upscale'] })} />,
  parameters: storyDoc('Picks that leave nobody: the button is disabled and says no communities match.'),
};

export const Interactive: Story = {
  render: () => <Filters interactive />,
  parameters: storyDoc('Open Filters, pick, and Show: the line under the title says whether filters are on.'),
};
