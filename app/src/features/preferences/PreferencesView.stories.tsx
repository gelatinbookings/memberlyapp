import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { screen, userEvent } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { PreferencesView } from './PreferencesView';

const meta = {
  title: 'Organisms/PreferencesView',
  component: PreferencesView,
  tags: ['autodocs'],
  args: { editing: false },
  argTypes: { editing: { control: 'boolean' } },
  parameters: {
    frame: 'screen',
    memberly: { account: 'new-user' },
    docs: {
      description: {
        component: componentDocs({
          what: 'Preferences in four steps (event types, music genres, vibes, themes), one screen per step: a four-segment step bar at the top, a large title, tiles (step 1) or chips to pick from, and a pinned Continue that counts what you picked. During onboarding Skip sits top right and the last step leads on to Permissions; from Me it opens on the saved picks and ends with Save.',
          use: 'right after a new account is made (onboarding), and from Me → Preferences (`editing`).',
          avoid: 'for Explore’s filters, which narrow one search and don’t change your saved picks (`ExploreFiltersSheet`).',
          usage: `// Onboarding
<PreferencesView />
// From Me
<PreferencesView editing />`,
          a11y: [
            'The step bar is one element, “Step 2 of 4”.',
            'Chips are 44pt with `selected` state.',
            'Continue says why it can’t go on yet in its label until enough is picked.',
            'Back is a 44pt round button from step 2 on, or always when editing; Skip is a 44pt text button.',
          ],
          do: ['Let a new member skip; they can change these any time in Me.', 'Keep one primary button, pinned above the home indicator.'],
          dont: ['Put an eyebrow above the step title.', 'Save on every chip tap: Save (or the last Continue) saves.'],
          unshown: [
            'Saving: the last Continue (or Save) shows it is busy while the picks are written. On sample data that is a blink.',
            'Saved picks that can’t be read: the view has no error state yet. The options stay hidden and Continue stays disabled, so there is no story for it.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof PreferencesView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Onboarding: Story = {
  parameters: storyDoc('A new member’s first step: nothing picked, Skip top right, the line about what comes next.'),
};

export const Loading: Story = {
  parameters: {
    memberly: { account: 'new-user', pending: ['getPreferences'] },
    ...storyDoc('While the saved picks are read: two loading rows under the title, and Continue stays disabled until they arrive.'),
  },
};

export const OnboardingStepTwo: Story = {
  name: 'Onboarding, step 2',
  play: async () => {
    for (const type of ['Nightlife', 'Concerts', 'Dinners']) await userEvent.click(await screen.findByText(type));
    await userEvent.click(await screen.findByText(/^Continue/));
  },
  parameters: storyDoc('After picking three event types and continuing: the step bar fills a second segment and Back appears.'),
};

export const Editing: Story = {
  args: { editing: true },
  parameters: {
    memberly: { account: 'existing-organizer' },
    ...storyDoc('From Me → Preferences: the saved picks are on, Back replaces Skip, and the last step ends with Save.'),
  },
};
