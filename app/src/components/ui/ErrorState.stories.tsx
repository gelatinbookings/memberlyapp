import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { ErrorState } from './StateViews';

const meta = {
  title: 'Molecules/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  args: {
    title: 'Couldn’t load your events',
    detail: 'Check your connection and try again.',
    onRetry: fn(),
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'A centred error with a way out: a headline that names the problem, an optional muted line, and Try again. Exported from `StateViews.tsx`.',
          use: 'when a read fails and the screen or section has nothing else to show: a list that didn’t load, an event that couldn’t be found.',
          avoid: 'for a problem inside a form or a sheet that still works (use `Notice` with the error tone), or for the talent catalog being down, which has its own designed state.',
          usage: `if (q.isError) return <ErrorState title="Couldn’t load your events" detail="Check your connection and try again." onRetry={q.refetch} />;`,
          a11y: [
            'Role `alert`, so VoiceOver reads it when it appears.',
            'Try again is a full 52pt `Button`.',
          ],
          do: [
            'Say what didn’t happen in plain words, and what is still safe when money is involved.',
            'Offer Try again whenever trying again can help.',
          ],
          dont: ['Show an error code or the raw server message.', 'Blame the person: “Couldn’t load”, not “You failed to”.'],
        }),
      },
    },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTryAgain: Story = {
  name: 'With Try again',
  parameters: storyDoc('A read failed and trying again may help: the usual case.'),
};

export const NoRetry: Story = {
  name: 'No retry',
  args: { title: 'This event isn’t available', detail: 'It may have been removed by the organizer.', onRetry: undefined },
  parameters: storyDoc('Something trying again won’t fix, such as an event that’s gone.'),
};

export const TitleOnly: Story = {
  name: 'Title only',
  args: { title: 'Couldn’t load this page', detail: undefined },
  parameters: storyDoc('When the title says everything; still offers Try again.'),
};
