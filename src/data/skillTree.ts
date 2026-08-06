import { Category, LearningGoal, LearningLevel, Word, getWordsByCategory } from './vocab';
import { getPrioritizedCategories } from './personalization';

export const LESSON_SIZE = 5;
export const UNIT_UNLOCK_THRESHOLD = 0.7;
export const LESSON_UNLOCK_THRESHOLD = 0.6;

export type NodeStatus = 'locked' | 'unlocked' | 'completed';

/**
 * Exercise variety per lesson. First lesson of every category is always
 * 'mcq' (works with zero setup, no mic/speech dependency); remaining lessons
 * cycle through the mini-games so a unit isn't 100% one exercise type.
 */
export type ExerciseType = 'mcq' | 'listen_type' | 'match_pairs' | 'speak_check';

const EXERCISE_CYCLE: ExerciseType[] = ['mcq', 'listen_type', 'match_pairs', 'speak_check'];

export function getExerciseType(lessonIndex: number): ExerciseType {
  return EXERCISE_CYCLE[lessonIndex % EXERCISE_CYCLE.length];
}

export type SkillLesson = {
  category: Category;
  lessonIndex: number;
  wordIds: number[];
  exerciseType: ExerciseType;
};

export type SkillUnit = {
  category: Category;
  lessons: SkillLesson[];
};

/** Deterministic chunks of a category's words, sorted by id ascending. Append-safe. */
export function getLessonsForCategory(category: Category): SkillLesson[] {
  const words = [...getWordsByCategory(category)].sort((a, b) => a.id - b.id);
  const lessons: SkillLesson[] = [];
  for (let i = 0; i < words.length; i += LESSON_SIZE) {
    lessons.push({
      category,
      lessonIndex: lessons.length,
      wordIds: words.slice(i, i + LESSON_SIZE).map(w => w.id),
      exerciseType: getExerciseType(lessons.length),
    });
  }
  return lessons;
}

export function getLessonWords(category: Category, lessonIndex: number): Word[] {
  const lesson = getLessonsForCategory(category)[lessonIndex];
  if (!lesson) return [];
  const words = getWordsByCategory(category);
  const byId = new Map(words.map(w => [w.id, w]));
  return lesson.wordIds.map(id => byId.get(id)!).filter(Boolean);
}

export function buildSkillUnits(goal: LearningGoal | null, level: LearningLevel | null): SkillUnit[] {
  return getPrioritizedCategories(goal, level).map(category => ({
    category,
    lessons: getLessonsForCategory(category),
  }));
}

function learnedRatio(wordIds: number[], learnedIds: number[]): number {
  if (wordIds.length === 0) return 0;
  const learnedSet = new Set(learnedIds);
  const learned = wordIds.filter(id => learnedSet.has(id)).length;
  return learned / wordIds.length;
}

export function getUnitStatus(units: SkillUnit[], unitIndex: number, learnedIds: number[]): NodeStatus {
  const unit = units[unitIndex];
  if (!unit) return 'locked';
  const allWordIds = unit.lessons.flatMap(l => l.wordIds);
  const ratio = learnedRatio(allWordIds, learnedIds);
  if (unitIndex === 0) {
    return ratio >= 1 ? 'completed' : 'unlocked';
  }
  const prevUnit = units[unitIndex - 1];
  const prevRatio = learnedRatio(prevUnit.lessons.flatMap(l => l.wordIds), learnedIds);
  if (prevRatio < UNIT_UNLOCK_THRESHOLD) return 'locked';
  return ratio >= 1 ? 'completed' : 'unlocked';
}

export function getLessonStatus(
  unit: SkillUnit,
  lessonIndex: number,
  learnedIds: number[],
  unitStatus: NodeStatus
): NodeStatus {
  if (unitStatus === 'locked') return 'locked';
  const lesson = unit.lessons[lessonIndex];
  if (!lesson) return 'locked';
  const ratio = learnedRatio(lesson.wordIds, learnedIds);
  if (lessonIndex === 0) {
    return ratio >= 1 ? 'completed' : 'unlocked';
  }
  const prevLesson = unit.lessons[lessonIndex - 1];
  const prevRatio = learnedRatio(prevLesson.wordIds, learnedIds);
  if (prevRatio < LESSON_UNLOCK_THRESHOLD) return 'locked';
  return ratio >= 1 ? 'completed' : 'unlocked';
}

export type LessonRoute = {
  pathname: '/lesson' | '/listen-type' | '/match-pairs' | '/speak-check';
  params: Record<string, string>;
};

/** Resolves which screen + params a lesson node should navigate to, based on its exerciseType. */
export function getRouteForLesson(lesson: SkillLesson): LessonRoute {
  switch (lesson.exerciseType) {
    case 'listen_type':
      return { pathname: '/listen-type', params: {} };
    case 'match_pairs':
      return { pathname: '/match-pairs', params: { category: lesson.category } };
    case 'speak_check':
      return { pathname: '/speak-check', params: { category: lesson.category } };
    case 'mcq':
    default:
      return {
        pathname: '/lesson',
        params: { category: lesson.category, lessonIndex: String(lesson.lessonIndex) },
      };
  }
}
