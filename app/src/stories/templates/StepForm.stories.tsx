import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { Button, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { Slot } from '@/stories/support/organisms';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

const STEPS = ['Step one', 'Step two', 'Step three', 'Step four'];

/** The four-segment step bar, drawn as Create community draws it: purple up to the current step, its short name under each. */
function StepBar({ step }: { step: number }) {
  const c = useTheme();
  return (
    <View style={styles.steps} accessible accessibilityLabel={`Step ${step + 1} of ${STEPS.length}, ${STEPS[step]}`}>
      {STEPS.map((title, i) => (
        <View key={title} style={styles.step}>
          <View style={[styles.bar, { backgroundColor: i <= step ? c.brand : c.muted }]} />
          <Text variant="helper" tone={i === step ? 'brand' : 'muted'} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** A titled group of fields: the title, one muted line, then the fields 16pt apart. */
function Group({ title, line, children }: { title: string; line: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="secondary" tone="muted">
          {line}
        </Text>
      </View>
      {children}
    </View>
  );
}

function StepForm({ step, blocker, onNext, onBack }: { step: number; blocker?: string; onNext?: () => void; onBack?: () => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const last = step === STEPS.length - 1;
  return (
    <Screen
      key={step}
      footer={<Button label={blocker ?? (last ? 'Finish' : 'Continue')} disabled={!!blocker} onPress={onNext ?? fn()} />}>
      <ScreenHeader title={`${STEPS[step]} title`} subtitle="The flow’s name" onBack={onBack ?? fn()} />
      <StepBar step={step} />
      <Group title="Group title" line="One line on what this group is for.">
        <TextField label="Field label" value={a} onChangeText={setA} placeholder="Placeholder" helper="Helper line under the field." />
        <TextField label="Another field (optional)" value={b} onChangeText={setB} placeholder="Placeholder" />
      </Group>
      <Group title="Second group" line="One line on what this group is for.">
        <Slot label="A preview, a picker or a list of choices" height={120} />
      </Group>
    </Screen>
  );
}

const meta = {
  title: 'Templates/Step form',
  component: Screen,
  tags: ['autodocs'],
  args: { children: null },
  argTypes: { children: { control: false }, footer: { control: false }, contentStyle: { control: false } },
  render: () => <StepForm step={0} />,
  parameters: {
    frame: 'screen',
    docs: {
      description: {
        component: componentDocs({
          what: 'A form in four short steps on one screen: the `ScreenHeader` with the step’s title and the flow’s name under it, the four-segment step bar (purple up to the current step, its short name under each), groups of fields with a title and one line, and Continue pinned at the foot. The last step’s button finishes. Going back keeps what was typed.',
          use: 'for a long setup that splits cleanly into four: Create community (story, look, discovery, pricing). Preferences uses the same bar with its own step titles. Pages built on it: Create community, Preferences.',
          avoid: 'for a form that fits on one screen (Pushed screen template) or a two-field task (Bottom sheet template). Don’t split a form into steps just to make it look shorter.',
          usage: `<Screen key={\`step-\${step}\`} footer={<Button label={blocker ?? 'Continue'} disabled={!!blocker} onPress={next} />}>
  <ScreenHeader title={STEP_TITLES[step]} subtitle="Create community" onBack={back} />
  <StepBar step={step} />
  {fields}
</Screen>`,
          a11y: [
            'The step bar is one element, “Step 2 of 4, Look”.',
            'Group titles are headers. Every field has a visible label 6pt above it and its helper 12pt muted below.',
            'When the step can’t go on, the button says what is missing in its label rather than only going grey.',
            'Back on step 1 leaves the flow; on later steps it goes to the previous step.',
          ],
          do: [
            'Keep 20pt between groups, 16pt between fields, 6pt between a label and its field, 4pt between the step bar and its names.',
            'Name what is missing on the disabled button (“Add a name”).',
            'Keep Continue pinned and full width, above the home indicator.',
          ],
          dont: ['Put a kicker such as “STEP 2” above the title: the bar says it.', 'Lose what was typed when going back.'],
        }),
      },
    },
  },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
  name: 'First step',
  parameters: storyDoc('The first step: one segment purple, Continue at the foot.'),
};

export const MiddleStep: Story = {
  name: 'Middle step',
  render: () => <StepForm step={2} />,
  parameters: storyDoc('The third of four: three segments purple, the current name in brand text.'),
};

export const LastStep: Story = {
  name: 'Last step',
  render: () => <StepForm step={3} />,
  parameters: storyDoc('The last step: the bar is full and the button finishes the flow.'),
};

export const CantContinue: Story = {
  name: 'Can’t continue yet',
  render: () => <StepForm step={0} blocker="Add a name" />,
  parameters: storyDoc('Something required is missing: the button is disabled and says what.'),
};

function Walkthrough() {
  const [step, setStep] = useState(0);
  return (
    <StepForm
      step={step}
      onNext={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
      onBack={() => setStep((s) => Math.max(s - 1, 0))}
    />
  );
}

export const Interactive: Story = {
  render: () => <Walkthrough />,
  parameters: storyDoc('Continue and Back move through the four steps; the bar follows.'),
};

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: space.label },
  step: { flex: 1, gap: space.label },
  bar: { height: 4, borderRadius: radius.pill },
  group: { gap: space.md },
  groupHead: { gap: space.xs },
});
