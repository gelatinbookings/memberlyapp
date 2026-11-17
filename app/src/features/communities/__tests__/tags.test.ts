import { addTag, canAddTyped, canonicalTag, cleanTag, KNOWN_TAGS, removeTag, STARTER_TAGS, suggestTags, TAG_LIMIT } from '../tags';

describe('community tags', () => {
  it('knows each taxonomy tag once, and starts with a few of them', () => {
    expect(new Set(KNOWN_TAGS).size).toBe(KNOWN_TAGS.length);
    expect(STARTER_TAGS.every((t) => KNOWN_TAGS.includes(t))).toBe(true);
    expect(suggestTags('', [])).toEqual([...STARTER_TAGS]);
    expect(suggestTags('', ['House'])).not.toContain('House');
  });

  it('matches by the start of any word first, then anywhere, five at most', () => {
    expect(suggestTags('house', [])[0]).toBe('House');
    expect(suggestTags('par', [])).toContain('Day parties');
    expect(suggestTags('e', []).length).toBeLessThanOrEqual(5);
    expect(suggestTags('zzz', [])).toEqual([]);
  });

  it('keeps known spellings, tidies the rest, and never adds twice or past the limit', () => {
    expect(canonicalTag('  r&b ')).toBe('R&B');
    expect(cleanTag('Vinyl   only!!')).toBe('Vinyl only');
    expect(addTag(['House'], 'house')).toEqual(['House']);
    expect(addTag([], 'vinyl only')).toEqual(['vinyl only']);
    const full = Array.from({ length: TAG_LIMIT }, (_, i) => `t${i}`);
    expect(addTag(full, 'House')).toBe(full);
    expect(canAddTyped('House', full)).toBe(false);
    expect(removeTag(['House', 'Jazz'], 'house')).toEqual(['Jazz']);
  });
});
