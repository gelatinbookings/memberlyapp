import type { CreateCommunityInput } from '@/data/types';

/** A complete Create community request for tests; override what a test is about. */
export function communityInput(overrides: Partial<CreateCommunityInput> = {}): CreateCommunityInput {
  return {
    name: 'Night Garden',
    tagline: 'Late sets under the trees.',
    description: 'A monthly night for people who like house music outdoors.',
    country: 'United States',
    state: 'GA',
    city: 'Atlanta',
    logo: { uri: 'file:///logo.jpg' },
    banner: { uri: 'file:///banner.jpg' },
    gallery: [],
    tags: ['Music'],
    links: {},
    membership: { kind: 'free' },
    idempotencyKey: 'k',
    ...overrides,
  };
}
