import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn, screen, userEvent } from 'storybook/test';

import { Button, Text } from '@/components/ui';
import type { MemberlyRepository } from '@/data/repository';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { ScreenBehind } from '@/stories/support/organisms';
import { Sample, sampleUri } from '@/stories/support/Sample';

import { CreateSheet } from './CreateSheet';

/**
 * Puts a second community in the existing organizer's sample world, the way
 * Create community would, so Add event has two to choose from.
 */
async function runTwoCommunities(repo: MemberlyRepository) {
  const [photo] = await repo.getTopCommunities('Atlanta');
  const uri = sampleUri(photo?.cover ?? undefined);
  await repo.createCommunity({
    name: 'Night Garden',
    tagline: 'Late sets under the trees.',
    description: 'A monthly night for people who like house music outdoors.',
    country: 'United States',
    state: 'GA',
    city: 'Atlanta',
    logo: { uri },
    banner: { uri },
    gallery: [],
    tags: ['Music'],
    links: {},
    membership: { kind: 'free' },
    idempotencyKey: 'story-night-garden',
  });
  return true;
}

const meta = {
  title: 'Organisms/CreateSheet',
  component: CreateSheet,
  tags: ['autodocs'],
  args: { visible: true, onClose: fn() },
  argTypes: { visible: { control: 'boolean' } },
  render: (args) => (
    <>
      <ScreenBehind title="Home" />
      <CreateSheet {...args} />
    </>
  ),
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'The Create sheet behind Home’s round + button: Create community, Add event and Add pass, each a row with a tinted icon tile, a title and one line. Add event asks which community when there are several; Add pass asks whether it is for a community or an event, then which one. Rows a person can’t use yet are dimmed with one line saying why.',
          use: 'from the floating + on Home, through `useCreateSheet().open()`. `CreateSheetProvider` holds it above the tabs so it survives a tab unmounting under it.',
          avoid: 'as a fan of mini buttons or a menu of every action in the app. It has three rows; anything else starts from its own screen.',
          usage: `const { open } = useCreateSheet();

<Fab accessibilityLabel="Create" onPress={open} />`,
          a11y: [
            'Each row is a button spoken as its title and line, “Add event. Create New Event for your community.”',
            'Disabled rows carry `accessibilityState.disabled`, and the reason is a visible line under them.',
            'Rows are at least 68pt tall. The second step adds a Back button before the title.',
            'Pull down, tap the dimmed screen or use system back to close; closing changes nothing.',
          ],
          do: ['Say in one line why a row can’t be used yet.', 'Skip the picker when there is only one community: go straight on.'],
          dont: ['Hide a row a person can’t use; show it dimmed with the reason.', 'Open a second sheet over it; its steps stay inside it.'],
        }),
      },
    },
  },
} satisfies Meta<typeof CreateSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MemberWithNoCommunity: Story = {
  name: 'Member with no community',
  parameters: {
    memberly: { account: 'existing-member' },
    ...storyDoc('A member who runs nothing: Add event and Add pass are dimmed with the line saying a community comes first.'),
  },
};

export const OrganizerWithOne: Story = {
  name: 'Organizer with one community',
  parameters: storyDoc('The existing organizer: every row works, and Add event goes straight to Create New Event.'),
};

export const OrganizerWithSeveral: Story = {
  name: 'Organizer with several communities',
  render: (args) => (
    <Sample name="two-communities" load={runTwoCommunities}>
      {() => (
        <>
          <ScreenBehind title="Home" />
          <CreateSheet {...args} />
        </>
      )}
    </Sample>
  ),
  play: async () => {
    await userEvent.click(await screen.findByTestId('create-event'));
  },
  parameters: storyDoc('An organizer who runs two communities taps Add event: the sheet asks which community.'),
};

export const AddPassFor: Story = {
  name: 'Add pass, choose what for',
  play: async () => {
    await userEvent.click(await screen.findByTestId('create-pass'));
  },
  parameters: storyDoc('After Add pass: a community membership or a pass for one event.'),
};

export const NewOrganizerNoEvents: Story = {
  name: 'New organizer, no events yet',
  play: async () => {
    await userEvent.click(await screen.findByTestId('create-pass'));
    await userEvent.click(await screen.findByTestId('create-pass-event'));
  },
  parameters: {
    memberly: { account: 'new-organizer' },
    ...storyDoc('A new organizer chooses a pass for an event and has none yet: the sheet offers New event.'),
  },
};

function OpenFromHome() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 63, gap: 10 }}>
      <Text variant="headline">Home</Text>
      <Button label="Open Create" onPress={() => setOpen(true)} />
      <CreateSheet visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

export const Interactive: Story = {
  render: () => <OpenFromHome />,
  parameters: storyDoc('Open it, step into Add pass and back, and close it. Navigation is logged to Actions.'),
};
