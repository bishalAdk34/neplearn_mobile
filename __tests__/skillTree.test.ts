import {
  getLessonsForCategory,
  getLessonWords,
  buildSkillUnits,
  getUnitStatus,
  getLessonStatus,
  getExerciseType,
  getRouteForLesson,
  LESSON_SIZE,
  UNIT_UNLOCK_THRESHOLD,
  LESSON_UNLOCK_THRESHOLD,
} from '../src/data/skillTree';
import { categories, getWordsByCategory } from '../src/data/vocab';

describe('getLessonsForCategory', () => {
  it('covers every word in a category exactly once, in id order', () => {
    for (const category of categories) {
      const words = getWordsByCategory(category);
      const lessons = getLessonsForCategory(category);
      const allIds = lessons.flatMap(l => l.wordIds);
      expect(allIds).toEqual([...words].sort((a, b) => a.id - b.id).map(w => w.id));
      expect(new Set(allIds).size).toBe(words.length);
    }
  });

  it('chunks into groups of LESSON_SIZE, last chunk may be smaller', () => {
    for (const category of categories) {
      const lessons = getLessonsForCategory(category);
      lessons.forEach((lesson, i) => {
        expect(lesson.lessonIndex).toBe(i);
        if (i < lessons.length - 1) {
          expect(lesson.wordIds.length).toBe(LESSON_SIZE);
        } else {
          expect(lesson.wordIds.length).toBeGreaterThan(0);
          expect(lesson.wordIds.length).toBeLessThanOrEqual(LESSON_SIZE);
        }
      });
    }
  });

  it('handles a category with fewer than LESSON_SIZE words (single partial lesson)', () => {
    const smallCategory = categories.find(c => getWordsByCategory(c).length < LESSON_SIZE);
    if (!smallCategory) return; // no such category in current dataset; skip
    const lessons = getLessonsForCategory(smallCategory);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].wordIds.length).toBe(getWordsByCategory(smallCategory).length);
  });
});

describe('getLessonWords', () => {
  it('returns Word objects matching the lesson word ids', () => {
    const category = categories[0];
    const lessons = getLessonsForCategory(category);
    const words = getLessonWords(category, 0);
    expect(words.map(w => w.id)).toEqual(lessons[0].wordIds);
  });

  it('returns empty array for out-of-range lessonIndex', () => {
    expect(getLessonWords(categories[0], 999)).toEqual([]);
  });
});

describe('buildSkillUnits', () => {
  it('returns one unit per category, goal=null fallback uses default order', () => {
    const units = buildSkillUnits(null, null);
    expect(units).toHaveLength(categories.length);
    expect(units.map(u => u.category)).toEqual([...categories]);
  });

  it('returns one unit per category for a goal too', () => {
    const units = buildSkillUnits('travel', 'beginner');
    expect(units).toHaveLength(categories.length);
    expect(new Set(units.map(u => u.category)).size).toBe(categories.length);
  });
});

describe('getUnitStatus', () => {
  const units = buildSkillUnits(null, null);

  it('first unit is unlocked when nothing learned', () => {
    expect(getUnitStatus(units, 0, [])).toBe('unlocked');
  });

  it('first unit is completed when all its words are learned', () => {
    const allIds = units[0].lessons.flatMap(l => l.wordIds);
    expect(getUnitStatus(units, 0, allIds)).toBe('completed');
  });

  it('second unit is locked when prior unit below threshold', () => {
    const unit0Ids = units[0].lessons.flatMap(l => l.wordIds);
    const belowThreshold = unit0Ids.slice(0, Math.floor(unit0Ids.length * UNIT_UNLOCK_THRESHOLD) - 1);
    expect(getUnitStatus(units, 1, belowThreshold)).toBe('locked');
  });

  it('second unit unlocks at exactly the threshold ratio', () => {
    const unit0Ids = units[0].lessons.flatMap(l => l.wordIds);
    const atThreshold = unit0Ids.slice(0, Math.ceil(unit0Ids.length * UNIT_UNLOCK_THRESHOLD));
    expect(getUnitStatus(units, 1, atThreshold)).toBe('unlocked');
  });

  it('unknown unit index returns locked', () => {
    expect(getUnitStatus(units, units.length + 5, [])).toBe('locked');
  });
});

describe('getLessonStatus', () => {
  const units = buildSkillUnits(null, null);
  const unit = units[0];

  it('locked when unit status is locked, regardless of learned words', () => {
    expect(getLessonStatus(unit, 0, unit.lessons[0].wordIds, 'locked')).toBe('locked');
  });

  it('first lesson unlocked when unit unlocked and nothing learned', () => {
    expect(getLessonStatus(unit, 0, [], 'unlocked')).toBe('unlocked');
  });

  it('first lesson completed when all its words learned', () => {
    expect(getLessonStatus(unit, 0, unit.lessons[0].wordIds, 'unlocked')).toBe('completed');
  });

  it('second lesson locked when prior lesson below threshold', () => {
    if (unit.lessons.length < 2) return;
    const prevIds = unit.lessons[0].wordIds;
    const belowThreshold = prevIds.slice(0, Math.floor(prevIds.length * LESSON_UNLOCK_THRESHOLD) - 1);
    expect(getLessonStatus(unit, 1, belowThreshold, 'unlocked')).toBe('locked');
  });

  it('second lesson unlocks at threshold ratio of prior lesson', () => {
    if (unit.lessons.length < 2) return;
    const prevIds = unit.lessons[0].wordIds;
    const atThreshold = prevIds.slice(0, Math.ceil(prevIds.length * LESSON_UNLOCK_THRESHOLD));
    expect(getLessonStatus(unit, 1, atThreshold, 'unlocked')).toBe('unlocked');
  });

  it('out-of-range lessonIndex returns locked', () => {
    expect(getLessonStatus(unit, 999, [], 'unlocked')).toBe('locked');
  });
});

describe('getExerciseType', () => {
  it('first lesson of every category is always mcq', () => {
    expect(getExerciseType(0)).toBe('mcq');
  });

  it('cycles deterministically through the 4 exercise types', () => {
    expect(getExerciseType(1)).toBe('listen_type');
    expect(getExerciseType(2)).toBe('match_pairs');
    expect(getExerciseType(3)).toBe('speak_check');
    expect(getExerciseType(4)).toBe('mcq');
  });

  it('lessons built via getLessonsForCategory carry the matching exerciseType', () => {
    const lessons = getLessonsForCategory(categories[0]);
    lessons.forEach((lesson, i) => {
      expect(lesson.exerciseType).toBe(getExerciseType(i));
    });
  });
});

describe('getRouteForLesson', () => {
  const category = categories[0];

  it('routes mcq lessons to /lesson with category + lessonIndex params', () => {
    const lesson = { category, lessonIndex: 0, wordIds: [1], exerciseType: 'mcq' as const };
    expect(getRouteForLesson(lesson)).toEqual({
      pathname: '/lesson',
      params: { category, lessonIndex: '0' },
    });
  });

  it('routes listen_type lessons to /listen-type', () => {
    const lesson = { category, lessonIndex: 1, wordIds: [1], exerciseType: 'listen_type' as const };
    expect(getRouteForLesson(lesson).pathname).toBe('/listen-type');
  });

  it('routes match_pairs lessons to /match-pairs with category param', () => {
    const lesson = { category, lessonIndex: 2, wordIds: [1], exerciseType: 'match_pairs' as const };
    expect(getRouteForLesson(lesson)).toEqual({
      pathname: '/match-pairs',
      params: { category },
    });
  });

  it('routes speak_check lessons to /speak-check with category param', () => {
    const lesson = { category, lessonIndex: 3, wordIds: [1], exerciseType: 'speak_check' as const };
    expect(getRouteForLesson(lesson)).toEqual({
      pathname: '/speak-check',
      params: { category },
    });
  });
});
