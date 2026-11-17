/**
 * The tables on the Foundations pages. Every value is read from
 * `src/theme/tokens.ts` at render time, so the docs can never drift from
 * what the app ships. Only the words (when to use each value) live here.
 */
import * as Icons from 'lucide-react-native';
import type { CSSProperties, ReactNode } from 'react';

import { Text } from '@/components/ui';
import { darkPalette, font, motion, radius, size, space, type, type Palette, type TypeVariant } from '@/theme/tokens';

const c = darkPalette;

const cell: CSSProperties = { padding: '10px 12px', borderBottom: `1px solid ${c.border}`, verticalAlign: 'middle', textAlign: 'left' };
const head: CSSProperties = { ...cell, color: c.mutedText, fontFamily: font.semibold, fontSize: 12 };
const mono: CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: c.foreground };

function Table({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: c.background, color: c.foreground, fontFamily: font.regular, fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} style={head}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/** When to use each palette role, from DESIGN.md (Colors). */
const ROLE_USE: Record<keyof Palette, string> = {
  background: 'Screen ground and the ground of every bottom sheet.',
  card: 'Cards, the tab bar, over-map controls and text fields.',
  muted: 'Inset notices, icon tiles, skeletons, grey status and tier pills, the step-progress track.',
  border: 'Every 1px line, the sheet grab handle, the rules between rows inside a card.',
  foreground: 'Primary text.',
  mutedText: 'Secondary text, inactive tab icons, chevrons. 4.5:1 or better on black and card.',
  brand: 'Primary buttons, the toggle when on, selection, map pins, the Fab. Actions, selection and state only.',
  brandPressed: 'A brand button or pill while it is pressed.',
  ring: 'The focus ring on a text field.',
  tint: 'Selected chips, the active tab, initials avatars, held and negotiating pills, the "yours" card.',
  brandText: 'Text and icons on the tint; links on dark.',
  brandLine: 'The 1px edge of anything tinted: a selected chip, an added DJ card.',
  successBg: 'Under success text: Confirmed, the member’s own Pass.',
  successText: 'Confirmed, Pass, Active.',
  warningBg: 'Under warning text: Payment needed, New offer from the DJ.',
  warningText: 'Payment needed, New offer, a missing fee; the edge of a card that needs action.',
  errorBg: 'Under error text: unavailable, failed, timed out.',
  errorText: 'Errors and the Sign out row.',
  destructive: 'Filled Change date and Cancel buttons. Nothing else.',
  onBrand: 'Text and icons on purple and red fills.',
  scrim: 'The round pill under white text over a photo. The only wash in the system.',
  dim: 'Over the screen behind a sheet or dialog, so it reads at 35%.',
  mapGround: 'The map placeholder’s ground.',
  mapLine: 'Streets on the map placeholder.',
  qrInk: 'QR modules on the Memberly Card: black in every theme, so doors can scan.',
  qrPaper: 'The white behind the QR code.',
};

export function ColorTable() {
  return (
    <Table columns={['Swatch', 'Role', 'Value', 'When to use it']}>
      {(Object.keys(c) as (keyof Palette)[]).map((role) => (
        <tr key={role}>
          <td style={cell}>
            <div style={{ width: 44, height: 44, borderRadius: radius.control, background: c[role], border: `1px solid ${c.border}` }} />
          </td>
          <td style={{ ...cell, ...mono }}>{role}</td>
          <td style={{ ...cell, ...mono }}>{c[role]}</td>
          <td style={cell}>{ROLE_USE[role]}</td>
        </tr>
      ))}
    </Table>
  );
}

/** Where each Text variant is used, from DESIGN.md (Typography). */
const TYPE_USE: Record<TypeVariant, { sample: string; use: string }> = {
  display: { sample: 'Welcome back', use: 'Large-title screens and sheet welcomes (Welcome, onboarding, Events).' },
  headline: { sample: 'Create New Event', use: 'The standard screen title and sheet titles.' },
  title: { sample: 'Also tonight', use: 'Section headers inside a screen or sheet.' },
  cardTitle: { sample: 'Warehouse Friday', use: 'DJ name, event name, primary button labels.' },
  body: { sample: 'A long night in a raw room on the Westside.', use: 'Default text.' },
  bodyStrong: { sample: 'Preferences', use: 'Row labels in settings lists, inline amounts in rows.' },
  secondary: { sample: 'Fri, Nov 20 · Second Sundays · 10 PM', use: 'Meta lines and subtitles, usually muted.' },
  secondaryStrong: { sample: 'Manage in Gelatin', use: 'Chip, pill-button and field labels; links.' },
  helper: { sample: 'DJs, availability and rates from Gelatin', use: 'Under fields, footers, attribution.' },
  money: { sample: '0123456789', use: 'The server’s total, beside a line that says held, charged or released. Tabular.' },
  label: { sample: 'Confirmed', use: 'Status and tier pills only. The only uppercase text.' },
};

export function TypeTable() {
  return (
    <Table columns={['Variant', 'Sample', 'Size / line', 'Face', 'Use']}>
      {(Object.keys(type) as TypeVariant[]).map((v) => (
        <tr key={v}>
          <td style={{ ...cell, ...mono }}>{v}</td>
          <td style={cell}>
            <Text variant={v}>{TYPE_USE[v].sample}</Text>
          </td>
          <td style={{ ...cell, ...mono }}>
            {type[v].fontSize} / {type[v].lineHeight}
          </td>
          <td style={{ ...cell, ...mono }}>{type[v].fontFamily}</td>
          <td style={cell}>{TYPE_USE[v].use}</td>
        </tr>
      ))}
    </Table>
  );
}

const SPACE_USE: Record<keyof typeof space, string> = {
  xs: 'Between a title and its meta line.',
  label: 'Between a field label and its field.',
  sm: 'Between stacked buttons or chips.',
  stack: 'Between stacked cards; the gap inside a card.',
  row: 'Between a row’s avatar and its text.',
  card: 'Padding inside a card.',
  md: 'Inset of the tab bar and over-map controls; gaps inside a sheet.',
  gutter: 'Screen gutters, left and right.',
  section: 'Between sections of a screen.',
};

export function SpacingTable() {
  return (
    <Table columns={['Token', 'Value', 'Bar', 'Use']}>
      {(Object.keys(space) as (keyof typeof space)[]).map((k) => (
        <tr key={k}>
          <td style={{ ...cell, ...mono }}>space.{k}</td>
          <td style={{ ...cell, ...mono }}>{space[k]}px</td>
          <td style={cell}>
            <div style={{ width: space[k], height: 16, background: c.brand, borderRadius: 2 }} />
          </td>
          <td style={cell}>{SPACE_USE[k]}</td>
        </tr>
      ))}
    </Table>
  );
}

const RADIUS_USE: Record<keyof typeof radius, string> = {
  control: 'The primary thing on a screen: buttons, fields, sheet actions.',
  notice: 'Inset notices and 64px / 44px thumbnails.',
  card: 'Cards, event covers, the centred dialog, grouped lists.',
  sheet: 'The top corners of a bottom sheet.',
  pill: 'Everything lighter than the primary action: chips, in-row actions, pills, avatars, the tab bar.',
};

export function RadiusTable() {
  return (
    <Table columns={['Token', 'Value', 'Shape', 'Use']}>
      {(Object.keys(radius) as (keyof typeof radius)[]).map((k) => (
        <tr key={k}>
          <td style={{ ...cell, ...mono }}>radius.{k}</td>
          <td style={{ ...cell, ...mono }}>{radius[k]}px</td>
          <td style={cell}>
            <div style={{ width: 64, height: 40, borderRadius: Math.min(radius[k], 20), border: `1px solid ${c.border}`, background: c.card }} />
          </td>
          <td style={cell}>{RADIUS_USE[k]}</td>
        </tr>
      ))}
    </Table>
  );
}

const SIZE_USE: Record<keyof typeof size, string> = {
  primaryButton: 'Primary and destructive buttons.',
  secondaryButton: 'Secondary full-width buttons.',
  field: 'Text and select fields; round over-map controls.',
  chip: 'Chips and in-row pill buttons.',
  minTarget: 'The smallest tappable height. Anything smaller gets a hit slop up to this.',
  tabBar: 'The floating tab bar.',
  tabActive: 'The active tab’s pill.',
  avatar: 'Default avatar.',
  rowThumb: 'Event thumbnails in rows.',
};

export function SizeTable() {
  return (
    <Table columns={['Token', 'Value', 'Use']}>
      {(Object.keys(size) as (keyof typeof size)[]).map((k) => (
        <tr key={k}>
          <td style={{ ...cell, ...mono }}>size.{k}</td>
          <td style={{ ...cell, ...mono }}>{size[k]}px</td>
          <td style={cell}>{SIZE_USE[k]}</td>
        </tr>
      ))}
    </Table>
  );
}

/** Every Lucide icon the app imports, with where it appears. */
const ICONS: [keyof typeof Icons, string][] = [
  ['ArrowLeft', 'Back, in every header and sheet step'],
  ['ArrowRight', 'Forward on Welcome, Preferences, Verify'],
  ['ArrowUpRight', 'Leaves the app: Manage in Gelatin'],
  ['AtSign', 'Social links section'],
  ['Bell', 'Notify me, the notifications permission'],
  ['CalendarDays', 'Events tab, date tags'],
  ['CalendarOff', 'No DJs open that night'],
  ['CalendarPlus', 'Add event in the Create sheet'],
  ['Check', 'Done section, selected option'],
  ['ChevronDown', 'Select fields, foldable sections'],
  ['ChevronLeft', 'Previous month'],
  ['ChevronRight', 'Row chevrons, next month'],
  ['Clock', 'Time on the event page and Create New Event'],
  ['Compass', 'Explore tab'],
  ['CreditCard', 'Payment didn’t go through'],
  ['Gift', 'Referrals'],
  ['House', 'Home tab'],
  ['ImagePlus', 'Add a photo'],
  ['LayoutGrid', 'Manage (on Me)'],
  ['Lock', 'Locked filters (city, night)'],
  ['LogOut', 'Sign out'],
  ['Map', 'Tonight on the map'],
  ['MapPin', 'Location, no DJs in this city'],
  ['Moon', 'Appearance'],
  ['Music', 'TBA lineup slot, genres'],
  ['Plus', 'Create, add a tier, the Fab'],
  ['QrCode', 'My Memberly Card'],
  ['RefreshCw', 'Try again on the Lineup and in Browse talent'],
  ['Search', 'Explore search'],
  ['Share', 'Share on the event page'],
  ['SlidersHorizontal', 'Filters, Preferences'],
  ['Ticket', 'Access & passes, Add pass'],
  ['TriangleAlert', 'Setup still to finish on Manage'],
  ['User', 'Me tab'],
  ['Users', 'Create community, Start a community'],
  ['WifiOff', 'Offline: the Card, the Lineup, Browse talent'],
  ['Wrench', 'Parts kit (dev only)'],
  ['X', 'Close, remove'],
];

/** Lucide's icons by name, for the grid; the names come from ICONS above. */
const ICON_LIBRARY = Icons as unknown as Record<string, Icons.LucideIcon>;

export function IconGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
      {ICONS.map(([name, use]) => {
        const Icon = ICON_LIBRARY[name];
        return (
          <div key={name} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: radius.notice, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Icon size={20} color={c.foreground} strokeWidth={2} />
            <span style={{ ...mono }}>{name}</span>
            <span style={{ color: c.mutedText, fontFamily: font.regular, fontSize: 12 }}>{use}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Icon sizes from DESIGN.md (Navigation → Icons). */
const ICON_SIZES: [number, string][] = [
  [22, 'Inactive tab'],
  [20, 'Active tab, search, header map button'],
  [18, 'In buttons, rows and tiles'],
  [16, 'Chevrons'],
  [13, 'Inside tags and locked chips (12–13)'],
];

export function IconSizes() {
  return (
    <Table columns={['Size', 'Sample', 'Where']}>
      {ICON_SIZES.map(([px, where]) => (
        <tr key={px}>
          <td style={{ ...cell, ...mono }}>{px}px</td>
          <td style={cell}>
            <Icons.CalendarDays size={px} color={c.foreground} strokeWidth={2} />
          </td>
          <td style={cell}>{where}</td>
        </tr>
      ))}
    </Table>
  );
}

const MOTION_USE: Record<keyof typeof motion, string> = {
  fast: 'Pressed states (scale to 0.97), a sheet settling back, the Reduce Motion fade.',
  base: 'Focus ring, status pill cross-fade, the dim behind a sheet.',
  slow: 'A sheet rising from the bottom edge.',
};

export function MotionTable() {
  return (
    <Table columns={['Token', 'Duration', 'Use']}>
      {(Object.keys(motion) as (keyof typeof motion)[]).map((k) => (
        <tr key={k}>
          <td style={{ ...cell, ...mono }}>motion.{k}</td>
          <td style={{ ...cell, ...mono }}>{motion[k]}ms</td>
          <td style={cell}>{MOTION_USE[k]}</td>
        </tr>
      ))}
    </Table>
  );
}
