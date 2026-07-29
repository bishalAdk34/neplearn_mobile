import type { Word } from '../data/vocab';
import type { LearningDirection } from '../stores/settings';

export type Lang = 'en' | 'ne';

/** Language the learner is trying to acquire. */
export function targetLang(direction: LearningDirection): Lang {
  return direction === 'en-to-ne' ? 'ne' : 'en';
}

/** Language the learner already knows (used for prompts). */
export function knownLang(direction: LearningDirection): Lang {
  return targetLang(direction) === 'ne' ? 'en' : 'ne';
}

export function targetLangName(direction: LearningDirection): string {
  return targetLang(direction) === 'ne' ? 'Nepali' : 'English';
}

export function textFor(word: Word, lang: Lang): string {
  return lang === 'ne' ? word.nepali : word.english;
}

export function ttsLangCode(lang: Lang): 'ne-NP' | 'en-US' {
  return lang === 'ne' ? 'ne-NP' : 'en-US';
}

export type DirectionFields = {
  promptText: string;
  promptRoman?: string;
  answerText: string;
  ttsText: string;
  ttsLang: 'ne-NP' | 'en-US';
  promptLabel: string;
};

/**
 * For production/recall screens (lesson, quiz, flashcards, morning-vocab, review):
 * prompt = known lang, answer = target lang. TTS always speaks the target (learned) lang.
 */
export function getDirectionFields(word: Word, direction: LearningDirection): DirectionFields {
  const target = targetLang(direction);
  const known = knownLang(direction);
  const promptText = textFor(word, known);
  const answerText = textFor(word, target);
  return {
    promptText,
    promptRoman: known === 'ne' ? word.roman : undefined,
    answerText,
    ttsText: answerText,
    ttsLang: ttsLangCode(target),
    promptLabel: target === 'ne' ? 'What is this in Nepali?' : 'What does this mean in English?',
  };
}

/** Answer-option label for production/recall screens (target lang text). */
export function getOptionLabel(word: Word, direction: LearningDirection): string {
  return textFor(word, targetLang(direction));
}

export type ListeningFields = {
  audioText: string;
  audioLang: 'ne-NP' | 'en-US';
  answerText: string;
};

/**
 * Listening screen is inverted vs production screens:
 * audio prompt = target lang, answer choices = known lang.
 */
export function getListeningFields(word: Word, direction: LearningDirection): ListeningFields {
  const target = targetLang(direction);
  const known = knownLang(direction);
  return {
    audioText: textFor(word, target),
    audioLang: ttsLangCode(target),
    answerText: textFor(word, known),
  };
}

/** Answer-option label for listening screen (known lang text). */
export function getListeningOptionLabel(word: Word, direction: LearningDirection): string {
  return textFor(word, knownLang(direction));
}

export type EchoFields = {
  text: string;
  lang: 'ne-NP' | 'en-US';
};

/**
 * Echo-practice always drills Nepali pronunciation regardless of global direction
 * (en-US STT support unverified — see plan risk item). Kept as fixed 'ne' for now.
 */
export function getEchoFields(word: Word, _direction: LearningDirection): EchoFields {
  return { text: word.nepali, lang: 'ne-NP' };
}

export const DIRECTION_OPTIONS: { value: LearningDirection; label: string; description: string }[] = [
  { value: 'en-to-ne', label: 'English → Nepali', description: 'See English, answer in Nepali' },
  { value: 'ne-to-en', label: 'Nepali → English', description: 'See Nepali, answer in English' },
];
