import type { RichSpan } from './types';

/**
 * The words on each sample event's page: venue, About, member perks, who's
 * going, and the host's own line. Invented for the design build; the names,
 * places and people are made up. Prices and access are not here: the fake
 * server works those out from each event's pass types, as the real one will.
 */
export type SampleEventPage = {
  venue: { name: string; address: string };
  about: RichSpan[][];
  memberPerks: { title: string; kind: string; detail: string }[];
  going: { names: string[]; othersCount: number };
  hostAbout: string;
  verified: boolean;
  /** Passes stopped selling. Default: on sale. */
  salesEnded?: boolean;
};

const PEOPLE = [
  'Ada Okafor',
  'Faith Gowen',
  'Simone Hart',
  'Carmen Reyes',
  'Jordan Blake',
  'Nia Brooks',
  'Marcus Lee',
  'Tasha Green',
];

const crowd = (from: number, count: number) => PEOPLE.slice(from, from + count);

export const SAMPLE_EVENT_PAGES: Record<string, SampleEventPage> = {
  e_warehouse_friday: {
    venue: { name: 'The Foundry Room', address: '1180 Foundry St NW, Atlanta, GA 30318' },
    about: [
      [
        { text: 'Warehouse Friday is back. ' },
        { text: 'One long room, one sound system, house and Afrobeats until 2.', bold: true },
        { text: ' Come early: members get in free before midnight, and the floor fills fast after.' },
      ],
      [{ text: 'Dress code: ', bold: true }, { text: 'all black, comfortable shoes.' }],
      [
        { text: 'Follow the night on Instagram: ' },
        { text: '@secondsundaysatl', link: 'https://instagram.com/secondsundaysatl' },
      ],
      [{ text: '21+ to attend. Passes are non-refundable.', italic: true }],
    ],
    memberPerks: [
      { title: 'Free before midnight', kind: 'Event access', detail: 'Members walk in free until 12.' },
      { title: 'Skip the line', kind: 'Event access', detail: 'A members lane at every Second Sundays night.' },
      { title: 'Bring a friend at member price', kind: 'Guest', detail: 'One guest pass at the member rate.' },
    ],
    going: { names: crowd(0, 4), othersCount: 86 },
    hostAbout: 'House and Afrobeats nights on the Westside, the second Sunday of every month and most Fridays.',
    verified: true,
  },
  e_rooftop_hours: {
    venue: { name: 'Skyline Terrace', address: '75 Peachtree Pl NE, Atlanta, GA 30309' },
    about: [
      [
        { text: 'Cocktails over the skyline, R&B and house as the sun goes down. ' },
        { text: 'Members are first on the guest list.', bold: true },
      ],
      [
        { text: 'Tables for four sell out early. If you’re celebrating, book one ahead and tell the host at the door.' },
      ],
      [{ text: 'Upscale attire. 21+.', italic: true }],
    ],
    memberPerks: [
      { title: 'Free before 11', kind: 'Event access', detail: 'Members get in free until 11 PM.' },
      { title: 'A welcome drink', kind: 'Perk', detail: 'On the house at the bar for members.' },
    ],
    going: { names: crowd(2, 4), othersCount: 35 },
    hostAbout: 'Rooftops across Midtown, one night a week, with a members-first guest list.',
    verified: true,
  },
  e_night_service: {
    venue: { name: 'The Chapel', address: '640 Edgewood Ave SE, Atlanta, GA 30312' },
    about: [
      [{ text: 'Techno in a converted chapel. ' }, { text: 'Members only, and free for members.', bold: true }],
      [{ text: 'Phones stay in your pocket on the floor. Photos at the bar only.' }],
    ],
    memberPerks: [{ title: 'Entry all night', kind: 'Event access', detail: 'Members only: your membership is your pass.' }],
    going: { names: crowd(4, 3), othersCount: 52 },
    hostAbout: 'Underground techno nights for members, in rooms you won’t find on a map.',
    verified: false,
  },
  e_long_table: {
    venue: { name: 'The Long Room at Elm', address: '230 Elizabeth St NE, Atlanta, GA 30307' },
    about: [
      [
        { text: 'Five courses at one long table, with wine pairings from the cellar. ' },
        { text: 'Seats are limited to 24.', bold: true },
      ],
      [{ text: 'Tell us about allergies when you get your pass; the kitchen will work around them.' }],
    ],
    memberPerks: [{ title: 'First pick of seats', kind: 'Early access', detail: 'Members get passes a week before everyone else.' }],
    going: { names: crowd(1, 3), othersCount: 14 },
    hostAbout: 'Dinners at one long table, a different chef every month.',
    verified: true,
  },
  e_daylight: {
    venue: { name: 'The Canopy at Grant Park', address: '800 Cherokee Ave SE, Atlanta, GA 30315' },
    about: [[{ text: 'Sun, a big patio and a DJ booth under the canopy. ' }, { text: 'Afrobeats and amapiano from 2 to 7.', bold: true }]],
    memberPerks: [],
    going: { names: crowd(3, 4), othersCount: 120 },
    hostAbout: 'Day parties all year, outdoors when the weather lets us.',
    verified: false,
  },
  e_listening_session: {
    venue: { name: 'Studio 9', address: '310 Walker St SW, Atlanta, GA 30313' },
    about: [[{ text: 'A new record, start to finish, on a proper system. Then a conversation with the people who made it.' }]],
    memberPerks: [],
    going: { names: crowd(5, 3), othersCount: 9 },
    hostAbout: 'Small rooms, good speakers, records played in full.',
    verified: false,
  },
  e_clay_and_wine: {
    venue: { name: 'Westside Clay Studio', address: '1050 Howell Mill Rd NW, Atlanta, GA 30318' },
    about: [[{ text: 'Clay, a wheel and two glasses of wine. No experience needed; you take your piece home after it’s fired.' }]],
    memberPerks: [],
    going: { names: crowd(0, 2), othersCount: 18 },
    hostAbout: 'Workshops for people who make things, on the Westside.',
    verified: false,
    salesEnded: true,
  },
};

/** For any event without its own page copy: the event's description, nothing more. */
export function defaultEventPage(description: string, neighborhood: string, city: string): SampleEventPage {
  return {
    venue: { name: neighborhood, address: `${neighborhood}, ${city}` },
    about: [[{ text: description }]],
    memberPerks: [],
    going: { names: [], othersCount: 0 },
    hostAbout: '',
    verified: false,
  };
}
