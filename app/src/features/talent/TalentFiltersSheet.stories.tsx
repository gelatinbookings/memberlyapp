import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Text } from '@/components/ui';
import type { TalentFilters } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { budgetLabel, genreLabel, NO_FILTERS } from './filters';
import { TalentFiltersSheet } from './TalentFiltersSheet';

const EVENT = SAMPLE_EVENT.empty;

/** Long Table's city and night from the fake, with the sheet open on these applied filters. */
function Filters({ applied = NO_FILTERS, interactive = false }: { applied?: TalentFilters; interactive?: boolean }) {
  return (
    <Sample name="filters-event" load={(repo) => eventOf(repo, EVENT)}>
      {(event) => {
        const city = event.city?.name ?? '';
        const day = nightOf(event).day;
        return interactive ? (
          <Applying city={city} day={day} />
        ) : (
          <>
            <ScreenBehind title="Browse talent" />
            <TalentFiltersSheet visible eventId={EVENT} city={city} day={day} applied={applied} onApply={fn()} onClose={fn()} />
          </>
        );
      }}
    </Sample>
  );
}

function Applying({ city, day }: { city: string; day: string }) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<TalentFilters>(NO_FILTERS);
  // A new key on each opening, as Browse talent does, so the sheet starts from what is applied.
  const [opening, setOpening] = useState(0);
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
      <Text variant="headline">Browse talent</Text>
      <Text tone="muted">{`${budgetLabel(applied.budget)} · ${genreLabel(applied.genre)}`}</Text>
      <Button
        label="Filters"
        variant="secondary"
        onPress={() => {
          setOpening((n) => n + 1);
          setOpen(true);
        }}
      />
      <TalentFiltersSheet
        key={opening}
        visible={open}
        eventId={EVENT}
        city={city}
        day={day}
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
  title: 'Organisms/TalentFiltersSheet',
  component: TalentFiltersSheet,
  tags: ['autodocs'],
  render: () => <Filters />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Filters on Browse talent: the event’s city and night shown locked at the top, then one of the four budget bands PRODUCT.md fixes and one genre from what Gelatin offers in that city and band. The primary button carries the live count, “Show 6 DJs”. Reset clears both; nothing changes until the button is pressed.',
          use: 'from the Filters chip on Browse talent.',
          avoid: 'to change the city or night: those come from the event (Date & time, Location) and are locked here. For Explore’s filters use `ExploreFiltersSheet`.',
          usage: `<TalentFiltersSheet
  key={opening}
  visible={open}
  eventId={eventId}
  city="Atlanta"
  day="Sun, Nov 22"
  applied={filters}
  onApply={(f) => { setFilters(f); close(); }}
  onClose={close}
/>`,
          a11y: [
            'The locked city and night are each one element, “Atlanta, from your event”.',
            'Budget and genre chips are 44pt with `selected` state; choosing one again clears it.',
            'Reset is a 44pt text button on the title row.',
            'While genres load, six round skeletons hold their place.',
          ],
          do: ['Say where the locked values are changed.', 'Let a private-rate DJ appear in a band: Gelatin assigns it.'],
          dont: ['Apply as chips are tapped: only the button applies.', 'Let the organizer edit the city or night here.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TalentFiltersSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof TalentFiltersSheet>;

export const NothingApplied: Story = {
  name: 'Nothing applied',
  parameters: storyDoc('First opening: any budget, any genre, and the button counts everyone open that night.'),
};

export const BudgetAndGenre: Story = {
  name: 'Budget and genre applied',
  render: () => <Filters applied={{ budget: '300_to_600', genre: 'House' }} />,
  parameters: storyDoc('Reopened with a band and a genre on: both chips are selected and the count narrows.'),
};

export const GenresLoading: Story = {
  name: 'Genres loading',
  parameters: {
    memberly: { pending: ['getTalentGenres'] },
    ...storyDoc('While the genres open that night are read: round chip skeletons where the genres go. Budget already works.'),
  },
};

export const GenresUnavailable: Story = {
  name: 'Genres unavailable',
  parameters: {
    memberly: { talentMode: 'unavailable' },
    ...storyDoc('Genres didn’t load: one line says so, and budget still works.'),
  },
};

export const Interactive: Story = {
  render: () => <Filters interactive />,
  parameters: storyDoc('Open Filters, pick a band and a genre, then Show: the line under the title updates.'),
};
