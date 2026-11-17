/**
 * A few well-known cities to suggest as someone types. Any city can be
 * entered; these only save typing and fill in the state or province.
 */
export type CityHint = { name: string; region: string; country: string };

const US = 'United States';
export const CITY_HINTS: CityHint[] = [
  ...[
    ['Atlanta', 'GA'], ['Austin', 'TX'], ['Baltimore', 'MD'], ['Boston', 'MA'], ['Charlotte', 'NC'], ['Chicago', 'IL'],
    ['Dallas', 'TX'], ['Denver', 'CO'], ['Detroit', 'MI'], ['Houston', 'TX'], ['Las Vegas', 'NV'], ['Los Angeles', 'CA'],
    ['Miami', 'FL'], ['Nashville', 'TN'], ['New Orleans', 'LA'], ['New York', 'NY'], ['Oakland', 'CA'], ['Orlando', 'FL'],
    ['Philadelphia', 'PA'], ['Phoenix', 'AZ'], ['Portland', 'OR'], ['Raleigh', 'NC'], ['San Diego', 'CA'],
    ['San Francisco', 'CA'], ['Savannah', 'GA'], ['Seattle', 'WA'], ['Tampa', 'FL'], ['Washington', 'DC'],
  ].map(([name, region]) => ({ name, region, country: US })),
  ...[
    ['Toronto', 'ON'], ['Montreal', 'QC'], ['Vancouver', 'BC'], ['Calgary', 'AB'], ['Ottawa', 'ON'],
  ].map(([name, region]) => ({ name, region, country: 'Canada' })),
  ...[
    ['London', 'England'], ['Manchester', 'England'], ['Birmingham', 'England'], ['Bristol', 'England'], ['Glasgow', 'Scotland'], ['Edinburgh', 'Scotland'],
  ].map(([name, region]) => ({ name, region, country: 'United Kingdom' })),
];

/** Up to five cities in the country whose name starts with what was typed (any word). */
export function cityHints(typed: string, country: string): CityHint[] {
  const q = typed.trim().toLowerCase();
  if (!q) return [];
  return CITY_HINTS.filter((c) => {
    const name = c.name.toLowerCase();
    return c.country === country && name !== q && (name.startsWith(q) || name.split(/\s+/).some((w) => w.startsWith(q)));
  }).slice(0, 5);
}
