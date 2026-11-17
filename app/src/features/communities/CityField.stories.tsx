import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Button } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';

import { CityField } from './CityField';
import { COUNTRIES, CountrySheet } from './CitySheet';
import { DEFAULT_COUNTRY } from './communityForm';

function Live({ country: start = DEFAULT_COUNTRY, city: c = '', region: r = '' }: { country?: string; city?: string; region?: string }) {
  const [country, setCountry] = useState(start);
  const [picking, setPicking] = useState(false);
  const [city, setCity] = useState(c);
  const [region, setRegion] = useState(r);
  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Button label={`Country: ${country}`} variant="secondary" onPress={() => setPicking(true)} />
      <CityField
        country={country}
        city={city}
        region={region}
        onChange={(p) => {
          if (p.city !== undefined) setCity(p.city);
          if (p.region !== undefined) setRegion(p.region);
        }}
      />
      <CountrySheet
        visible={picking}
        selected={country}
        onPick={(next) => {
          setCountry(next);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

const meta = {
  title: 'Molecules/CityField',
  component: CityField,
  subcomponents: { CountrySheet },
  tags: ['autodocs'],
  args: { country: DEFAULT_COUNTRY, city: '', region: '', onChange: fn() },
  argTypes: { country: { control: 'select', options: [...COUNTRIES] } },
  render: (args) => <Live country={args.country} city={args.city} region={args.region} />,
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'Where a community meets, on Create community: any city, typed freely. Common cities in the chosen country are suggested as you type and fill in the state or province; a State (or Province, Region) field appears once there is a city. `CountrySheet` picks the country.',
          use: 'for a place that can be anywhere, where a fixed list would leave people out.',
          avoid: 'for an event’s location, which uses the venue search and needs a time zone.',
          usage: `<CityField
  country={draft.country}
  city={draft.city}
  region={draft.region}
  onChange={(patch) => set(patch)}
/>`,
          a11y: ['Each suggestion is a button spoken as "City, State".', 'Both fields are optional and say so in their labels.'],
          do: ['Accept whatever city is typed.', 'Fill the state when a suggestion is picked.'],
          dont: ['Block Continue on a city that isn’t suggested.', 'Clear what was typed when the country changes.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CityField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { parameters: storyDoc('Nothing typed: the city is optional.') };
export const Typed: Story = { args: { city: 'Asheville', region: 'NC' }, parameters: storyDoc('A city that isn’t suggested, typed with its state.') };
export const Canada: Story = { args: { country: 'Canada', city: 'Halifax', region: 'NS' }, parameters: storyDoc('In Canada the second field is Province.') };
export const Country: Story = {
  render: () => (
    <>
      <ScreenBehind title="Create community" />
      <CountrySheet visible selected={DEFAULT_COUNTRY} onPick={fn()} onClose={fn()} />
    </>
  ),
  parameters: { frame: 'screen', ...storyDoc('Choosing the country a community operates in; the current one is checked.') },
};
