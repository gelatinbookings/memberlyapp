import { sampleDjs } from '@/data/fakeRepository';

import { djCardLabel, spokenDraw, spokenRate } from '../djLabel';
import {
  BUDGET_BANDS,
  budgetLabel,
  doneLabel,
  filtersActive,
  genreLabel,
  genreOptions,
  loosenLabel,
  matchLine,
  NO_FILTERS,
  openLine,
  showAllLabel,
  showDjsLabel,
  toggleBudget,
  toggleGenre,
  tooTightBody,
} from '../filters';

describe('budget bands', () => {
  it('maps the four pills to the ids the API accepts, in sheet order', () => {
    expect(BUDGET_BANDS.map((b) => [b.label, b.id])).toEqual([
      ['Under $300', 'under_300'],
      ['$300 – $600', '300_to_600'],
      ['$600 – $1,000', '600_to_1000'],
      ['$1,000 and up', '1000_plus'],
    ]);
  });

  it('labels the chips with the active filter, or any', () => {
    expect(budgetLabel(null)).toBe('Any budget');
    expect(budgetLabel('600_to_1000')).toBe('$600 – $1,000');
    expect(genreLabel(null)).toBe('Any genre');
    expect(genreLabel('Techno')).toBe('Techno');
  });
});

describe('filter state', () => {
  it('is single-select: a second tap on the chosen pill goes back to any', () => {
    const under = toggleBudget(NO_FILTERS, 'under_300');
    expect(under).toEqual({ budget: 'under_300', genre: null });
    expect(toggleBudget(under, '1000_plus').budget).toBe('1000_plus');
    expect(toggleBudget(under, 'under_300').budget).toBeNull();
    const techno = toggleGenre(under, 'Techno');
    expect(techno).toEqual({ budget: 'under_300', genre: 'Techno' });
    expect(toggleGenre(techno, 'House').genre).toBe('House');
    expect(toggleGenre(techno, 'Techno').genre).toBeNull();
  });

  it('knows when anything is filtered', () => {
    expect(filtersActive(NO_FILTERS)).toBe(false);
    expect(filtersActive({ budget: null, genre: 'House' })).toBe(true);
    expect(filtersActive({ budget: 'under_300', genre: null })).toBe(true);
  });

  it('keeps a chosen genre on show when the new band no longer offers it', () => {
    expect(genreOptions(['Soul', 'Disco'], 'Techno')).toEqual(['Soul', 'Disco', 'Techno']);
    expect(genreOptions(['Soul', 'Disco'], 'Soul')).toEqual(['Soul', 'Disco']);
    expect(genreOptions(['Soul'], null)).toEqual(['Soul']);
  });
});

describe('browse copy', () => {
  it('counts on the apply button only when the server counts', () => {
    expect(showDjsLabel(3)).toBe('Show 3 DJs');
    expect(showDjsLabel(1)).toBe('Show 1 DJ');
    expect(showDjsLabel(0)).toBe('Show 0 DJs');
    expect(showDjsLabel(null)).toBe('Show DJs');
    expect(showDjsLabel(undefined)).toBe('Show DJs');
  });

  it('names the night and city in the header', () => {
    expect(openLine(5, 'Fri, Nov 20', 'Atlanta')).toBe('5 DJs open on Fri, Nov 20 in Atlanta');
    expect(openLine(1, 'Fri, Nov 20', 'Atlanta')).toBe('1 DJ open on Fri, Nov 20 in Atlanta');
    expect(openLine(undefined, 'Fri, Nov 20', 'Atlanta')).toBe('DJs open on Fri, Nov 20 in Atlanta');
    expect(matchLine(0, 5)).toBe('0 of 5 DJs match');
    expect(matchLine(3, 10)).toBe('3 of 10 DJs match');
  });

  it('labels the bottom bar with how many are added', () => {
    expect(doneLabel(0)).toBe('Done');
    expect(doneLabel(1)).toBe('Done · 1 added');
    expect(doneLabel(2)).toBe('Done · 2 added');
  });

  it('explains filters that are too tight without giving a reason for any DJ', () => {
    expect(tooTightBody(5, 'Fri, Nov 20', { budget: 'under_300', genre: 'Techno' })).toBe(
      '5 DJs are open on Fri, Nov 20. None play techno under $300. Loosen one filter to see them.',
    );
    expect(tooTightBody(5, 'Fri, Nov 20', { budget: '300_to_600', genre: 'R&B' })).toBe(
      '5 DJs are open on Fri, Nov 20. None play R&B at $300 – $600. Loosen one filter to see them.',
    );
    expect(tooTightBody(4, 'Fri, Nov 20', { budget: '1000_plus', genre: null })).toBe(
      '4 DJs are open on Fri, Nov 20. None are at $1,000 and up. Clear the filter to see them.',
    );
    expect(tooTightBody(undefined, 'Fri, Nov 20', { budget: null, genre: 'Baile funk' })).toBe(
      'DJs are open on Fri, Nov 20. None play baile funk. Clear the filter to see them.',
    );
  });

  it('puts a count on the loosening buttons when there is one', () => {
    expect(loosenLabel('Any budget', 2)).toBe('Any budget · 2');
    expect(loosenLabel('Any genre', undefined)).toBe('Any genre');
    expect(showAllLabel(5)).toBe('Show all 5');
    expect(showAllLabel(null)).toBe('Show all');
  });
});

describe('a DJ card as one VoiceOver sentence', () => {
  it('reads name, tier, genres, rate, draw and the action', () => {
    expect(djCardLabel(sampleDjs.koyo, false)).toBe('KOYO, Top performer, House and Afrobeats, $450 per set, draws 180 to 260, Add');
    expect(djCardLabel(sampleDjs.koyo, true)).toMatch(/, Added$/);
  });

  it('says private rate and draw not yet established as they are', () => {
    expect(spokenRate(sampleDjs.nightform)).toBe('private rate');
    expect(spokenDraw(sampleDjs.sable)).toBe('draw not yet established');
    expect(djCardLabel(sampleDjs.nightform, false)).toBe('NIGHTFORM, City pillar, Techno and Bass, private rate, draws 240 to 330, Add');
    expect(djCardLabel(sampleDjs.sable, false)).toBe('Sable Hart, Verified, Soul and Disco, $275 per set, draw not yet established, Add');
  });
});
