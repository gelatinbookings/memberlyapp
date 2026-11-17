import type { City, Venue, VenueResults } from './types';

/**
 * Sample venues for the Location type-ahead. Two sources, as the backend will
 * answer GET /app/venues/search:
 *  - Gelatin: venues in Gelatin's database, already known to its DJs.
 *  - Google: public places, which the backend looks up with Google Places
 *    (the API key stays on the server, never in the app).
 * Every name and address here is invented.
 */

const NY = 'America/New_York';

/** Cities a venue can sit in. A venue brings its city, and the city brings the time zone. */
export const venueCities = {
  atl: { id: 'atl', name: 'Atlanta', region: 'GA', timeZone: NY },
  sav: { id: 'sav', name: 'Savannah', region: 'GA', timeZone: NY },
  chi: { id: 'chi', name: 'Chicago', region: 'IL', timeZone: 'America/Chicago' },
  den: { id: 'den', name: 'Denver', region: 'CO', timeZone: 'America/Denver' },
  morrison: { id: 'morrison', name: 'Morrison', region: 'CO', timeZone: 'America/Denver' },
  la: { id: 'la', name: 'Los Angeles', region: 'CA', timeZone: 'America/Los_Angeles' },
  nyc: { id: 'nyc', name: 'New York', region: 'NY', timeZone: NY },
  mia: { id: 'mia', name: 'Miami', region: 'FL', timeZone: NY },
  phx: { id: 'phx', name: 'Phoenix', region: 'AZ', timeZone: 'America/Phoenix' },
  nola: { id: 'nola', name: 'New Orleans', region: 'LA', timeZone: 'America/Chicago' },
  hnl: { id: 'hnl', name: 'Honolulu', region: 'HI', timeZone: 'Pacific/Honolulu' },
} satisfies Record<string, City>;

const v = (source: Venue['source'], id: string, name: string, street: string, city: City, postalCode: string, capacity?: number): Venue => ({
  id,
  source,
  name,
  street,
  city,
  postalCode,
  ...(capacity ? { capacity } : {}),
});

const { atl, sav, chi, den, morrison, la, nyc, mia, phx, nola, hnl } = venueCities;

/** Venues in Gelatin's database. */
export const gelatinVenues: Venue[] = [
  v('gelatin', 'gv_warehouse_district', 'The Warehouse District', '540 Mitchell St SW', atl, '30314', 900),
  v('gelatin', 'gv_skyline_rooftop', 'Skyline Rooftop', '1100 Peachtree St NE, 24th floor', atl, '30309', 250),
  v('gelatin', 'gv_basement_east', 'Basement East', '220 Ponce de Leon Ave NE', atl, '30308', 300),
  v('gelatin', 'gv_long_table_hall', 'Long Table Hall', '75 Krog St NE', atl, '30307', 120),
  v('gelatin', 'gv_garden_yard', 'The Garden Yard', '650 North Ave NE', atl, '30308', 600),
  v('gelatin', 'gv_westside_lot', 'Westside Lot', '1235 Chattahoochee Ave NW', atl, '30318', 1200),
  v('gelatin', 'gv_river_room', 'The River Room', '19 E Bay St', sav, '31401', 200),
  v('gelatin', 'gv_lakeside_loft', 'Lakeside Loft', '311 W Kinzie St', chi, '60654', 450),
  v('gelatin', 'gv_high_plains', 'High Plains Hall', '2100 Larimer St', den, '80205', 750),
  v('gelatin', 'gv_sunset_terrace', 'Sunset Terrace', '8800 Sunset Blvd', la, '90069', 350),
  v('gelatin', 'gv_canal_street_club', 'Canal Street Club', '58 Canal St', nyc, '10002', 280),
];

/** Public places, as Google Places would return them. */
export const googlePlaces: Venue[] = [
  v('google', 'gp_peachtree_ballroom', 'Peachtree Ballroom', '400 Peachtree St NE', atl, '30308'),
  v('google', 'gp_old_fourth_brewhouse', 'Old Fourth Brewhouse', '680 Ralph McGill Blvd NE', atl, '30312'),
  v('google', 'gp_piedmont_pavilion', 'Piedmont Park Pavilion', '1320 Monroe Dr NE', atl, '30306'),
  v('google', 'gp_studio_9', 'Studio 9 Atlanta', '99 Krog St NE', atl, '30307'),
  v('google', 'gp_mitchell_social', 'Mitchell Street Social', '512 Mitchell St SW', atl, '30314'),
  v('google', 'gp_forsyth_hall', 'Forsyth Park Hall', '621 Drayton St', sav, '31401'),
  v('google', 'gp_west_loop_warehouse', 'West Loop Warehouse', '1000 W Fulton Market', chi, '60607'),
  v('google', 'gp_redstone', 'Redstone Amphitheatre', '18300 W Alameda Pkwy', morrison, '80465'),
  v('google', 'gp_arts_district_yard', 'Arts District Yard', '900 E 4th St', la, '90013'),
  v('google', 'gp_brooklyn_navy_hall', 'Navy Yard Hall', '63 Flushing Ave, Brooklyn', nyc, '11205'),
  v('google', 'gp_wynwood_courtyard', 'Wynwood Courtyard', '2520 NW 2nd Ave', mia, '33127'),
  v('google', 'gp_desert_botanical', 'Desert Garden Pavilion', '1201 N Galvin Pkwy', phx, '85008'),
  v('google', 'gp_frenchmen_hall', 'Frenchmen Street Hall', '620 Frenchmen St', nola, '70116'),
  v('google', 'gp_waikiki_lanai', 'Waikiki Lanai', '2335 Kalakaua Ave', hnl, '96815'),
];

/** The one-line address under a venue's name: "540 Mitchell St SW, Atlanta, GA 30314". */
export function venueAddress(venue: Pick<Venue, 'street' | 'city' | 'postalCode'>): string {
  return `${venue.street}, ${venue.city.name}, ${venue.city.region} ${venue.postalCode}`;
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/** Every word typed starts a word in the venue's name or address. */
function matches(venue: Venue, query: string): boolean {
  const typed = words(query);
  if (typed.length === 0) return false;
  const haystack = words(`${venue.name} ${venueAddress(venue)}`);
  return typed.every((t) => haystack.some((w) => w.startsWith(t)));
}

/** Name matches before address-only matches, then A to Z. */
function rank(list: Venue[], query: string): Venue[] {
  const first = words(query)[0] ?? '';
  const named = (x: Venue) => (words(x.name).some((w) => w.startsWith(first)) ? 0 : 1);
  return list.filter((x) => matches(x, query)).sort((a, b) => named(a) - named(b) || a.name.localeCompare(b.name));
}

/** At most five from each source, Gelatin's first. Fewer than two characters finds nothing. */
export function searchSampleVenues(query: string, limit = 5): VenueResults {
  if (query.trim().length < 2) return { gelatin: [], google: [] };
  return { gelatin: rank(gelatinVenues, query).slice(0, limit), google: rank(googlePlaces, query).slice(0, limit) };
}
