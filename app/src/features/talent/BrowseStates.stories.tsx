import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, nightOf, SAMPLE_EVENT } from '@/stories/support/organisms';
import { Sample } from '@/stories/support/Sample';

import {
  Attribution,
  NoCityState,
  NoneOpenState,
  NotReadyState,
  TalentSkeleton,
  TooTightState,
  UnavailableFooter,
  UnavailableState,
} from './BrowseStates';

/** Browse talent's body: under the header, 20pt gutters, the state filling what is left. */
function Body({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 63, paddingBottom: 34, gap: 16 }}>{children}</View>;
}

/** An event's city and night from the fake, for the states that name them. */
function WithNight({ eventId, children }: { eventId: string; children: (city: string, day: string, isDraft: boolean) => ReactNode }) {
  return (
    <Sample name={`night-${eventId}`} load={(repo) => eventOf(repo, eventId)}>
      {(event) => <Body>{children(event.city?.name ?? '', nightOf(event).day, event.status === 'draft')}</Body>}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/BrowseStates',
  component: UnavailableState,
  subcomponents: { TalentSkeleton, NoCityState, TooTightState, NoneOpenState, NotReadyState, UnavailableFooter },
  tags: ['autodocs'],
  args: { offline: false, onRetry: fn(), onContinue: fn() },
  argTypes: { offline: { control: 'boolean' } },
  render: (args) => (
    <Body>
      <UnavailableState {...args} />
      <UnavailableFooter />
    </Body>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Every state Browse talent can be in besides a list of DJs. Each is a centred block: a 72pt round badge, a headline, one line, then the way on. Loading is four skeleton DJ cards, never a spinner. The catalog credit under each state is `Attribution`, which has its own page under Atoms.',
          use: 'inside Browse talent’s body, in place of the DJ list: loading, a city Gelatin doesn’t serve yet (Notify me), the catalog unavailable or offline, filters too tight, nobody open that night, and an event with no night or city.',
          avoid: 'outside Browse talent. The Lineup has its own blocked and empty screens; sheets that list DJs (Other DJs open that night, DJ taken) show their own short notices.',
          usage: `{talent.isPending ? <TalentSkeleton /> : null}
{unavailable ? <UnavailableState offline={!online} onRetry={talent.refetch} onContinue={back} /> : null}
<Attribution />`,
          a11y: [
            'Each title is a header; the badge icon is decoration.',
            'Loading is one busy element spoken as “Finding DJs”.',
            'Text links (Continue without talent) are 44pt tall; Notify me shows it is busy, then becomes “We’ll let you know”.',
          ],
          do: [
            'Say the event is safe and nothing was sent whenever Gelatin can’t be reached.',
            'Always give a way on: Try again, Notify me, Show all, or continue without talent.',
          ],
          dont: ['Say why nobody is open, or why a DJ isn’t.', 'Put a spinner over a blank screen.'],
        }),
      },
    },
  },
} satisfies Meta<typeof UnavailableState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  render: () => (
    <Body>
      <TalentSkeleton />
      <Attribution />
    </Body>
  ),
  parameters: storyDoc('While the first page of DJs loads: chip and card skeletons in the muted colour.'),
};

export const CityNotServed: Story = {
  name: 'City not served',
  render: () => <WithNight eventId={SAMPLE_EVENT.noCoverage}>{(city, _day, isDraft) => <NoCityState city={city} isDraft={isDraft} onContinue={fn()} />}</WithNight>,
  parameters: storyDoc('A draft in a city Gelatin doesn’t book yet: Notify me, or create the event without talent. Tap Notify me to see the confirmation.'),
};

export const Unavailable: Story = {
  name: 'Catalog unavailable',
  parameters: storyDoc('Gelatin can’t be reached: Try again, or continue without talent. Bookings and holds are untouched.'),
};

export const Offline: Story = {
  args: { offline: true },
  parameters: storyDoc('The phone is offline: DJs load by themselves when the connection returns.'),
};

export const FiltersTooTight: Story = {
  name: 'Filters too tight',
  render: () => (
    <WithNight eventId={SAMPLE_EVENT.empty}>
      {(_city, day) => <TooTightState eventId={SAMPLE_EVENT.empty} filters={{ budget: 'under_300', genre: 'Techno' }} day={day} onChange={fn()} />}
    </WithNight>
  ),
  parameters: storyDoc('Nobody matches both the band and the genre: loosen one in a tap, or show everyone.'),
};

export const NoneOpen: Story = {
  name: 'Nobody open that night',
  render: () => <WithNight eventId={SAMPLE_EVENT.empty}>{(city, day) => <NoneOpenState city={city} day={day} onContinue={fn()} />}</WithNight>,
  parameters: storyDoc('No filters on and nobody open that night. No reason is given.'),
};

export const NotReady: Story = {
  name: 'No night or city yet',
  render: () => (
    <Body>
      <NotReadyState missing={false} onBack={fn()} />
    </Body>
  ),
  parameters: storyDoc('Browse opened for an event with no night or city: back to the Lineup to set them.'),
};

export const EventGone: Story = {
  name: 'Event not available',
  render: () => (
    <Body>
      <NotReadyState missing onBack={fn()} />
    </Body>
  ),
  parameters: storyDoc('The event was removed while Browse was open.'),
};
