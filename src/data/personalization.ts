import {
  categories,
  Category,
  LearningGoal,
  LearningLevel,
  Word,
  vocab,
  getWordsByCategory,
  shuffle,
} from './vocab';

export const GOAL_CATEGORY_PRIORITY: Record<LearningGoal, Category[]> = {
  travel: ['greetings', 'directions', 'transport', 'food', 'numbers', 'shopping', 'places', 'questions', 'weather', 'time', 'health', 'days', 'months', 'emotions', 'verbs', 'adjectives', 'clothing', 'colors', 'body', 'family', 'animals'],
  family: ['family', 'greetings', 'emotions', 'food', 'health', 'body', 'verbs', 'questions', 'time', 'days', 'clothing', 'months', 'adjectives', 'weather', 'numbers', 'shopping', 'colors', 'places', 'transport', 'directions', 'animals'],
  business: ['greetings', 'numbers', 'days', 'months', 'time', 'questions', 'transport', 'shopping', 'verbs', 'places', 'directions', 'adjectives', 'health', 'emotions', 'weather', 'food', 'clothing', 'colors', 'family', 'body', 'animals'],
  culture: ['greetings', 'places', 'food', 'family', 'clothing', 'animals', 'days', 'months', 'weather', 'adjectives', 'emotions', 'verbs', 'questions', 'shopping', 'colors', 'time', 'transport', 'numbers', 'health', 'directions', 'body'],
};

export const CATEGORY_DIFFICULTY: Record<Category, LearningLevel> = {
  greetings: 'beginner',
  numbers: 'beginner',
  colors: 'beginner',
  family: 'beginner',
  food: 'beginner',
  animals: 'beginner',
  body: 'beginner',
  days: 'beginner',
  months: 'intermediate',
  directions: 'intermediate',
  time: 'intermediate',
  places: 'intermediate',
  adjectives: 'intermediate',
  verbs: 'advanced',
  questions: 'advanced',
  weather: 'intermediate',
  transport: 'beginner',
  shopping: 'beginner',
  health: 'intermediate',
  emotions: 'beginner',
  clothing: 'beginner',
};

const GOAL_PHRASES: Record<LearningGoal, string> = {
  travel: 'traveling in Nepal (getting around, ordering food, asking for directions, bargaining)',
  culture: 'understanding Nepali culture, places, and traditions',
  business: 'professional and business communication in Nepal',
  family: 'connecting with Nepali family members and relatives',
};

if (__DEV__) {
  for (const [goal, list] of Object.entries(GOAL_CATEGORY_PRIORITY)) {
    if (list.length !== categories.length || new Set(list).size !== categories.length) {
      throw new Error(`GOAL_CATEGORY_PRIORITY.${goal} must contain all ${categories.length} categories exactly once`);
    }
  }
}

export function getPrioritizedCategories(goal: LearningGoal | null, level: LearningLevel | null): Category[] {
  if (!goal) return [...categories];
  const ordered = GOAL_CATEGORY_PRIORITY[goal];
  if (level === 'beginner') {
    return [
      ...ordered.filter(c => CATEGORY_DIFFICULTY[c] !== 'advanced'),
      ...ordered.filter(c => CATEGORY_DIFFICULTY[c] === 'advanced'),
    ];
  }
  if (level === 'advanced') {
    return [
      ...ordered.filter(c => CATEGORY_DIFFICULTY[c] !== 'beginner'),
      ...ordered.filter(c => CATEGORY_DIFFICULTY[c] === 'beginner'),
    ];
  }
  return [...ordered];
}

export function getRecommendedWords(goal: LearningGoal | null, level: LearningLevel | null, count: number): Word[] {
  if (!goal) return shuffle(vocab).slice(0, count);
  const prioritized = getPrioritizedCategories(goal, level);
  const topCategories = prioritized.slice(0, 5);
  const topWords = shuffle(vocab.filter(w => topCategories.includes(w.category as Category)));
  const restWords = shuffle(vocab.filter(w => !topCategories.includes(w.category as Category)));
  const topCount = Math.ceil(count * 0.8);
  const picked = [...topWords.slice(0, topCount), ...restWords.slice(0, count - topCount)];
  // Backfill if either pool ran short
  if (picked.length < count) {
    const pickedIds = new Set(picked.map(w => w.id));
    picked.push(...[...topWords, ...restWords].filter(w => !pickedIds.has(w.id)).slice(0, count - picked.length));
  }
  return shuffle(picked);
}

export function getContinueCategory(
  goal: LearningGoal | null,
  level: LearningLevel | null,
  isLearnedFn: (wordId: number) => boolean
): { cat: Category; learned: number; total: number } | null {
  for (const cat of getPrioritizedCategories(goal, level)) {
    const words = getWordsByCategory(cat);
    const learned = words.filter(w => isLearnedFn(w.id)).length;
    if (learned < words.length) {
      return { cat, learned, total: words.length };
    }
  }
  return null;
}

export function buildLearnerProfileContext(goal: LearningGoal | null, level: LearningLevel | null): string | undefined {
  if (!goal && !level) return undefined;
  const parts: string[] = [];
  if (goal) {
    parts.push(`The user's main goal is ${GOAL_PHRASES[goal]}. Prefer examples and vocabulary relevant to this goal.`);
  }
  if (level === 'beginner') {
    parts.push('The user is a beginner: keep explanations very simple, always include romanization, and teach one concept at a time.');
  } else if (level === 'intermediate') {
    parts.push('The user is intermediate: use short Nepali sentences and include gentle grammar notes.');
  } else if (level === 'advanced') {
    parts.push('The user is advanced: use longer Nepali sentences and engage with conversational depth.');
  }
  return parts.join(' ');
}
