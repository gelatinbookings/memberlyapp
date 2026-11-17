import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';

import { TagInput } from './TagInput';
import { KNOWN_TAGS, TAG_LIMIT } from './tags';

const meta = {
  title: 'Molecules/TagInput',
  component: TagInput,
  tags: ['autodocs'],
  args: { tags: [], onChange: fn() },
  argTypes: { tags: { control: 'object' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One field for a community’s discovery tags. What you’ve chosen sits above as selected chips that remove on a tap. Below: a few suggestions to start, then matches as you type, and what you typed as a tag of your own. Up to ten.',
          use: 'in Create community’s “How people find you” step, so Explore can match the community to people’s taste.',
          avoid: 'for picking from a short fixed list (use `Chip`s directly) or for a single value (use `TextField`).',
          usage: `const [tags, setTags] = useState<string[]>([]);
<TagInput tags={tags} onChange={setTags} />`,
          a11y: [
            'Chosen tags are spoken “Remove House”; suggestions “Add Rooftop”; your own “Add your own tag, Vinyl”.',
            'The field’s spoken name is “Add a tag” even though the label is hidden.',
            'Every chip is 44pt; the count “3 of 10” is plain text under the field.',
          ],
          do: [
            'Offer known tags first, so they line up with Explore’s filters.',
            'Say plainly when the limit is reached and how to add another.',
          ],
          dont: ['Accept duplicates, in any case.', 'Drop what someone typed without saying why.'],
        }),
      },
    },
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function Working({ initial }: { initial: string[] }) {
  const [tags, setTags] = useState(initial);
  return <TagInput tags={tags} onChange={setTags} />;
}

export const Empty: Story = {
  render: () => <Working initial={[]} />,
  parameters: storyDoc('Nothing chosen yet: a few suggestions to start. Type, or tap a suggestion to add it.'),
};

export const SomeTags: Story = {
  name: 'Some tags',
  render: () => <Working initial={['Nightlife', 'House', 'Underground']} />,
  parameters: storyDoc('A few tags chosen: they sit above as purple chips. Tap one to remove it.'),
};

export const Full: Story = {
  render: () => <Working initial={KNOWN_TAGS.slice(0, TAG_LIMIT)} />,
  parameters: storyDoc('Ten tags, the limit: the field says so and offers nothing more until you remove one.'),
};

export const Controlled: Story = {
  args: { tags: ['Afrobeats', 'Rooftop'] },
  parameters: storyDoc('Driven by the controls: edit `tags` to see how the field draws any list. Taps are logged, not kept.'),
};
