import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import type { AnyBookingStatus } from '@/data/types';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { AlternatesSheet } from './AlternatesSheet';

/** Sunday Sessions with the sheet open on the booking that ended in this status. */
function OverEnded({ status }: { status: AnyBookingStatus }) {
  return (
    <Sample
      name={`alternates-${status}`}
      load={async (repo) => ({ booking: await bookingIn(repo, status), night: nightOf(await eventOf(repo, SAMPLE_EVENT.everyStatus)) })}>
      {({ booking, night }) => (
        <>
          <ScreenBehind title="Lineup" />
          <AlternatesSheet
            eventId={SAMPLE_EVENT.everyStatus}
            booking={booking}
            shortDay={night.short}
            onOffer={fn()}
            onSeeEveryone={fn()}
            onSearchDate={fn()}
            onClose={fn()}
          />
        </>
      )}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/AlternatesSheet',
  component: AlternatesSheet,
  tags: ['autodocs'],
  render: () => <OverEnded status="declined" />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'Other DJs open that night, for a booking that passed, expired or was cancelled. The DJ it was with sits greyed at the top with their pill and one line about the hold; below, up to three DJs open that night with their genres, draw, rate and Offer. Then “Nobody at this budget?” with Search another date, and See everyone open that night.',
          use: 'from “Other DJs open that night” on a Lineup card whose booking is over.',
          avoid: 'for a DJ who was taken before the offer went out: that is `DjTakenSheet`, where nothing was held. Never to explain why a DJ passed.',
          usage: `<AlternatesSheet
  eventId={eventId}
  booking={ended}
  shortDay="Dec 13"
  onOffer={(dj) => addToLineup(dj)}
  onSeeEveryone={openBrowse}
  onSearchDate={openDateAndTime}
  onClose={close}
/>`,
          a11y: [
            'The sheet is spoken as “Other DJs open that night”; the list heading is a header.',
            'Offer is a 44pt round pill spoken as “Offer to Mara Sol”.',
            'While DJs load, the skeletons are one busy element, “Finding DJs open that night”.',
            'See everyone and Search another date are links with 44pt targets.',
          ],
          do: ['Show the ended booking’s hold line exactly as the server’s status gives it.', 'Keep the attribution at the foot.'],
          dont: ['Say why the DJ passed or show any message from them.', 'Show more than three alternates: See everyone opens Browse talent.'],
        }),
      },
    },
  },
} satisfies Meta<typeof AlternatesSheet>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof AlternatesSheet>;

export const Passed: Story = {
  render: () => <OverEnded status="declined" />,
  parameters: storyDoc('A DJ passed: their card greyed on top, three DJs still open that night below.'),
};

export const Expired: Story = {
  render: () => <OverEnded status="expired" />,
  parameters: storyDoc('The DJ didn’t answer in time and the hold was released.'),
};

export const Cancelled: Story = {
  render: () => <OverEnded status="cancelled" />,
  parameters: storyDoc('A booking that was cancelled, with the same ways on.'),
};

export const Loading: Story = {
  render: () => <OverEnded status="declined" />,
  parameters: {
    memberly: { pending: ['getAlternates'] },
    ...storyDoc('While other DJs open that night are read: two row skeletons under the heading.'),
  },
};

export const NobodyOpen: Story = {
  name: 'Nobody else open',
  render: () => <OverEnded status="declined" />,
  parameters: {
    memberly: { simulation: { noAlternates: true } },
    ...storyDoc('No other DJ is open that night: only “Nobody at this budget?”, Search another date and See everyone.'),
  },
};

export const CatalogUnavailable: Story = {
  name: 'Catalog unavailable',
  render: () => <OverEnded status="declined" />,
  parameters: {
    memberly: { talentMode: 'unavailable' },
    ...storyDoc('Gelatin can’t be reached: the lineup is safe, nothing was sent, and Try again reads once more.'),
  },
};
