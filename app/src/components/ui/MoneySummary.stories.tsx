import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { componentDocs, storyDoc } from '@/stories/support/docs';
import { bookingIn, Sample } from '@/stories/support/Sample';

import { MoneySummary } from './MoneySummary';

const meta = {
  title: 'Molecules/MoneySummary',
  component: MoneySummary,
  tags: ['autodocs'],
  argTypes: { lines: { control: false }, total: { control: false }, footnote: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'The money card: each line the server itemised, in muted text with tabular figures, a 1px rule, then the total in Money type (800, 28px, tabular) with a label that says held, charged or released. It never adds anything up.',
          use: 'wherever an amount is about to be held or has been: the offer review sheet, a pass checkout.',
          avoid: 'for a single inline amount (use `Text` at body size, 600) or for anything on a public surface: members never see fees.',
          usage: `<MoneySummary
  lines={[
    { label: \`\${dj.name}’s fee\`, cents: quote.offerCents },
    { label: 'Gelatin service fee', cents: quote.serviceFeeCents },
  ]}
  total={{ label: 'Held on your card', cents: quote.totalCents }}
/>`,
          a11y: [
            'Each line is read label then amount; the total reads last, with its label.',
            'Amounts use tabular figures, so they line up and are read as currency.',
            'Money type scales with Dynamic Type; the total wraps under its label at large sizes.',
          ],
          do: [
            'Pass the lines and total exactly as the server sent them.',
            'Label the total with what happens to it: “Held on your card”, “Charged”.',
            'Put the hold line nearby: held, not charged, and released if the DJ passes.',
          ],
          dont: ['Compute a total, a fee or a sum in the app.', 'Show it on a public page.', 'Style an amount the server didn’t send in Money type.'],
        }),
      },
    },
  },
} satisfies Meta<typeof MoneySummary>;

export default meta;
type Story = StoryObj<typeof MoneySummary>;

export const HeldOnYourCard: Story = {
  name: 'Held on your card',
  render: (args) => (
    <Sample
      name="quote"
      load={async (repo) => {
        const [offer] = await repo.getDraftOffers('e_late_service');
        return { dj: offer.dj, quote: await repo.quoteOffer('e_late_service', offer.dj.id, offer.offerCents ?? 0) };
      }}>
      {({ dj, quote }) => (
        <MoneySummary
          {...args}
          lines={[
            { label: `${dj.name}’s fee`, cents: quote.offerCents },
            { label: 'Gelatin service fee', cents: quote.serviceFeeCents },
          ]}
          total={{ label: 'Held on your card', cents: quote.totalCents }}
        />
      )}
    </Sample>
  ),
  parameters: storyDoc('The offer review sheet: the fee, the Gelatin service fee and what will be held, from the server’s quote.'),
};

export const WithFootnote: Story = {
  name: 'With footnote',
  render: (args) => (
    <Sample
      name="quote"
      load={async (repo) => {
        const [offer] = await repo.getDraftOffers('e_late_service');
        return { dj: offer.dj, quote: await repo.quoteOffer('e_late_service', offer.dj.id, offer.offerCents ?? 0) };
      }}>
      {({ dj, quote }) => (
        <MoneySummary
          {...args}
          lines={[
            { label: `${dj.name}’s fee`, cents: quote.offerCents },
            { label: 'Gelatin service fee', cents: quote.serviceFeeCents },
          ]}
          total={{ label: 'Held on your card', cents: quote.totalCents }}
          footnote={`You’re charged only if ${dj.name} accepts. If they pass or don’t answer, the hold is released.`}
        />
      )}
    </Sample>
  ),
  parameters: storyDoc('With a helper line under the total saying when the hold becomes a charge.'),
};

export const Charged: Story = {
  render: (args) => (
    <Sample
      name="charged"
      load={async (repo) => {
        const booking = await bookingIn(repo, 'confirmed');
        const quote = await repo.quoteOffer('e_sunday_sessions', booking.dj.id, booking.offerCents);
        return { booking, quote };
      }}>
      {({ booking, quote }) => (
        <MoneySummary
          {...args}
          lines={[
            { label: `${booking.dj.name}’s fee`, cents: quote.offerCents },
            { label: 'Gelatin service fee', cents: quote.serviceFeeCents },
          ]}
          total={{ label: 'Charged', cents: booking.totalCents }}
          footnote={`${booking.dj.name} accepted. They’re on your public lineup.`}
        />
      )}
    </Sample>
  ),
  parameters: storyDoc('After the DJ accepted: the same lines, and the total labelled Charged.'),
};
