import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { screen, userEvent } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { TestAccountsEntry, TEST_ACCOUNTS_TITLE } from './TestAccountsSheet';
import { WelcomePoster } from './WelcomeBackdrop';

const meta = {
  title: 'Organisms/TestAccountsEntry',
  component: TestAccountsEntry,
  tags: ['autodocs'],
  render: () => (
    <>
      <WelcomePoster />
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 50 }}>
        <TestAccountsEntry />
      </View>
    </>
  ),
  parameters: {
    frame: 'screen',
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'The way into the four test accounts, at the foot of the Sign in sheet: a line, “Running on sample data. Test accounts”, that opens a sheet listing each account (new user, new organizer, existing organizer, existing member) with what signing in as it shows. Tapping one signs in as it. A Test data pill and a note say none is real and nothing is sent or charged.',
          use: 'only on the Sign in sheet, and only while the app runs on the sample (fake) repository. With a real repository it renders nothing.',
          avoid: 'anywhere a real person signs in, or as a way to switch accounts after sign-in.',
          usage: `{/* Only on the sample (fake) repository; renders nothing with a real one. */}
<TestAccountsEntry />`,
          a11y: [
            'The line is one 44pt link spoken as “Running on sample data. Test accounts”.',
            'Each account row is a button spoken as its label and description; while one signs in it is busy and the rest are disabled.',
            'The sheet can’t be closed while an account is signing in.',
          ],
          do: ['Say plainly that these are sample people on sample data.', 'Keep the warning pill on the sheet.'],
          dont: ['Show it with a real backend.', 'Put real emails or names in the accounts.'],
          unshown: [
            'Signing in: the tapped row shows a spinner and the others are disabled. On sample data sign-in answers at once, so it passes in a blink.',
            '“Couldn’t sign in as that account. Try again.”, an error notice above the list. Signing in to the sample repository can’t fail, so no story shows it.',
          ],
        }),
      },
    },
  },
} satisfies Meta<typeof TestAccountsEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  parameters: storyDoc('The line at the foot of Sign in, before it is tapped.'),
};

export const Open: Story = {
  play: async () => {
    await userEvent.click(await screen.findByText(TEST_ACCOUNTS_TITLE));
  },
  parameters: storyDoc('The sheet open on the four accounts. Tap one to sign in as it (the next screen is logged to Actions).'),
};
