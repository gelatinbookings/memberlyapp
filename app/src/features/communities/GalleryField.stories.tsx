import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import type { LibraryPhoto } from '@/lib/photos';
import { samplePhotos } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample } from '@/stories/support/Sample';

import { GALLERY_MAX } from './communityForm';
import { GalleryField } from './GalleryField';

const meta = {
  title: 'Molecules/GalleryField',
  component: GalleryField,
  tags: ['autodocs'],
  args: { photos: [], onAdd: fn(), onRemove: fn() },
  argTypes: { photos: { control: false }, warning: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'Up to ten photos in a grid of 92pt tiles, each with a round remove button, and a dashed tile that adds more. A helper line counts them and gives the limits, or says what went wrong.',
          use: 'for a community’s gallery in Create community’s “Your look” step.',
          avoid: 'for a single photo such as a logo or banner (use `HeaderPreview`, or the single photo picker).',
          usage: `<GalleryField photos={draft.gallery} warning={note} onAdd={addToGallery} onRemove={(i) => removeAt(i)} />`,
          a11y: [
            'Each remove button is spoken “Remove photo 3”, with 8pt slop around its 24pt circle.',
            'The add tile is a `button` spoken “Add gallery photos”, 92pt square.',
          ],
          do: ['Count what’s there against the limit: “3 of 10 photos”.', 'Say which photos weren’t added and why.'],
          dont: ['Show the add tile once the gallery is full.', 'Crop photos to anything but squares in the grid.'],
        }),
      },
    },
  },
} satisfies Meta<typeof GalleryField>;

export default meta;
type Story = StoryObj<typeof meta>;

function Working({ initial, warning }: { initial: LibraryPhoto[]; warning?: string }) {
  const [photos, setPhotos] = useState(initial);
  return (
    <GalleryField
      photos={photos}
      warning={warning}
      onAdd={() => setPhotos((p) => [...p, initial[p.length % Math.max(initial.length, 1)] ?? { uri: 'sample-photo.jpg' }].slice(0, GALLERY_MAX))}
      onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))}
    />
  );
}

export const Empty: Story = {
  parameters: storyDoc('No photos yet: only the add tile and the limits.'),
};

export const Some: Story = {
  render: () => (
    <Sample name="photos" load={(repo) => samplePhotos(repo, 3)}>
      {(photos) => <Working initial={photos} />}
    </Sample>
  ),
  parameters: storyDoc('A few photos in. Tap an X to remove one, or the add tile to add another.'),
};

export const Full: Story = {
  render: () => (
    <Sample name="photos" load={(repo) => samplePhotos(repo, GALLERY_MAX)}>
      {(photos) => <Working initial={photos} />}
    </Sample>
  ),
  parameters: storyDoc('Ten photos, the limit: the add tile is gone until one is removed.'),
};

export const SomeNotAdded: Story = {
  name: 'Some not added',
  render: () => (
    <Sample name="photos" load={(repo) => samplePhotos(repo, 2)}>
      {(photos) => <Working initial={photos} warning="One photo was over 10 MB and wasn’t added." />}
    </Sample>
  ),
  parameters: storyDoc('A pick that included a photo over the size limit: the helper says what happened, in amber.'),
};
