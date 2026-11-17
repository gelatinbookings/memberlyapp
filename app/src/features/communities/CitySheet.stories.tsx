import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Text } from '@/components/ui';
import type { City as CityRow } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import { CitySheet, COUNTRIES, CountrySheet } from './CitySheet';
import { DEFAULT_COUNTRY } from './communityForm';

const meta = {
  title: 'Organisms/CitySheet',
  component: CitySheet,
  subcomponents: { CountrySheet },
  tags: ['autodocs'],
  args: { visible: true, selected: null, onPick: fn(), onClose: fn() },
  argTypes: {
    country: { control: 'select', options: [...COUNTRIES] },
    selected: { control: false },
    visible: { control: 'boolean' },
  },
  render: (args) => (
    <>
      <ScreenBehind title="Create community" />
      <CitySheet {...args} />
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Two pickers from Create community’s story step. `CountrySheet` lists the countries the web offers first; `CitySheet` lists the cities Memberly knows in that country, read from the repository. Each is a `Sheet` with one grouped list; the chosen row is purple with a check.',
          use: 'when a field opens a short fixed list: Country, then City, on Create community.',
          avoid: 'for long or free-text lists (use a search field), or for the event’s city in Create New Event, which comes from the event’s location.',
          usage: `<CitySheet
  visible={picking === 'city'}
  country={draft.country}
  selected={draft.city}
  onPick={(city) => { set({ city }); close(); }}
  onClose={close}
/>`,
          a11y: [
            'Each row is a 52pt button spoken as its name, with `selected` on the chosen one.',
            'The check is decoration; the selected state is announced.',
            'Closing the sheet any way keeps the field as it was.',
          ],
          do: ['Say what the choice is for in the subtitle.', 'Say plainly when a country has no cities yet, and that City is optional.'],
          dont: ['Apply a pick and keep the sheet open: picking closes it.', 'Use a chip grid for a list of places.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CitySheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const City: Story = {
  parameters: storyDoc('Choosing a city in the United States, with nothing chosen yet.'),
};

export const CityChosen: Story = {
  name: 'City chosen',
  render: (args) => (
    <Sample name="cities" load={(repo) => repo.getCities()}>
      {(cities) => (
        <>
          <ScreenBehind title="Create community" />
          <CitySheet {...args} selected={cities[0] ?? null} />
        </>
      )}
    </Sample>
  ),
  parameters: storyDoc('Opened again after a city was picked: that row is purple with a check.'),
};

export const NoCitiesInCountry: Story = {
  name: 'No cities in that country',
  args: { country: 'Canada' },
  parameters: storyDoc('A country with no cities listed yet: one line says so, and that City is optional.'),
};

export const Country: Story = {
  render: () => (
    <>
      <ScreenBehind title="Create community" />
      <CountrySheet visible selected={DEFAULT_COUNTRY} onPick={fn()} onClose={fn()} />
    </>
  ),
  parameters: storyDoc('Choosing the country a community operates in; the current one is checked.'),
};

function CountryThenCity() {
  const [open, setOpen] = useState<'country' | 'city' | null>(null);
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY);
  const [city, setCity] = useState<CityRow | null>(null);
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
      <Text variant="headline">Create community</Text>
      <Text tone="muted">{[city ? `${city.name}, ${city.region}` : 'No city', country].join(' · ')}</Text>
      <Button label="Country" variant="secondary" onPress={() => setOpen('country')} />
      <Button label="City" variant="secondary" onPress={() => setOpen('city')} />
      <CountrySheet
        visible={open === 'country'}
        selected={country}
        onPick={(c) => {
          setCountry(c);
          if (c !== country) setCity(null);
          setOpen(null);
        }}
        onClose={() => setOpen(null)}
      />
      <CitySheet
        visible={open === 'city'}
        country={country}
        selected={city}
        onPick={(c) => {
          setCity(c);
          setOpen(null);
        }}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

export const Interactive: Story = {
  render: () => <CountryThenCity />,
  parameters: storyDoc('Pick a country, then a city in it; changing the country clears the city.'),
};
