import { Word, shuffle } from '../data/vocab';

export interface MatchTile {
  wordId: number;
  text: string;
}

export interface MatchPairsSet {
  leftTiles: MatchTile[];
  rightTiles: MatchTile[];
}

/**
 * Builds two independently-shuffled columns of tiles (left = English, right = Nepali)
 * for a tap-to-match session. Both columns cover the same `count` words (capped to
 * however many are available), each word appearing exactly once per column.
 */
export function buildMatchPairs(words: Word[], count: number): MatchPairsSet {
  const picked = shuffle(words).slice(0, Math.min(count, words.length));
  const leftTiles = shuffle(picked.map(w => ({ wordId: w.id, text: w.english })));
  const rightTiles = shuffle(picked.map(w => ({ wordId: w.id, text: w.nepali })));
  return { leftTiles, rightTiles };
}
