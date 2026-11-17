import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Sample, sampleUri } from '@/stories/support/Sample';

import { HeaderPreview } from './HeaderPreview';

const meta = {
  title: 'Molecules/HeaderPreview',
  component: HeaderPreview,
  tags: ['autodocs'],
  args: { name: '', tagline: '', logo: null, banner: null, onPickLogo: fn(), onPickBanner: fn() },
  argTypes: { name: { control: 'text' }, tagline: { control: 'text' }, logo: { control: false }, banner: { control: false } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The top of a community’s public page as it will look: a 4:1 banner, the logo over its lower edge, the name and the tagline. Tapping the banner or the logo picks that photo, so the preview is also where they’re added.',
          use: 'in Create community’s “Your look” step, so an organizer sees their page take shape as they add photos.',
          avoid: 'as the real public page header, or anywhere photos can’t be changed.',
          usage: `<HeaderPreview name={draft.name} tagline={draft.tagline} logo={draft.logo} banner={draft.banner} onPickLogo={pickLogo} onPickBanner={pickBanner} />`,
          a11y: [
            'The banner and logo are `button`s: “Add a banner”, “Add a logo”, or “Banner. Replace” once there is one.',
            'Both targets are larger than 44pt.',
            'Empty name and tagline show “Your community” and “Your tagline” so the shape is clear.',
          ],
          do: ['Show the preview with the same crop the public page uses.', 'Let a tap on either photo replace it.'],
          dont: ['Add a gradient over the banner.', 'Hide the add affordance once one photo is in.'],
        }),
      },
    },
  },
} satisfies Meta<typeof HeaderPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  parameters: storyDoc('Before anything is added: placeholders for the banner, logo, name and tagline.'),
};

export const NameOnly: Story = {
  name: 'Name only',
  args: { name: 'Second Sundays' },
  parameters: storyDoc('After step one: the name is in, the tagline and photos aren’t.'),
};

export const WithLogoAndBanner: Story = {
  name: 'With logo and banner',
  render: (args) => (
    <Sample name="community" load={async (repo) => (await repo.getOrganizedCommunities())[0]}>
      {(c) => (
        <HeaderPreview
          {...args}
          name={c.name}
          tagline={c.tagline ?? 'Bringing live upscale events to you.'}
          logo={{ uri: sampleUri(c.logo ?? c.cover ?? undefined) }}
          banner={{ uri: sampleUri(c.cover ?? undefined) }}
        />
      )}
    </Sample>
  ),
  parameters: storyDoc('Everything in: banner, logo, name and tagline, as members will see it.'),
};
