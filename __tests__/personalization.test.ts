import {
  getPrioritizedCategories,
  getContinueCategory,
  getRecommendedWords,
  buildLearnerProfileContext,
  CATEGORY_DIFFICULTY,
  GOAL_CATEGORY_PRIORITY,
} from '../src/data/personalization';
import { categories, getWordsByCategory } from '../src/data/vocab';

describe('getPrioritizedCategories', () => {
  it('returns all categories when no goal is set', () => {
    const result = getPrioritizedCategories(null, null);
    expect(result).toEqual([...categories]);
  });

  it('returns every category exactly once for each goal/level combo', () => {
    const goals = Object.keys(GOAL_CATEGORY_PRIORITY) as (keyof typeof GOAL_CATEGORY_PRIORITY)[];
    const levels = [null, 'beginner', 'intermediate', 'advanced'] as const;
    for (const goal of goals) {
      for (const level of levels) {
        const result = getPrioritizedCategories(goal, level);
        expect(result).toHaveLength(categories.length);
        expect(new Set(result).size).toBe(categories.length);
      }
    }
  });

  it('pushes advanced categories to the end for beginners', () => {
    const result = getPrioritizedCategories('travel', 'beginner');
    const advancedCount = result.filter(c => CATEGORY_DIFFICULTY[c] === 'advanced').length;
    const tail = result.slice(result.length - advancedCount);
    expect(tail.every(c => CATEGORY_DIFFICULTY[c] === 'advanced')).toBe(true);
  });

  it('pushes beginner categories to the end for advanced learners', () => {
    const result = getPrioritizedCategories('business', 'advanced');
    const beginnerCount = result.filter(c => CATEGORY_DIFFICULTY[c] === 'beginner').length;
    const tail = result.slice(result.length - beginnerCount);
    expect(tail.every(c => CATEGORY_DIFFICULTY[c] === 'beginner')).toBe(true);
  });
});

describe('getContinueCategory', () => {
  it('returns the first prioritized category when nothing is learned', () => {
    const result = getContinueCategory('travel', null, () => false);
    expect(result).not.toBeNull();
    expect(result!.cat).toBe(GOAL_CATEGORY_PRIORITY.travel[0]);
    expect(result!.learned).toBe(0);
    expect(result!.total).toBe(getWordsByCategory(result!.cat).length);
  });

  it('skips fully learned categories', () => {
    const first = GOAL_CATEGORY_PRIORITY.travel[0];
    const firstIds = new Set(getWordsByCategory(first).map(w => w.id));
    const result = getContinueCategory('travel', null, id => firstIds.has(id));
    expect(result).not.toBeNull();
    expect(result!.cat).toBe(GOAL_CATEGORY_PRIORITY.travel[1]);
  });

  it('returns null when everything is learned', () => {
    expect(getContinueCategory('travel', null, () => true)).toBeNull();
  });
});

describe('getRecommendedWords', () => {
  it('returns requested count without a goal', () => {
    expect(getRecommendedWords(null, null, 5)).toHaveLength(5);
  });

  it('returns requested count with a goal and no duplicates', () => {
    const words = getRecommendedWords('travel', 'beginner', 10);
    expect(words).toHaveLength(10);
    expect(new Set(words.map(w => w.id)).size).toBe(10);
  });
});

describe('buildLearnerProfileContext', () => {
  it('returns undefined with no goal and no level', () => {
    expect(buildLearnerProfileContext(null, null)).toBeUndefined();
  });

  it('mentions goal and level guidance when set', () => {
    const ctx = buildLearnerProfileContext('travel', 'beginner');
    expect(ctx).toContain('traveling in Nepal');
    expect(ctx).toContain('beginner');
  });
});
