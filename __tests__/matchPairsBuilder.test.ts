import { buildMatchPairs } from '../src/utils/matchPairsBuilder';
import { getWordsByCategory } from '../src/data/vocab';

describe('buildMatchPairs', () => {
  const words = getWordsByCategory('greetings'); // 15 words

  it('returns count tiles per column when enough words available', () => {
    const { leftTiles, rightTiles } = buildMatchPairs(words, 8);
    expect(leftTiles).toHaveLength(8);
    expect(rightTiles).toHaveLength(8);
  });

  it('covers the same set of word ids on both columns, each exactly once', () => {
    const { leftTiles, rightTiles } = buildMatchPairs(words, 8);
    const leftIds = leftTiles.map(t => t.wordId).sort((a, b) => a - b);
    const rightIds = rightTiles.map(t => t.wordId).sort((a, b) => a - b);
    expect(leftIds).toEqual(rightIds);
    expect(new Set(leftIds).size).toBe(8);
  });

  it('left tiles show english text, right tiles show nepali text', () => {
    const { leftTiles, rightTiles } = buildMatchPairs(words, 5);
    const byId = new Map(words.map(w => [w.id, w]));
    for (const tile of leftTiles) {
      expect(tile.text).toBe(byId.get(tile.wordId)!.english);
    }
    for (const tile of rightTiles) {
      expect(tile.text).toBe(byId.get(tile.wordId)!.nepali);
    }
  });

  it('caps count to available words when count exceeds pool size', () => {
    const { leftTiles, rightTiles } = buildMatchPairs(words, 999);
    expect(leftTiles).toHaveLength(words.length);
    expect(rightTiles).toHaveLength(words.length);
  });

  it('handles a pool smaller than requested count without crashing', () => {
    const smallPool = words.slice(0, 3);
    const { leftTiles, rightTiles } = buildMatchPairs(smallPool, 8);
    expect(leftTiles).toHaveLength(3);
    expect(rightTiles).toHaveLength(3);
  });
});
