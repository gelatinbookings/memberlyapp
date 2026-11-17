import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { createFakeRepository } from '@/data/fakeRepository';
import { useStorage } from '@/data/RepositoryProvider';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { saveCachedCard } from './cardCache';
import { CardView } from './CardView';

/**
 * The card as a phone that has opened it before keeps it: read once from a
 * fresh copy of the sample server (the same signed-in organizer) and kept on
 * this phone. The story's own server then refuses `getCard`, as when the
 * connection drops before the Card screen opens.
 */
function KeptThenUnreachable() {
  const storage = useStorage();
  return (
    <Sample
      name="card-kept"
      load={async () => {
        const earlier = createFakeRepository({ delayMs: 0, signedIn: true });
        await saveCachedCard(storage, await earlier.getCard());
        return true;
      }}>
      {() => <CardView />}
    </Sample>
  );
}

const meta = {
  title: 'Organisms/CardView',
  component: CardView,
  tags: ['autodocs'],
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'My Memberly Card: the purple card with the Memberly wordmark, a large QR on white for the door, your name and communities; then Your passes and Your memberships as grouped lists, with expired ones faded and marked. Offline it shows the copy this phone kept last time, marked “Shown offline”, while its code is still valid.',
          use: 'as the Card screen, opened from the pass row on Home and from Me. It is not a tab.',
          avoid: 'to show someone else’s card or a pass for sale (the event page and `PassSheet` do that). Add to Wallet stays hidden until the wallet decision lands.',
          usage: `// src/app/card.tsx
export default function CardScreen() {
  useBrightScreen();
  return <CardView />;
}`,
          a11y: [
            'The title is a header; Back is a 44pt round button.',
            'Each membership row is one element: “Second Sundays, Inner Circle · renews Dec 1, Active”.',
            'The QR stays black on white in every theme so a door scanner can read it.',
            'The Card screen turns the brightness up while open and puts it back on close.',
          ],
          do: ['Keep the QR large and on white.', 'Say “Shown offline” when the card comes from the phone’s cache.'],
          dont: ['Tint the QR purple.', 'Give the Card its own tab.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PassesAndMemberships: Story = {
  name: 'Passes and memberships',
  parameters: storyDoc('The existing organizer: a pass for Friday, three active memberships and one lapsed.'),
};

export const Member: Story = {
  parameters: {
    memberly: { account: 'existing-member' },
    ...storyDoc('A member with two passes and memberships, one of them lapsed.'),
  },
};

export const NoMemberships: Story = {
  name: 'No memberships yet',
  parameters: {
    memberly: { account: 'new-user' },
    ...storyDoc('Someone who has just signed up: the card works at the door, and a link to Explore fills the empty list.'),
  },
};

export const Loading: Story = {
  parameters: {
    memberly: { pending: ['getCard'] },
    ...storyDoc('While the card is read: two loading rows under the title.'),
  },
};

export const ShownOffline: Story = {
  name: 'Shown offline',
  render: () => <KeptThenUnreachable />,
  parameters: {
    memberly: { failing: ['getCard'] },
    ...storyDoc('Memberly can’t be reached, but this phone kept a copy of the card last time and its code is still valid: that copy, marked “Shown offline”.'),
  },
};

export const NeedsAConnection: Story = {
  name: 'Needs a connection',
  parameters: {
    memberly: { failing: ['getCard'] },
    ...storyDoc('Memberly can’t be reached and there’s no copy of the card on this phone yet: the screen says so, with Try again.'),
  },
};
