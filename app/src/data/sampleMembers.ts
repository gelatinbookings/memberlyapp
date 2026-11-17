import type { Announcement, CommunityMember, MemberStatus } from './types';

/** Invented first and last names, combined to fill a sample community. */
const FIRST = ['Amara', 'Jalen', 'Priya', 'Marcus', 'Leah', 'Dev', 'Naomi', 'Theo', 'Imani', 'Caleb', 'Zoe', 'Andre', 'Maya', 'Rafael', 'Tia', 'Omar', 'Bree', 'Kofi', 'Lena', 'Isaiah', 'Rosa', 'Malik', 'Jade', 'Ezra'];
const LAST = ['Okafor', 'Brooks', 'Shah', 'Reyes', 'Kim', 'Patel', 'Ellis', 'Grant', 'Mensah', 'Rivera', 'Hughes', 'Bello', 'Nguyen', 'Price', 'Adeyemi', 'Ford', 'Lopez', 'Wade'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

/**
 * The i-th sample member of a community. Names repeat in a fixed pattern so
 * every run shows the same people. Newest first: low indexes joined recently.
 */
export function sampleMember(communityId: string, i: number, tier: string): CommunityMember {
  const first = FIRST[(i * 7 + communityId.length) % FIRST.length];
  const last = LAST[(i * 5 + 3) % LAST.length];
  const month = MONTHS[MONTHS.length - 1 - (Math.floor(i / 40) % MONTHS.length)];
  const year = i >= 440 ? ' 2025' : '';
  const status: MemberStatus = i % 37 === 11 ? 'past_due' : 'active';
  return {
    id: `m_${communityId}_${i}`,
    name: `${first} ${last}`,
    initials: `${first[0]}${last[0]}`,
    tier,
    joinedLabel: i < 6 ? `Joined Nov ${16 - i}` : `Joined ${month}${year}`,
    status,
  };
}

/** Announcements Second Sundays has already sent. */
export const SAMPLE_ANNOUNCEMENTS: Record<string, Announcement[]> = {
  c_second_sundays: [
    {
      id: 'an_sundays_2',
      body: 'Warehouse Friday lineup is set: KOYO closes. Members get in free before midnight.',
      audienceLabel: 'All members',
      reachLabel: 'Sent to 1,204 members',
      sentLabel: 'Nov 12',
    },
    {
      id: 'an_sundays_1',
      body: 'Inner Circle: guest list for the rooftop opens Thursday at noon. Reply in the app to add your plus one.',
      audienceLabel: 'Inner Circle',
      reachLabel: 'Sent to 310 members',
      sentLabel: 'Nov 3',
    },
  ],
};
