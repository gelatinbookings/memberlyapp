import type { TestAccountId } from './testAccounts';
import type { ReferredPerson } from './types';

/**
 * Who each test account has referred, for the Referrals screen. Invented for
 * the design build; the people are made up. No rewards or amounts: the
 * program's terms aren't settled, so the sample world doesn't model them.
 */
export const SAMPLE_REFERRALS: Partial<Record<TestAccountId, ReferredPerson[]>> = {
  'new-organizer': [{ id: 'r_mia', name: 'Mia Lopez', initials: 'ML', status: 'joined', since: '2026-11-12' }],
  'existing-organizer': [
    { id: 'r_tasha', name: 'Tasha Green', initials: 'TG', status: 'started-community', since: '2026-10-28', communityName: 'Southside Run Club' },
    { id: 'r_marcus', name: 'Marcus Lee', initials: 'ML', status: 'joined', since: '2026-11-03' },
    { id: 'r_nia', name: 'Nia Brooks', initials: 'NB', status: 'joined', since: '2026-11-09' },
    { id: 'r_jordan', name: 'Jordan Blake', initials: 'JB', status: 'joined', since: '2026-11-15' },
  ],
  'existing-member': [
    { id: 'r_carmen', name: 'Carmen Reyes', initials: 'CR', status: 'joined', since: '2026-11-01' },
    { id: 'r_simone', name: 'Simone Hart', initials: 'SH', status: 'started-community', since: '2026-11-14', communityName: 'Sunday Supper Society' },
  ],
};
