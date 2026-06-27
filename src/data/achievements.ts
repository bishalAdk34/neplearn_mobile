import { categories, getWordsByCategory, useVocabStore } from './vocab';
import { getTotalXp, getStreak } from '../services/db';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  bgColor: string;
};

export const achievements: Achievement[] = [
  { id: 'first_word', title: 'First Steps', description: 'Learn your first Nepali word', icon: '🎒', bgColor: '#FEF3C7' },
  { id: 'ten_words', title: 'Vocabulary Novice', description: 'Learn 10 Nepali words', icon: '📚', bgColor: '#D1FAE5' },
  { id: 'twenty_five_words', title: 'Word Collector', description: 'Learn 25 Nepali words', icon: '🗂️', bgColor: '#DBEAFE' },
  { id: 'all_words', title: 'Vocabulary Master', description: 'Learn all 54 Nepali words', icon: '👑', bgColor: '#FDE68A' },
  { id: 'first_category', title: 'Category Champion', description: 'Master all words in a category', icon: '🏆', bgColor: '#E0E7FF' },
  { id: 'three_categories', title: 'Polyglot', description: 'Master 3 categories', icon: '🌍', bgColor: '#CFFAFE' },
  { id: 'all_categories', title: 'Grand Master', description: 'Master all 10 categories', icon: '✨', bgColor: '#F3E8FF' },
  { id: 'streak_3', title: 'Committed', description: 'Maintain a 3-day streak', icon: '🔥', bgColor: '#FEE2E2' },
  { id: 'streak_7', title: 'Dedicated', description: 'Maintain a 7-day streak', icon: '💪', bgColor: '#FED7AA' },
  { id: 'streak_30', title: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '⚡', bgColor: '#FEF9C3' },
  { id: 'xp_100', title: 'Getting Started', description: 'Earn 100 XP', icon: '⭐', bgColor: '#ECFDF5' },
  { id: 'xp_500', title: 'XP Hunter', description: 'Earn 500 XP', icon: '🌟', bgColor: '#F0FDF4' },
  { id: 'xp_1000', title: 'XP Champion', description: 'Earn 1,000 XP', icon: '💫', bgColor: '#FFF7ED' },
  { id: 'xp_5000', title: 'XP Legend', description: 'Earn 5,000 XP', icon: '🏅', bgColor: '#FFFBEB' },
];

export type AchievementStatus = {
  achievement: Achievement;
  unlocked: boolean;
};

export async function getAchievementStatuses(userId: string): Promise<AchievementStatus[]> {
  const { isLearned } = useVocabStore.getState();
  const learnedIds = useVocabStore.getState().learnedByUser[userId] || [];
  const totalLearned = learnedIds.length;

  const streakData = await getStreak(userId);
  const totalXp = await getTotalXp(userId);

  const categoryStatuses = categories.map(cat => {
    const words = getWordsByCategory(cat);
    return words.every(w => isLearned(userId, w.id));
  });
  const completedCategories = categoryStatuses.filter(Boolean).length;

  return achievements.map(ach => {
    let unlocked = false;

    switch (ach.id) {
      case 'first_word':
        unlocked = totalLearned >= 1;
        break;
      case 'ten_words':
        unlocked = totalLearned >= 10;
        break;
      case 'twenty_five_words':
        unlocked = totalLearned >= 25;
        break;
      case 'all_words':
        unlocked = totalLearned >= 54;
        break;
      case 'first_category':
        unlocked = completedCategories >= 1;
        break;
      case 'three_categories':
        unlocked = completedCategories >= 3;
        break;
      case 'all_categories':
        unlocked = completedCategories >= 10;
        break;
      case 'streak_3':
        unlocked = streakData.longest_streak >= 3;
        break;
      case 'streak_7':
        unlocked = streakData.longest_streak >= 7;
        break;
      case 'streak_30':
        unlocked = streakData.longest_streak >= 30;
        break;
      case 'xp_100':
        unlocked = totalXp >= 100;
        break;
      case 'xp_500':
        unlocked = totalXp >= 500;
        break;
      case 'xp_1000':
        unlocked = totalXp >= 1000;
        break;
      case 'xp_5000':
        unlocked = totalXp >= 5000;
        break;
    }

    return { achievement: ach, unlocked };
  });
}
