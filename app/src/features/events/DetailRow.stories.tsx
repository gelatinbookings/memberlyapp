import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CalendarDays, Clock, DollarSign, MapPin } from 'lucide-react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Text } from '@/components/ui';
import { formatEventDate, formatEventRange } from '@/lib/dates';
import { OnEventPage } from '@/stories/support/atoms-molecules';
import { componentDocs, storyDoc } from '@/stories/support/docs';
import { darkPalette } from '@/theme/tokens';

import { DetailRow } from './EventPageParts';

/** An 18px row icon in the foreground colour, as the event page draws them. */
const icon = (Icon: typeof CalendarDays) => <Icon size={18} color={darkPalette.foreground} strokeWidth={2} />;

const meta = {
  title: 'Molecules/DetailRow',
  component: DetailRow,
  tags: ['autodocs'],
  args: { label: 'Date' },
  argTypes: {
    label: { control: 'text' },
    detail: { control: 'text' },
    icon: { control: false },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: componentDocs({
          what: 'One fact about an event: a 36px muted icon tile, a small muted label, the value in strong body text, and an optional muted line under it. With `onPress` the whole row is a button (Location opens Maps). Exported from `features/events/EventPageParts.tsx`.',
          use: 'in Event details on the event page: Date, Time, Location and Price, stacked with no rules between them.',
          avoid: 'for settings or navigation rows (`ListRow`), or for anything you’d edit (`SelectField`). Not for a member perk (`MemberPerks` has its own pill).',
          usage: `<DetailRow icon={<CalendarDays size={18} color={c.foreground} strokeWidth={2} />} label="Date" value={formatEventDate(e.startsAt, e.timeZone)} />
<DetailRow
  icon={<MapPin size={18} color={c.foreground} strokeWidth={2} />}
  label="Location"
  value={details.venue.name}
  detail={details.venue.address}
  onPress={openInMaps}
/>`,
          a11y: [
            'A plain row is one element, read as its label then its value.',
            'A tappable row is a button spoken as “Location: The Foundry Room 1180 Foundry St NW…”, at least 44pt tall, and dims while pressed.',
            'The icon is decoration.',
          ],
          do: [
            'Use the server’s wording for the price, in the success colour when members come first.',
            'Make a row tappable only when it goes somewhere useful, such as Maps.',
          ],
          dont: ['Put a fee, a booking or a booker’s name in a row: the event page is public.', 'Add a chevron: these aren’t navigation rows.'],
        }),
      },
    },
  },
} satisfies Meta<typeof DetailRow>;

export default meta;
/** Icon and value come from the sample world inside each story's render. */
type Story = StoryObj<typeof DetailRow>;

export const Plain: Story = {
  render: () => (
    <OnEventPage eventId="e_warehouse_friday">
      {({ event }) => <DetailRow icon={icon(CalendarDays)} label="Date" value={formatEventDate(event.startsAt, event.timeZone)} />}
    </OnEventPage>
  ),
  parameters: storyDoc('A fact with nothing under it, such as the date. Not tappable.'),
};

export const WithDetail: Story = {
  name: 'With a line under it, tappable',
  render: () => (
    <OnEventPage eventId="e_warehouse_friday">
      {({ details }) => (
        <DetailRow icon={icon(MapPin)} label="Location" value={details.venue.name} detail={details.venue.address} onPress={fn()} />
      )}
    </OnEventPage>
  ),
  parameters: storyDoc('The venue and its address under it. The row opens Maps, so it is a button and dims while pressed.'),
};

export const StyledValue: Story = {
  name: 'Styled value',
  render: () => (
    <OnEventPage eventId="e_warehouse_friday">
      {({ details }) => {
        const [lead, ...rest] = details.price.line.split(' · ');
        return (
          <DetailRow
            icon={icon(DollarSign)}
            label="Price"
            value={
              <Text variant="bodyStrong">
                <Text variant="bodyStrong" tone="success">
                  {lead}
                </Text>
                {rest.length ? <Text tone="muted">{` · ${rest.join(' · ')}`}</Text> : null}
              </Text>
            }
          />
        );
      }}
    </OnEventPage>
  ),
  parameters: storyDoc('The value as its own text: the price line from the server, members first in green, guests after in muted text.'),
};

export const EventDetails: Story = {
  name: 'Event details',
  render: () => (
    <OnEventPage eventId="e_warehouse_friday">
      {({ event, details }) => (
        <View>
          <DetailRow icon={icon(CalendarDays)} label="Date" value={formatEventDate(event.startsAt, event.timeZone)} />
          <DetailRow icon={icon(Clock)} label="Time" value={formatEventRange(event.startsAt, event.endsAt, event.timeZone)} />
          <DetailRow icon={icon(MapPin)} label="Location" value={details.venue.name} detail={details.venue.address} onPress={fn()} />
          <DetailRow icon={icon(DollarSign)} label="Price" value={details.price.line} />
        </View>
      )}
    </OnEventPage>
  ),
  parameters: storyDoc('The four rows as the event page stacks them under Event details (Warehouse Friday).'),
};
