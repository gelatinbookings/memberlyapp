import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import type { Booking } from '@/data/types';
import { formatIsoDate } from '@/lib/dates';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { eventOf, nightOf, SAMPLE_EVENT, ScreenBehind } from '@/stories/support/organisms';
import { bookingsOf, Sample } from '@/stories/support/Sample';

import { DateChangeDialog } from './DateChangeDialog';
import { dateChangeBlock } from './dateChange';

/** The night the organizer just picked, the day after Warehouse Friday. A date, not data. */
const PICKED = '2026-11-21';

/**
 * Warehouse Friday's bookings from the fake, narrowed by `keep`, and the
 * dialog the date picker would raise for them.
 */
function Dialog({ keep }: { keep: (b: Booking) => boolean }) {
  return (
    <Sample
      name="date-change"
      load={async (repo) => ({
        bookings: (await bookingsOf(repo, SAMPLE_EVENT.inMotion)).filter(keep),
        day: nightOf(await eventOf(repo, SAMPLE_EVENT.inMotion)).day,
      })}>
      {({ bookings, day }) => {
        const block = dateChangeBlock(bookings);
        return block ? (
          <>
            <ScreenBehind title="Date & time" />
            <DateChangeDialog block={block} day={day} newDay={formatIsoDate(PICKED)} onKeep={fn()} onManage={fn()} />
          </>
        ) : null;
      }}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/DateChangeDialog',
  component: DateChangeDialog,
  tags: ['autodocs'],
  render: () => <Dialog keep={() => true} />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The centred alert raised when an organizer picks a new date for an event that has bookings. After a DJ confirms, it leads with their photo and Confirmed pill and says the booking is moved or cancelled in Gelatin. Before anyone confirms, with offers still open, it says those offers are handled in Gelatin first. Neither changes the date: the ways out are keeping it and, when a hold exists, Manage in Gelatin.',
          use: 'from Date & time, through `DateChangeGuard`, when the new date would leave an open or confirmed booking on the old night.',
          avoid: 'when nothing is booked (the date just saves), or as a general confirm dialog. It is a decision, so it is a centred dialog, not a sheet.',
          usage: `const block = dateChangeBlock(bookings);
{block ? (
  <DateChangeDialog block={block} day="Fri, Nov 20" newDay="Sat, Nov 21" onKeep={keep} onManage={() => handoff.open(block.manage!)} />
) : null}`,
          a11y: [
            'The dialog is a modal for VoiceOver and is spoken by its own label; the title is a header.',
            'Both buttons are 48pt, side by side; Keep comes first in focus order.',
            'Manage in Gelatin has a trailing arrow because it leaves the app.',
            'The screen behind is dimmed to 35% and can’t be tapped.',
          ],
          do: ['Name the night being kept on the Keep button.', 'Say plainly that the date isn’t changed from the app while a DJ is booked or deciding.'],
          dont: ['Offer a destructive Change date: the app can’t withdraw an offer yet.', 'Say why a DJ might not move with the date.'],
        }),
      },
    },
  },
} satisfies Meta<typeof DateChangeDialog>;

export default meta;
/** Props come from the sample world inside each story's render, so none is required here. */
type Story = StoryObj<typeof DateChangeDialog>;

export const AfterTheDjConfirms: Story = {
  name: 'After the DJ confirms',
  parameters: storyDoc('A DJ is confirmed for this night: their photo and pill lead, and moving the booking happens in Gelatin.'),
};

export const BeforeTheDjConfirms: Story = {
  name: 'Before the DJ confirms',
  render: () => <Dialog keep={(b) => b.status !== 'confirmed'} />,
  parameters: storyDoc('Offers are still open and one card is held: handle them in Gelatin first, or keep the date.'),
};

export const BeforeAnyHold: Story = {
  name: 'Before any hold',
  render: () => <Dialog keep={(b) => b.status === 'authorization_required'} />,
  parameters: storyDoc('The only open offer still needs payment, so there is nothing in Gelatin yet: Keep is the only way out.'),
};
