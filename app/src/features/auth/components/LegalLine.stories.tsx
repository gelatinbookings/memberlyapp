import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { LegalLine } from './ProviderButtons';

const meta = {
  title: 'Molecules/LegalLine',
  component: LegalLine,
  tags: ['autodocs'],
  parameters: {
    memberly: { signedIn: false },
    docs: {
      description: {
        component: componentDocs({
          what: 'The 12px muted line “By continuing, you agree to our Terms of Use and Privacy Policy.”, with the two names in brand text. The whole line is one link that opens the web pages until they’re native. Exported from `ProviderButtons.tsx`.',
          use: 'once, at the bottom of Sign in and Create account.',
          avoid: 'as a consent checkbox, or on screens after sign-in (settings link to the pages from a `ListRow`).',
          usage: `<LegalLine />`,
          a11y: [
            'Role `link`, spoken “Terms of Use and Privacy Policy”.',
            'The whole line is the target, at least 44pt tall.',
          ],
          do: ['Keep the wording as it is; it is the agreement the screen relies on.'],
          dont: ['Shrink it below the helper size.', 'Hide it behind a toggle or a sheet.'],
        }),
      },
    },
  },
} satisfies Meta<typeof LegalLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDoc('At the foot of Sign in and Create account. Tapping it opens the Terms and Privacy pages (logged here).'),
};
