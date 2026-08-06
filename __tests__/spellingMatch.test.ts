import { normalizeSpelling, levenshteinDistance, isSpellingMatch } from '../src/utils/spellingMatch';

describe('normalizeSpelling', () => {
  it('lowercases and trims', () => {
    expect(normalizeSpelling('  Namaste  ')).toBe('namaste');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeSpelling('Dhan  yabad')).toBe('dhan yabad');
  });
});

describe('levenshteinDistance', () => {
  it('is 0 for identical strings', () => {
    expect(levenshteinDistance('namaste', 'namaste')).toBe(0);
  });

  it('is the length of the other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('counts a single substitution as distance 1', () => {
    expect(levenshteinDistance('namaste', 'namaxte')).toBe(1);
  });

  it('counts a single insertion/deletion as distance 1', () => {
    expect(levenshteinDistance('namast', 'namaste')).toBe(1);
  });
});

describe('isSpellingMatch', () => {
  it('matches identical strings', () => {
    expect(isSpellingMatch('Namaste', 'Namaste')).toBe(true);
  });

  it('is case-insensitive and whitespace-tolerant', () => {
    expect(isSpellingMatch('  NAMASTE ', 'namaste')).toBe(true);
  });

  it('rejects empty input', () => {
    expect(isSpellingMatch('', 'namaste')).toBe(false);
  });

  it('tolerates a single small typo on a longer word', () => {
    expect(isSpellingMatch('Dhanyabod', 'Dhanyabad')).toBe(true);
  });

  it('rejects a completely different word', () => {
    expect(isSpellingMatch('hello', 'namaste')).toBe(false);
  });

  it('rejects too many typos relative to word length', () => {
    expect(isSpellingMatch('xyz', 'abc')).toBe(false);
  });
});
