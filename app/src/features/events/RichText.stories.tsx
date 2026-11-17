import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { OnEventPage } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';

import { RichText } from './EventPageParts';

const meta = {
  title: 'Atoms/RichText',
  component: RichText,
  tags: ['autodocs'],
  argTypes: { paragraphs: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'An event’s About text as the web writes it: paragraphs of runs in muted body text, with bold runs in the foreground colour, italic runs, and links in purple, underlined, that open in the browser. Exported from `features/events/EventPageParts.tsx`.',
          use: 'for “About this event” on the event page, with the paragraphs the server sends.',
          avoid: 'for copy you write in the app (use `Text`), or for anything a person types in the app: it has no editing and no Markdown.',
          usage: `<RichText paragraphs={details.about} />`,
          a11y: [
            'Each paragraph is read as one block of text, styles and all.',
            'A link run has the link role and opens in the browser; it is underlined as well as purple, so it isn’t told by colour alone.',
            'Body type scales with Dynamic Type.',
          ],
          do: ['Keep the organizer’s words and styles as the server sends them.', 'Space paragraphs 12px apart.'],
          dont: ['Add headings or lists inside About.', 'Turn plain text into links on the phone: only runs the server marks as links are links.'],
        }),
      },
    },
  },
} satisfies Meta<typeof RichText>;

export default meta;
/** The paragraphs come from the sample world inside each story's render, so they aren't required here. */
type Story = StoryObj<typeof RichText>;

export const Styled: Story = {
  name: 'Bold, italic and a link',
  render: () => <OnEventPage eventId="e_warehouse_friday">{({ details }) => <RichText paragraphs={details.about} />}</OnEventPage>,
  parameters: storyDoc('Four paragraphs using every style: a bold line, a dress code, an Instagram link and the small print in italic (Warehouse Friday).'),
};

export const Plain: Story = {
  render: () => <OnEventPage eventId="e_listening_session">{({ details }) => <RichText paragraphs={details.about} />}</OnEventPage>,
  parameters: storyDoc('One plain paragraph, the most common About (Listening Session).'),
};
