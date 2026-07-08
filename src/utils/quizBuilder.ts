import { vocab, shuffle, type Word } from '../data/vocab';

export interface QuizQuestion extends Word {
  /** Nepali answer options (1 correct + 3 distractors), shuffled. */
  options: string[];
}

/** Build multiple-choice questions: shown English, pick Nepali. */
export function buildQuestions(words: Word[], count = words.length): QuizQuestion[] {
  return shuffle(words)
    .slice(0, count)
    .map((word) => {
      const allNepali = vocab.map((w) => w.nepali).filter((n) => n !== word.nepali);
      const wrong = shuffle(allNepali).slice(0, 3);
      return { ...word, options: shuffle([word.nepali, ...wrong]) };
    });
}

export interface EnglishQuizQuestion extends Word {
  /** English answer options (1 correct + 3 distractors), shuffled. */
  options: string[];
}

/** Build questions where the learner picks the English meaning (used by listening). */
export function buildEnglishOptionQuestions(words: Word[], count = words.length): EnglishQuizQuestion[] {
  return shuffle(words)
    .slice(0, count)
    .map((word) => {
      const allEnglish = vocab.map((w) => w.english).filter((e) => e !== word.english);
      const wrong = shuffle([...new Set(allEnglish)]).slice(0, 3);
      return { ...word, options: shuffle([word.english, ...wrong]) };
    });
}
