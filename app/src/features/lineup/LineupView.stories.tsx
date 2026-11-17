import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { screen, userEvent } from 'storybook/test';

import { sampleCities } from '@/data/fakeRepository';
import type { EventFields } from '@/data/types';
import type { EventDraft } from '@/features/events/EventDraftProvider';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { SAMPLE_EVENT } from '@/stories/support/organisms';

import { LineupView } from './LineupView';

/** A new event open in Create New Event, not saved yet. Name and night are placeholders; the city is the fake's own. */
function newEventDraft(fields: Partial<EventFields>): EventDraft {
  return {
    key: 'new',
    communityId: 'c_second_sundays',
    session: 'story',
    fields: {
      name: 'Rooftop Hours',
      tagline: '',
      description: '',
      cover: null,
      date: null,
      startTime: null,
      endTime: null,
      venue: '',
      city: null,
      ...fields,
    },
  };
}

const meta = {
  title: 'Organisms/LineupView',
  component: LineupView,
  tags: ['autodocs'],
  args: { eventId: SAMPLE_EVENT.inMotion, fromForm: false, focused: true },
  argTypes: {
    eventId: { control: 'select', options: Object.values(SAMPLE_EVENT).filter((id) => id !== SAMPLE_EVENT.passes) },
    fromForm: { control: 'boolean' },
    focused: { control: 'boolean' },
  },
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The Lineup section of Create New Event, as its own screen. It decides which of four states to show: blocked (no night or city yet), empty (nobody added), DJs added but not sent (each with a fee and note), and in motion (bookings with their status pills, polled every few seconds while a DJ is deciding). It also hosts the offer flow, the Other DJs sheet and the hand-off to Gelatin, so a sheet survives the list changing under it.',
          use: 'for an event’s talent, from Create New Event’s Lineup row (`fromForm`) or from Manage (adds an Edit button). `eventId` is "new" for an event not saved yet; its night and city then come from the open draft.',
          avoid: 'on public surfaces: members see only confirmed DJs on the event page, never fees, holds or statuses. For browsing the catalog use Browse talent.',
          usage: `// src/app/organizer/events/[id]/lineup.tsx
<LineupView eventId={id} fromForm={from === 'form'} focused={isFocused} />`,
          a11y: [
            'The title is a header; each booking card is read as the DJ, the status and the line under it.',
            'A status that changes after a poll cross-fades and is announced once. Under Reduce Motion it swaps without the fade.',
            '“Back from Gelatin” is announced when it appears, after the lineup is read again.',
            'Edit and Add more talent are 44pt round buttons with spoken names.',
            'Send offers says why it is disabled through its hint: “Enter a fee for every DJ first”.',
          ],
          do: [
            'Say, every time money is in play, that the card is held, not charged, and charged only if the DJ accepts.',
            'Put the attribution, “DJs, availability and rates from Gelatin”, under every view of the catalog.',
            'Let the organizer publish with no lineup: the blocked and empty states say so.',
          ],
          dont: [
            'Work out a total on the phone: every amount is the server’s.',
            'Say why a DJ passed, expired or was taken.',
            'Show the lineup’s fees or statuses on the public event page.',
          ],
          unshown: [
            '“Back from Gelatin”, a tint notice with a check, after the organizer returns from the portal and the lineup is read again. Open Every status, tap Manage in Gelatin on a held card and come back from the test portal.',
            'Offers kept while offline: a muted notice with a no-connection icon when Hold and send couldn’t reach the server. They send when the connection returns.',
            '“We’re confirming your hold” and “We couldn’t start the payment”, muted notices from the offer flow between the payment sheet and the next read.',
            '“Save your new date or city first”, a warning when a live event’s night or city was changed in the form but not saved before Browse talent.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof LineupView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { eventId: SAMPLE_EVENT.empty },
  parameters: storyDoc('A saved event with a night and a city and nobody added yet: Browse talent.'),
};

export const DraftsNotSent: Story = {
  name: 'DJs added, offers not sent',
  args: { eventId: SAMPLE_EVENT.draftsNotSent },
  parameters: storyDoc('Two DJs added to a draft, one at their published rate and one private rate still needing a fee.'),
};

export const InMotion: Story = {
  name: 'In motion',
  args: { eventId: SAMPLE_EVENT.inMotion },
  parameters: storyDoc('A live event with a payment needed, a card held and a confirmed DJ; the poll line shows.'),
};

export const EveryStatus: Story = {
  name: 'Every status',
  args: { eventId: SAMPLE_EVENT.everyStatus },
  parameters: storyDoc('One booking in each of the eight statuses: those in play first, those that ended last.'),
};

export const BlockedNoDate: Story = {
  name: 'Blocked: no date',
  args: { eventId: 'new', fromForm: true },
  parameters: {
    memberly: { draft: newEventDraft({}) },
    ...storyDoc('A new event with neither a night nor a city: the checklist asks for both, starting with the date.'),
  },
};

export const BlockedNoLocation: Story = {
  name: 'Blocked: no location',
  args: { eventId: 'new', fromForm: true },
  parameters: {
    memberly: { draft: newEventDraft({ date: '2026-12-12', startTime: '21:00', endTime: '02:00' }) },
    ...storyDoc('The night is set but not the city: the date row is ticked and the button reads Add a location.'),
  },
};

export const NewEventReady: Story = {
  name: 'New event, ready to browse',
  args: { eventId: 'new', fromForm: true },
  parameters: {
    memberly: { draft: newEventDraft({ date: '2026-12-12', startTime: '21:00', endTime: '02:00', city: sampleCities[0] }) },
    ...storyDoc('A new event with a night and a city: Browse talent saves it as a draft first, and says so.'),
  },
};

export const Loading: Story = {
  parameters: {
    memberly: { pending: ['getEventBookings'] },
    ...storyDoc('While the event, its bookings and its offers are read: three loading rows under the title.'),
  },
};

export const Behind: Story = {
  name: 'Behind: last updated',
  args: { eventId: SAMPLE_EVENT.inMotion },
  parameters: {
    memberly: { simulation: { staleBookings: true } },
    ...storyDoc('Gelatin is slow to answer: the last known lineup stays, with a quiet “Last updated” line instead of the poll.'),
  },
};

export const CouldNotLoad: Story = {
  name: 'Couldn’t load',
  args: { eventId: SAMPLE_EVENT.inMotion },
  parameters: {
    memberly: { simulation: { failBookings: true } },
    ...storyDoc('The first read failed: the event is safe, nothing was sent, and Try again reads it once more.'),
  },
};

export const SaveFailed: Story = {
  name: 'Draft didn’t save',
  args: { eventId: 'new', fromForm: true },
  play: async () => {
    await userEvent.click(await screen.findByText('Browse talent'));
  },
  parameters: {
    memberly: {
      draft: newEventDraft({ date: '2026-12-12', startTime: '21:00', endTime: '02:00', city: sampleCities[0] }),
      failing: ['saveEvent'],
    },
    ...storyDoc('Browse talent couldn’t save the new event as a draft: a warning says talent can’t load yet, and the button tries again.'),
  },
};

export const EventGone: Story = {
  name: 'Event not available',
  args: { eventId: 'e_removed' },
  parameters: storyDoc('The event was removed (or the link is old): the screen says so and offers nothing to do.'),
};
