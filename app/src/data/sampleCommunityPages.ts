import type { SocialNetwork } from './types';

/**
 * Public profiles for the sample communities: tagline, About, links, tags and
 * the membership tiers they offer. Invented for the design build; the names
 * and handles are made up. Prices are integer cents; the fake server words
 * them ("$25 a month", "Free"), the app only shows the words.
 */
export type SampleCommunityPage = {
  tagline: string;
  about: string;
  location: string;
  verified: boolean;
  links: { network: SocialNetwork; url: string }[];
  /** Photos from the bundled sample covers, by key. */
  gallery: ('warehouse' | 'rooftop' | 'dinner' | 'crowd' | 'dayparty')[];
  /** Tiers for communities the organizer didn't set up in the app. */
  tiers: { id: string; name: string; priceCents: number | null; included: string }[];
};

const GA = 'Atlanta, GA, United States';

export const SAMPLE_COMMUNITY_PAGES: Record<string, SampleCommunityPage> = {
  c_second_sundays: {
    tagline: 'One long room, one sound system, every second Sunday.',
    about:
      'House and Afrobeats nights on the Westside, the second Sunday of every month and most Fridays. Members get in free before midnight, skip the line, and hear about new nights first.',
    location: GA,
    verified: true,
    links: [
      { network: 'instagram', url: 'https://instagram.com/secondsundaysatl' },
      { network: 'tiktok', url: 'https://tiktok.com/@secondsundaysatl' },
    ],
    gallery: ['warehouse', 'crowd', 'dayparty', 'rooftop'],
    tiers: [],
  },
  c_rooftop: {
    tagline: 'Skyline nights with a members-first guest list.',
    about: 'Rooftops across Midtown, one night a week. R&B and house as the sun goes down, cocktails, and a guest list that puts members first.',
    location: GA,
    verified: true,
    links: [{ network: 'instagram', url: 'https://instagram.com/rooftopsocietyatl' }],
    gallery: ['rooftop', 'dinner'],
    tiers: [
      { id: 'cp_rooftop_free', name: 'Free tier', priceCents: null, included: 'Free entry before 11 PM at every Rooftop Society night' },
      { id: 'cp_rooftop_plus', name: 'Skyline', priceCents: 3500, included: 'A welcome drink, a plus one, and first access to tables' },
    ],
  },
  c_bass_church: {
    tagline: 'Techno for members, in rooms you won’t find on a map.',
    about: 'Underground techno nights for members only. Phones in pockets on the floor; the address comes the day before.',
    location: GA,
    verified: false,
    links: [{ network: 'instagram', url: 'https://instagram.com/basschurch' }],
    gallery: ['crowd', 'warehouse'],
    tiers: [{ id: 'cp_bass_member', name: 'Congregation', priceCents: 2000, included: 'Entry to every Bass Church night' }],
  },
  c_supper_club: {
    tagline: 'One long table, a different chef every month.',
    about: 'Dinners for 24 at one long table, with wine pairings from the cellar. Members get passes a week before everyone else.',
    location: GA,
    verified: true,
    links: [{ network: 'instagram', url: 'https://instagram.com/supperclubatl' }],
    gallery: ['dinner', 'rooftop'],
    tiers: [{ id: 'cp_supper_table', name: 'Table member', priceCents: 4000, included: 'First pick of seats at every dinner' }],
  },
  c_daylight: {
    tagline: 'Day parties all year, outdoors when the weather lets us.',
    about: 'Afrobeats and amapiano under the canopy, from two until seven. Bring your crew and your sunglasses.',
    location: GA,
    verified: false,
    links: [{ network: 'instagram', url: 'https://instagram.com/daypartycollective' }],
    gallery: ['dayparty', 'crowd'],
    tiers: [{ id: 'cp_daylight_free', name: 'Member', priceCents: null, included: 'Early passes and a members line' }],
  },
  c_listening_room: {
    tagline: 'Small rooms, good speakers, records played in full.',
    about: 'A new record start to finish on a proper system, then a conversation with the people who made it.',
    location: GA,
    verified: false,
    links: [],
    gallery: ['rooftop'],
    tiers: [{ id: 'cp_listening_free', name: 'Listener', priceCents: null, included: 'First access to every session' }],
  },
  c_westside_makers: {
    tagline: 'Workshops for people who make things.',
    about: 'Clay, print, wood and paper, on the Westside. No experience needed; you take home what you make.',
    location: GA,
    verified: false,
    links: [],
    gallery: ['dinner'],
    tiers: [{ id: 'cp_makers_free', name: 'Maker', priceCents: null, included: 'Members-only open studio nights' }],
  },
};
