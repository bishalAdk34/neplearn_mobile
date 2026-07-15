import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';
import { syncLearnWord, syncUnlearnWord, fetchLearnedWords } from '../services/db';
import { useSrsStore } from '../stores/srs';

const asyncStorage: PersistStorage<VocabState> = {
  getItem: async (name) => {
    const val = await AsyncStorage.getItem(name);
    return val ? JSON.parse(val) : null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export type Word = {
  id: number;
  english: string;
  nepali: string;
  roman: string;
  category: string;
  image?: string;
};

export type LearningGoal = 'travel' | 'culture' | 'business' | 'family';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

type VocabState = {
  learnedByUser: Record<string, number[]>;
  localXp: Record<string, number>;
  localStreak: Record<string, { current: number; longest: number; lastDate: string; freezeWeek?: string }>;
  learningGoal: LearningGoal | null;
  learningLevel: LearningLevel | null;
  onboardingDone: boolean;
  setLearningGoal: (goal: LearningGoal) => void;
  setLearningLevel: (level: LearningLevel) => void;
  completeOnboarding: () => void;
  learnWord: (userId: string, id: number) => void;
  unlearnWord: (userId: string, id: number) => void;
  isLearned: (userId: string, id: number) => boolean;
  toggleLearned: (userId: string, id: number) => void;
  getLearned: (userId: string) => number[];
  syncFromCloud: (userId: string) => Promise<void>;
  addLocalXp: (userId: string, amount: number) => void;
  getLocalXp: (userId: string) => number;
  addLocalStreak: (userId: string) => void;
  getLocalStreak: (userId: string) => { current: number; longest: number };
  getFreezeAvailable: (userId: string) => boolean;
};

/** ISO week string like '2026-W28' — one streak freeze allowed per week. */
export function isoWeekOf(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      learnedByUser: {},
      localXp: {},
      localStreak: {},
      learningGoal: null,
      learningLevel: null,
      onboardingDone: false,
      setLearningGoal: (goal) => set({ learningGoal: goal }),
      setLearningLevel: (level) => set({ learningLevel: level }),
      completeOnboarding: () => set({ onboardingDone: true }),
      learnWord: (userId, id) => {
        const userLearned = get().learnedByUser[userId] || [];
        if (userLearned.includes(id)) return;
        set({ learnedByUser: { ...get().learnedByUser, [userId]: [...userLearned, id] } });
        syncLearnWord(userId, id);
        useSrsStore.getState().seedWord(userId, id);
      },
      unlearnWord: (userId, id) => {
        const userLearned = get().learnedByUser[userId] || [];
        set({ learnedByUser: { ...get().learnedByUser, [userId]: userLearned.filter(l => l !== id) } });
        syncUnlearnWord(userId, id);
      },
      isLearned: (userId, id) => (get().learnedByUser[userId] || []).includes(id),
      toggleLearned: (userId, id) => {
        const userLearned = get().learnedByUser[userId] || [];
        if (userLearned.includes(id)) {
          set({ learnedByUser: { ...get().learnedByUser, [userId]: userLearned.filter(l => l !== id) } });
          syncUnlearnWord(userId, id);
        } else {
          set({ learnedByUser: { ...get().learnedByUser, [userId]: [...userLearned, id] } });
          syncLearnWord(userId, id);
          useSrsStore.getState().seedWord(userId, id);
        }
      },
      getLearned: (userId) => get().learnedByUser[userId] || [],
      syncFromCloud: async (userId) => {
        const cloudIds = await fetchLearnedWords(userId);
        const local = get().learnedByUser[userId] || [];
        const merged = [...new Set([...local, ...cloudIds])];
        set({ learnedByUser: { ...get().learnedByUser, [userId]: merged } });
      },
      addLocalXp: (userId, amount) => {
        const current = get().localXp[userId] || 0;
        set({ localXp: { ...get().localXp, [userId]: current + amount } });
      },
      getLocalXp: (userId) => get().localXp[userId] || 0,
      addLocalStreak: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        const existing = get().localStreak[userId];
        if (!existing) {
          set({ localStreak: { ...get().localStreak, [userId]: { current: 1, longest: 1, lastDate: today } } });
          return;
        }
        if (existing.lastDate === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const dayBefore = new Date();
        dayBefore.setDate(dayBefore.getDate() - 2);
        const dayBeforeStr = dayBefore.toISOString().split('T')[0];
        const thisWeek = isoWeekOf(new Date());

        let newCurrent: number;
        let newFreezeWeek = existing.freezeWeek;
        if (existing.lastDate === yesterdayStr) {
          newCurrent = existing.current + 1;
        } else if (existing.lastDate === dayBeforeStr && existing.freezeWeek !== thisWeek) {
          // Missed exactly one day and this week's freeze is unused: consume it.
          newCurrent = existing.current + 1;
          newFreezeWeek = thisWeek;
        } else {
          newCurrent = 1;
        }
        const newLongest = Math.max(newCurrent, existing.longest);
        set({ localStreak: { ...get().localStreak, [userId]: { current: newCurrent, longest: newLongest, lastDate: today, freezeWeek: newFreezeWeek } } });
      },
      getLocalStreak: (userId) => {
        const s = get().localStreak[userId];
        return s ? { current: s.current, longest: s.longest } : { current: 0, longest: 0 };
      },
      getFreezeAvailable: (userId) => {
        const s = get().localStreak[userId];
        return !s || s.freezeWeek !== isoWeekOf(new Date());
      },
    }),
    {
      name: 'nepali-vocab',
      storage: asyncStorage,
    }
  )
);

export const GUEST_ID = '__guest__';

export const categories = [
  'greetings', 'numbers', 'colors', 'family', 'food',
  'directions', 'days', 'time', 'adjectives', 'places',
  'verbs', 'questions', 'body', 'animals', 'months',
  'weather', 'transport', 'shopping', 'health', 'emotions', 'clothing',
] as const;

export type Category = (typeof categories)[number];

export const CATEGORY_META: Record<Category, { emoji: string; color: string }> = {
  greetings: { emoji: '👋', color: '#6366F1' },
  numbers: { emoji: '🔢', color: '#8B5CF6' },
  colors: { emoji: '🎨', color: '#EC4899' },
  family: { emoji: '👨‍👩‍👧‍👦', color: '#14B8A6' },
  food: { emoji: '🍜', color: '#F97316' },
  directions: { emoji: '🧭', color: '#06B6D4' },
  days: { emoji: '📅', color: '#F59E0B' },
  time: { emoji: '⏰', color: '#10B981' },
  adjectives: { emoji: '✨', color: '#D946EF' },
  places: { emoji: '🏔️', color: '#0EA5E9' },
  verbs: { emoji: '🏃', color: '#EF4444' },
  questions: { emoji: '❓', color: '#F59E0B' },
  body: { emoji: '🫁', color: '#14B8A6' },
  animals: { emoji: '🐾', color: '#F97316' },
  months: { emoji: '🗓️', color: '#84CC16' },
  weather: { emoji: '🌦️', color: '#38BDF8' },
  transport: { emoji: '🚌', color: '#FB7185' },
  shopping: { emoji: '🛍️', color: '#A78BFA' },
  health: { emoji: '🩺', color: '#34D399' },
  emotions: { emoji: '💛', color: '#FBBF24' },
  clothing: { emoji: '👕', color: '#F472B6' },
};

export const vocab: Word[] = [
  // Greetings (15 words)
  { id: 1, english: 'Hello', nepali: 'नमस्ते', roman: 'Namaste', category: 'greetings', image: 'https://boldhimalaya.com/wp-content/uploads/2026/02/budd-namesta-scaled-e1771388267815.jpg' },
  { id: 2, english: 'Goodbye', nepali: 'फेरि भेटौंला', roman: 'Pheri bhetauula', category: 'greetings', image: '👋' },
  { id: 3, english: 'Thank you', nepali: 'धन्यवाद', roman: 'Dhanyabad', category: 'greetings', image: '🙏' },
  { id: 4, english: 'Please', nepali: 'कृपया', roman: 'Kripaya', category: 'greetings', image: '🙏' },
  { id: 5, english: 'Yes', nepali: 'हो', roman: 'Ho', category: 'greetings', image: '✅' },
  { id: 6, english: 'No', nepali: 'होइन', roman: 'Hoina', category: 'greetings', image: '❌' },
  { id: 7, english: 'Sorry', nepali: 'माफ गर्नुहोस्', roman: 'Maaf garnuhos', category: 'greetings', image: '😔' },
  { id: 8, english: 'Good morning', nepali: 'शुभ प्रभात', roman: 'Shubha prabhat', category: 'greetings', image: '🌅' },
  { id: 9, english: 'How are you?', nepali: 'तपाईं कस्तो हुनुहुन्छ?', roman: 'Tapai kasto hunuhunchha?', category: 'greetings', image: '🤔' },
  { id: 10, english: 'Fine', nepali: 'ठीक छ', roman: 'Thik chha', category: 'greetings', image: '👍' },
  { id: 11, english: 'Good evening', nepali: 'शुभ सन्ध्या', roman: 'Shubha sandhya', category: 'greetings', image: '🌆' },
  { id: 12, english: 'Good night', nepali: 'शुभ रात्री', roman: 'Shubha ratri', category: 'greetings', image: '🌙' },
  { id: 13, english: 'Welcome', nepali: 'स्वागत छ', roman: 'Swagat chha', category: 'greetings', image: '🤗' },
  { id: 14, english: 'Excuse me', nepali: 'सुन्नुहोस्', roman: 'Sunnuhos', category: 'greetings', image: '🙏' },
  { id: 15, english: "How's it going?", nepali: 'के छ र?', roman: 'Ke chha ra?', category: 'greetings', image: '💬' },

  // Numbers (20 words)
  { id: 16, english: 'One', nepali: 'एक', roman: 'Ek', category: 'numbers', image: '1️⃣' },
  { id: 17, english: 'Two', nepali: 'दुई', roman: 'Dui', category: 'numbers', image: '2️⃣' },
  { id: 18, english: 'Three', nepali: 'तीन', roman: 'Tin', category: 'numbers', image: '3️⃣' },
  { id: 19, english: 'Four', nepali: 'चार', roman: 'Char', category: 'numbers', image: '4️⃣' },
  { id: 20, english: 'Five', nepali: 'पाँच', roman: 'Panch', category: 'numbers', image: '5️⃣' },
  { id: 21, english: 'Six', nepali: 'छ', roman: 'Chha', category: 'numbers', image: '6️⃣' },
  { id: 22, english: 'Seven', nepali: 'सात', roman: 'Saat', category: 'numbers', image: '7️⃣' },
  { id: 23, english: 'Eight', nepali: 'आठ', roman: 'Aath', category: 'numbers', image: '8️⃣' },
  { id: 24, english: 'Nine', nepali: 'नौ', roman: 'Nau', category: 'numbers', image: '9️⃣' },
  { id: 25, english: 'Ten', nepali: 'दस', roman: 'Das', category: 'numbers', image: '🔟' },
  // ids 26-31 removed: duplicates of 173, 174, 182, 183, 185, 190
  { id: 32, english: 'Thousand', nepali: 'एक हजार', roman: 'Ek hajaar', category: 'numbers', image: '🔢' },
  { id: 33, english: 'Zero', nepali: 'शून्य', roman: 'Shunya', category: 'numbers', image: '0️⃣' },
  { id: 34, english: 'First', nepali: 'पहिलो', roman: 'Pahilo', category: 'numbers', image: '🥇' },
  { id: 35, english: 'Second', nepali: 'दोस्रो', roman: 'Dosro', category: 'numbers', image: '🥈' },

  // Colors (10 words)
  { id: 36, english: 'Red', nepali: 'रातो', roman: 'Rato', category: 'colors', image: '🔴' },
  { id: 37, english: 'Blue', nepali: 'निलो', roman: 'Nilo', category: 'colors', image: '🔵' },
  { id: 38, english: 'Green', nepali: 'हरियो', roman: 'Hariyo', category: 'colors', image: '🟢' },
  { id: 39, english: 'Yellow', nepali: 'पहेंलो', roman: 'Pahenlo', category: 'colors', image: '🟡' },
  { id: 40, english: 'Black', nepali: 'कालो', roman: 'Kalo', category: 'colors', image: '⚫' },
  { id: 41, english: 'White', nepali: 'सेतो', roman: 'Seto', category: 'colors', image: '⚪' },
  { id: 42, english: 'Orange', nepali: 'सुन्तला', roman: 'Suntala', category: 'colors', image: '🟠' },
  { id: 43, english: 'Purple', nepali: 'बैंगनी', roman: 'Baingani', category: 'colors', image: '🟣' },
  { id: 44, english: 'Brown', nepali: 'खैरो', roman: 'Khairo', category: 'colors', image: '🟤' },
  { id: 45, english: 'Pink', nepali: 'गुलाबी', roman: 'Gulabi', category: 'colors', image: '💗' },

  // Family (12 words)
  { id: 46, english: 'Mother', nepali: 'आमा', roman: 'Aama', category: 'family', image: '👩' },
  { id: 47, english: 'Father', nepali: 'बुबा', roman: 'Buba', category: 'family', image: '👨' },
  { id: 48, english: 'Brother', nepali: 'दाजु/भाइ', roman: 'Daju/Bhai', category: 'family', image: '👦' },
  { id: 49, english: 'Sister', nepali: 'दिदी/बहिनी', roman: 'Didi/Bahini', category: 'family', image: '👧' },
  { id: 50, english: 'Child', nepali: 'बच्चा', roman: 'Bachcha', category: 'family', image: '👶' },
  { id: 51, english: 'Grandmother', nepali: 'हजुरआमा', roman: 'Hajurama', category: 'family', image: '👵' },
  { id: 52, english: 'Grandfather', nepali: 'हजुरबुबा', roman: 'Hajurbuba', category: 'family', image: '👴' },
  { id: 53, english: 'Son', nepali: 'छोरा', roman: 'Chhora', category: 'family', image: '👦' },
  { id: 54, english: 'Daughter', nepali: 'छोरी', roman: 'Chhori', category: 'family', image: '👧' },
  { id: 55, english: 'Husband', nepali: 'पति', roman: 'Pati', category: 'family', image: '👨' },
  { id: 56, english: 'Wife', nepali: 'पत्नी', roman: 'Patni', category: 'family', image: '👩' },
  { id: 57, english: 'Family', nepali: 'परिवार', roman: 'Parivar', category: 'family', image: '👨‍👩‍👧‍👦' },

  // Food (15 words)
  { id: 58, english: 'Water', nepali: 'पानी', roman: 'Pani', category: 'food', image: '💧' },
  { id: 59, english: 'Rice', nepali: 'भात', roman: 'Bhaat', category: 'food', image: '🍚' },
  { id: 60, english: 'Bread', nepali: 'रोटी', roman: 'Roti', category: 'food', image: '🍞' },
  { id: 61, english: 'Vegetable', nepali: 'तरकारी', roman: 'Tarkari', category: 'food', image: '🥦' },
  { id: 62, english: 'Fruit', nepali: 'फलफूल', roman: 'Phalphal', category: 'food', image: '🍎' },
  { id: 63, english: 'Meat', nepali: 'मासु', roman: 'Maasu', category: 'food', image: '🥩' },
  // id 64 removed: duplicate of 168 (Fish, animals)
  { id: 65, english: 'Egg', nepali: 'अण्डा', roman: 'Andaa', category: 'food', image: '🥚' },
  { id: 66, english: 'Milk', nepali: 'दूध', roman: 'Dudh', category: 'food', image: '🥛' },
  { id: 67, english: 'Tea', nepali: 'चिया', roman: 'Chiya', category: 'food', image: '🍵' },
  { id: 68, english: 'Salt', nepali: 'नुन', roman: 'Nun', category: 'food', image: '🧂' },
  { id: 69, english: 'Sugar', nepali: 'चिनी', roman: 'Chini', category: 'food', image: '🍬' },
  { id: 70, english: 'Momo', nepali: 'मोमो', roman: 'Momo', category: 'food', image: '🥟' },
  { id: 71, english: 'Dal', nepali: 'दाल', roman: 'Daal', category: 'food', image: '🍛' },
  { id: 72, english: 'Apple', nepali: 'स्याउ', roman: 'Syau', category: 'food', image: '🍎' },

  // Directions (8 words)
  { id: 73, english: 'Left', nepali: 'बायाँ', roman: 'Bayaa', category: 'directions', image: '⬅️' },
  { id: 74, english: 'Right', nepali: 'दायाँ', roman: 'Daya', category: 'directions', image: '➡️' },
  { id: 75, english: 'Straight', nepali: 'सिधा', roman: 'Sidha', category: 'directions', image: '⬆️' },
  { id: 76, english: 'Here', nepali: 'यहाँ', roman: 'Yahaa', category: 'directions', image: '📍' },
  { id: 77, english: 'There', nepali: 'त्यहाँ', roman: 'Tyahaa', category: 'directions', image: '📍' },
  { id: 78, english: 'Up', nepali: 'माथि', roman: 'Maathi', category: 'directions', image: '⬆️' },
  { id: 79, english: 'Down', nepali: 'तल', roman: 'Tal', category: 'directions', image: '⬇️' },
  { id: 80, english: 'Near', nepali: 'नजिक', roman: 'Nazik', category: 'directions', image: '📍' },

  // Days (7 words)
  { id: 81, english: 'Sunday', nepali: 'आइतबार', roman: 'Aitabar', category: 'days', image: '📅' },
  { id: 82, english: 'Monday', nepali: 'सोमबार', roman: 'Sombar', category: 'days', image: '📅' },
  { id: 83, english: 'Tuesday', nepali: 'मङ्गलबार', roman: 'Mangalbar', category: 'days', image: '📅' },
  { id: 84, english: 'Wednesday', nepali: 'बुधबार', roman: 'Budhbar', category: 'days', image: '📅' },
  { id: 85, english: 'Thursday', nepali: 'बिहीबार', roman: 'Bihibar', category: 'days', image: '📅' },
  { id: 86, english: 'Friday', nepali: 'शुक्रबार', roman: 'Shukrabar', category: 'days', image: '📅' },
  { id: 87, english: 'Saturday', nepali: 'शनिबार', roman: 'Shanibar', category: 'days', image: '📅' },

  // Time (10 words)
  { id: 88, english: 'Today', nepali: 'आज', roman: 'Aaja', category: 'time', image: '📅' },
  { id: 89, english: 'Tomorrow', nepali: 'भोलि', roman: 'Bholi', category: 'time', image: '📅' },
  { id: 90, english: 'Yesterday', nepali: 'हिजो', roman: 'Hijo', category: 'time', image: '📅' },
  { id: 91, english: 'Morning', nepali: 'बिहान', roman: 'Bihaan', category: 'time', image: '🌅' },
  { id: 92, english: 'Afternoon', nepali: 'दिउँसो', roman: 'Diuanso', category: 'time', image: '☀️' },
  { id: 93, english: 'Evening', nepali: 'साँझ', roman: 'Saanjh', category: 'time', image: '🌆' },
  { id: 94, english: 'Night', nepali: 'रात', roman: 'Raat', category: 'time', image: '🌙' },
  { id: 95, english: 'Now', nepali: 'अहिले', roman: 'Ahile', category: 'time', image: '⏰' },
  { id: 96, english: 'Later', nepali: 'पछि', roman: 'Pachi', category: 'time', image: '⏳' },
  { id: 97, english: 'Always', nepali: 'सधैं', roman: 'Sadhaĩ', category: 'time', image: '🔄' },

  // Adjectives (15 words)
  { id: 98, english: 'Big', nepali: 'ठूलो', roman: 'Thulo', category: 'adjectives', image: '📏' },
  { id: 99, english: 'Small', nepali: 'सानो', roman: 'Sano', category: 'adjectives', image: '🔍' },
  { id: 100, english: 'Happy', nepali: 'खुशी', roman: 'Khushi', category: 'adjectives', image: '😊' },
  { id: 101, english: 'Sad', nepali: 'दुःखी', roman: 'Dukhi', category: 'adjectives', image: '😢' },
  { id: 102, english: 'Good', nepali: 'राम्रो', roman: 'Ramro', category: 'adjectives', image: '👍' },
  { id: 103, english: 'Bad', nepali: 'नराम्रो', roman: 'Naramro', category: 'adjectives', image: '👎' },
  { id: 104, english: 'Beautiful', nepali: 'सुन्दर', roman: 'Sundar', category: 'adjectives', image: '🌸' },
  { id: 105, english: 'Hot', nepali: 'तातो', roman: 'Taato', category: 'adjectives', image: '🔥' },
  { id: 106, english: 'Cold', nepali: 'चिसो', roman: 'Chiso', category: 'adjectives', image: '❄️' },
  { id: 107, english: 'New', nepali: 'नयाँ', roman: 'Nayaa', category: 'adjectives', image: '🆕' },
  { id: 108, english: 'Old', nepali: 'पुरानो', roman: 'Purano', category: 'adjectives', image: '👴' },
  { id: 109, english: 'Fast', nepali: 'छिटो', roman: 'Chhito', category: 'adjectives', image: '⚡' },
  { id: 110, english: 'Slow', nepali: 'बिस्तारै', roman: 'Bistaarai', category: 'adjectives', image: '🐢' },
  { id: 111, english: 'Easy', nepali: 'सजिलो', roman: 'Sajilo', category: 'adjectives', image: '✅' },
  { id: 112, english: 'Difficult', nepali: 'गाह्रो', roman: 'Gaahro', category: 'adjectives', image: '💪' },

  // Places (10 words)
  { id: 113, english: 'House', nepali: 'घर', roman: 'Ghar', category: 'places', image: '🏠' },
  { id: 114, english: 'School', nepali: 'स्कूल', roman: 'School', category: 'places', image: '🏫' },
  { id: 115, english: 'Market', nepali: 'बजार', roman: 'Bajar', category: 'places', image: '🏪' },
  { id: 116, english: 'Mountain', nepali: 'हिमाल', roman: 'Himal', category: 'places', image: '⛰️' },
  { id: 117, english: 'River', nepali: 'नदी', roman: 'Nadi', category: 'places', image: '🏞️' },
  { id: 118, english: 'Temple', nepali: 'मन्दिर', roman: 'Mandir', category: 'places', image: '🛕' },
  { id: 119, english: 'Hospital', nepali: 'अस्पताल', roman: 'Aspataal', category: 'places', image: '🏥' },
  { id: 120, english: 'Office', nepali: 'कार्यालय', roman: 'Kaaryaalya', category: 'places', image: '🏢' },
  { id: 121, english: 'Restaurant', nepali: 'रेस्टुरेन्ट', roman: 'Resturent', category: 'places', image: '🍽️' },
  { id: 122, english: 'Village', nepali: 'गाउँ', roman: 'Gaun', category: 'places', image: '🏘️' },

  // Verbs (20 words)
  { id: 123, english: 'Eat', nepali: 'खानु', roman: 'Khaanu', category: 'verbs', image: '🍽️' },
  { id: 124, english: 'Drink', nepali: 'पिउनु', roman: 'Piunu', category: 'verbs', image: '🥤' },
  { id: 125, english: 'Go', nepali: 'जानु', roman: 'Jaanu', category: 'verbs', image: '🚶' },
  { id: 126, english: 'Come', nepali: 'आउनु', roman: 'Aaunu', category: 'verbs', image: '👋' },
  { id: 127, english: 'See', nepali: 'हेर्नु', roman: 'Hernu', category: 'verbs', image: '👀' },
  { id: 128, english: 'Speak', nepali: 'बोल्नु', roman: 'Bolnu', category: 'verbs', image: '🗣️' },
  { id: 129, english: 'Listen', nepali: 'सुन्नु', roman: 'Sunnun', category: 'verbs', image: '👂' },
  { id: 130, english: 'Read', nepali: 'पढ्नु', roman: 'Padhnu', category: 'verbs', image: '📖' },
  { id: 131, english: 'Write', nepali: 'लेख्नु', roman: 'Lekhnu', category: 'verbs', image: '✏️' },
  { id: 132, english: 'Sleep', nepali: 'सुत्नु', roman: 'Sutnu', category: 'verbs', image: '😴' },
  { id: 133, english: 'Walk', nepali: 'हिँड्नु', roman: 'Hindnu', category: 'verbs', image: '🚶' },
  { id: 134, english: 'Run', nepali: 'दौडनु', roman: 'Daudnu', category: 'verbs', image: '🏃' },
  { id: 135, english: 'Buy', nepali: 'किन्नु', roman: 'Kinnu', category: 'verbs', image: '🛒' },
  { id: 136, english: 'Sell', nepali: 'बेच्नु', roman: 'Bechnu', category: 'verbs', image: '💰' },
  { id: 137, english: 'Give', nepali: 'दिनु', roman: 'Dinu', category: 'verbs', image: '🎁' },
  { id: 138, english: 'Take', nepali: 'लिनु', roman: 'Linu', category: 'verbs', image: '🤲' },
  { id: 139, english: 'Help', nepali: 'सहयोग गर्नु', roman: 'Sahayog garnu', category: 'verbs', image: '🤝' },
  { id: 140, english: 'Know', nepali: 'थाहा हुनु', roman: 'Thaaha hunu', category: 'verbs', image: '🧠' },
  { id: 141, english: 'Want', nepali: 'चाहनु', roman: 'Chaahanu', category: 'verbs', image: '🙏' },
  { id: 142, english: 'Like', nepali: 'मन पर्नु', roman: 'Man parnu', category: 'verbs', image: '❤️' },

  // Questions (10 words)
  { id: 143, english: 'What?', nepali: 'के?', roman: 'Ke?', category: 'questions', image: '❓' },
  { id: 144, english: 'Who?', nepali: 'को?', roman: 'Ko?', category: 'questions', image: '👤' },
  { id: 145, english: 'Where?', nepali: 'कहाँ?', roman: 'Kahaan?', category: 'questions', image: '📍' },
  { id: 146, english: 'When?', nepali: 'कहिले?', roman: 'Kahile?', category: 'questions', image: '⏰' },
  { id: 147, english: 'Why?', nepali: 'किन?', roman: 'Kin?', category: 'questions', image: '🤔' },
  { id: 148, english: 'How?', nepali: 'कसरी?', roman: 'Kasari?', category: 'questions', image: '❓' },
  { id: 149, english: 'How much?', nepali: 'कति?', roman: 'Kati?', category: 'questions', image: '💰' },
  { id: 150, english: 'Which?', nepali: 'कुन?', roman: 'Kun?', category: 'questions', image: '❓' },
  { id: 151, english: 'How many?', nepali: 'कति वटा?', roman: 'Kati wata?', category: 'questions', image: '🔢' },
  { id: 152, english: 'Is it?', nepali: 'हो कि?', roman: 'Ho ki?', category: 'questions', image: '❓' },

  // Body (10 words)
  { id: 153, english: 'Head', nepali: 'टाउको', roman: 'Taauko', category: 'body', image: '🗣️' },
  { id: 154, english: 'Eye', nepali: 'आँखा', roman: 'Aankha', category: 'body', image: '👁️' },
  { id: 155, english: 'Ear', nepali: 'कान', roman: 'Kaan', category: 'body', image: '👂' },
  { id: 156, english: 'Nose', nepali: 'नाक', roman: 'Naak', category: 'body', image: '👃' },
  { id: 157, english: 'Mouth', nepali: 'मुख', roman: 'Mukh', category: 'body', image: '👄' },
  { id: 158, english: 'Hand', nepali: 'हात', roman: 'Haat', category: 'body', image: '✋' },
  { id: 159, english: 'Foot', nepali: 'खुट्टा', roman: 'Khutta', category: 'body', image: '🦶' },
  { id: 160, english: 'Heart', nepali: 'मुटु', roman: 'Mutu', category: 'body', image: '❤️' },
  { id: 161, english: 'Stomach', nepali: 'पेट', roman: 'Pet', category: 'body', image: '🫃' },
  { id: 162, english: 'Back', nepali: 'ढाड', roman: 'Dhaad', category: 'body', image: '🔙' },

  // Animals (10 words)
  { id: 163, english: 'Dog', nepali: 'कुकुर', roman: 'Kukur', category: 'animals', image: '🐕' },
  { id: 164, english: 'Cat', nepali: 'बिरालो', roman: 'Biraalo', category: 'animals', image: '🐱' },
  { id: 165, english: 'Cow', nepali: 'गाई', roman: 'Gaai', category: 'animals', image: '🐄' },
  { id: 166, english: 'Buffalo', nepali: 'भैंसी', roman: 'Bhainsi', category: 'animals', image: '🐃' },
  { id: 167, english: 'Bird', nepali: 'चरा', roman: 'Chara', category: 'animals', image: '🐦' },
  { id: 168, english: 'Fish', nepali: 'माछा', roman: 'Maachha', category: 'animals', image: '🐟' },
  { id: 169, english: 'Horse', nepali: 'घोडा', roman: 'Ghoda', category: 'animals', image: '🐴' },
  { id: 170, english: 'Rabbit', nepali: 'खरायो', roman: 'Kharaayo', category: 'animals', image: '🐇' },
  { id: 171, english: 'Goat', nepali: 'बाख्रा', roman: 'Bakhraa', category: 'animals', image: '🐐' },
  { id: 172, english: 'Elephant', nepali: 'हात्ती', roman: 'Haatti', category: 'animals', image: '🐘' },

  // Numbers 11-20 and tens (new ids 173+; never renumber existing ids)
  { id: 173, english: 'Eleven', nepali: 'एघार', roman: 'Eghaara', category: 'numbers', image: '1️⃣1️⃣' },
  { id: 174, english: 'Twelve', nepali: 'बाह्र', roman: 'Baahra', category: 'numbers', image: '1️⃣2️⃣' },
  { id: 175, english: 'Thirteen', nepali: 'तेह्र', roman: 'Tehra', category: 'numbers', image: '1️⃣3️⃣' },
  { id: 176, english: 'Fourteen', nepali: 'चौध', roman: 'Chaudha', category: 'numbers', image: '1️⃣4️⃣' },
  { id: 177, english: 'Fifteen', nepali: 'पन्ध्र', roman: 'Pandhra', category: 'numbers', image: '1️⃣5️⃣' },
  { id: 178, english: 'Sixteen', nepali: 'सोह्र', roman: 'Sohra', category: 'numbers', image: '1️⃣6️⃣' },
  { id: 179, english: 'Seventeen', nepali: 'सत्र', roman: 'Satra', category: 'numbers', image: '1️⃣7️⃣' },
  { id: 180, english: 'Eighteen', nepali: 'अठार', roman: 'Athaara', category: 'numbers', image: '1️⃣8️⃣' },
  { id: 181, english: 'Nineteen', nepali: 'उन्नाइस', roman: 'Unnaais', category: 'numbers', image: '1️⃣9️⃣' },
  { id: 182, english: 'Twenty', nepali: 'बीस', roman: 'Bees', category: 'numbers', image: '2️⃣0️⃣' },
  { id: 183, english: 'Thirty', nepali: 'तीस', roman: 'Tees', category: 'numbers', image: '3️⃣0️⃣' },
  { id: 184, english: 'Forty', nepali: 'चालीस', roman: 'Chaalis', category: 'numbers', image: '4️⃣0️⃣' },
  { id: 185, english: 'Fifty', nepali: 'पचास', roman: 'Pachaas', category: 'numbers', image: '5️⃣0️⃣' },
  { id: 186, english: 'Sixty', nepali: 'साठी', roman: 'Saathi', category: 'numbers', image: '6️⃣0️⃣' },
  { id: 187, english: 'Seventy', nepali: 'सत्तरी', roman: 'Sattari', category: 'numbers', image: '7️⃣0️⃣' },
  { id: 188, english: 'Eighty', nepali: 'असी', roman: 'Asi', category: 'numbers', image: '8️⃣0️⃣' },
  { id: 189, english: 'Ninety', nepali: 'नब्बे', roman: 'Nabbe', category: 'numbers', image: '9️⃣0️⃣' },
  { id: 190, english: 'Hundred', nepali: 'सय', roman: 'Saya', category: 'numbers', image: '💯' },

  // Nepali calendar months (Bikram Sambat)
  { id: 191, english: 'Baishakh (Apr-May)', nepali: 'वैशाख', roman: 'Baishakh', category: 'months', image: '🌸' },
  { id: 192, english: 'Jestha (May-Jun)', nepali: 'जेठ', roman: 'Jeth', category: 'months', image: '☀️' },
  { id: 193, english: 'Ashadh (Jun-Jul)', nepali: 'असार', roman: 'Asaar', category: 'months', image: '🌧️' },
  { id: 194, english: 'Shrawan (Jul-Aug)', nepali: 'साउन', roman: 'Saaun', category: 'months', image: '💚' },
  { id: 195, english: 'Bhadra (Aug-Sep)', nepali: 'भदौ', roman: 'Bhadau', category: 'months', image: '🌾' },
  { id: 196, english: 'Ashwin (Sep-Oct)', nepali: 'असोज', roman: 'Asoj', category: 'months', image: '🎉' },
  { id: 197, english: 'Kartik (Oct-Nov)', nepali: 'कात्तिक', roman: 'Kaattik', category: 'months', image: '🪔' },
  { id: 198, english: 'Mangsir (Nov-Dec)', nepali: 'मंसिर', roman: 'Mangsir', category: 'months', image: '🌾' },
  { id: 199, english: 'Poush (Dec-Jan)', nepali: 'पुस', roman: 'Pus', category: 'months', image: '❄️' },
  { id: 200, english: 'Magh (Jan-Feb)', nepali: 'माघ', roman: 'Maagh', category: 'months', image: '🧣' },
  { id: 201, english: 'Falgun (Feb-Mar)', nepali: 'फागुन', roman: 'Phaagun', category: 'months', image: '🌈' },
  { id: 202, english: 'Chaitra (Mar-Apr)', nepali: 'चैत', roman: 'Chait', category: 'months', image: '🌱' },

  // Weather (new ids 203+; never reuse removed ids)
  { id: 203, english: 'Weather', nepali: 'मौसम', roman: 'Mausam', category: 'weather', image: '🌦️' },
  { id: 204, english: 'Rain', nepali: 'वर्षा', roman: 'Barsha', category: 'weather', image: '🌧️' },
  { id: 205, english: 'Snow', nepali: 'हिउँ', roman: 'Hiun', category: 'weather', image: '❄️' },
  { id: 206, english: 'Sun', nepali: 'घाम', roman: 'Ghaam', category: 'weather', image: '☀️' },
  { id: 207, english: 'Wind', nepali: 'हावा', roman: 'Hawa', category: 'weather', image: '🌬️' },
  { id: 208, english: 'Cloud', nepali: 'बादल', roman: 'Baadal', category: 'weather', image: '☁️' },
  { id: 209, english: 'Storm', nepali: 'आँधी', roman: 'Aandhi', category: 'weather', image: '🌪️' },
  { id: 210, english: 'Fog', nepali: 'कुहिरो', roman: 'Kuhiro', category: 'weather', image: '🌫️' },
  { id: 211, english: 'Cold weather', nepali: 'जाडो', roman: 'Jaado', category: 'weather', image: '🥶' },
  { id: 212, english: 'Hot weather', nepali: 'गर्मी', roman: 'Garmi', category: 'weather', image: '🥵' },
  { id: 213, english: 'Umbrella', nepali: 'छाता', roman: 'Chhata', category: 'weather', image: '☂️' },
  { id: 214, english: 'Rainbow', nepali: 'इन्द्रेणी', roman: 'Indreni', category: 'weather', image: '🌈' },
  { id: 215, english: 'Lightning', nepali: 'चट्याङ', roman: 'Chatyang', category: 'weather', image: '⚡' },
  { id: 216, english: 'Season', nepali: 'ऋतु', roman: 'Ritu', category: 'weather', image: '🍂' },

  // Transport
  { id: 217, english: 'Bus', nepali: 'बस', roman: 'Bus', category: 'transport', image: '🚌' },
  { id: 218, english: 'Taxi', nepali: 'ट्याक्सी', roman: 'Tyaaksi', category: 'transport', image: '🚕' },
  { id: 219, english: 'Plane', nepali: 'हवाईजहाज', roman: 'Hawaijahaj', category: 'transport', image: '✈️' },
  { id: 220, english: 'Road', nepali: 'बाटो', roman: 'Baato', category: 'transport', image: '🛣️' },
  { id: 221, english: 'Ticket', nepali: 'टिकट', roman: 'Tikat', category: 'transport', image: '🎫' },
  { id: 222, english: 'Bicycle', nepali: 'साइकल', roman: 'Saikal', category: 'transport', image: '🚲' },
  { id: 223, english: 'Boat', nepali: 'डुङ्गा', roman: 'Dunga', category: 'transport', image: '🛶' },
  { id: 224, english: 'Airport', nepali: 'विमानस्थल', roman: 'Vimansthal', category: 'transport', image: '🛬' },
  { id: 225, english: 'Motorcycle', nepali: 'मोटरसाइकल', roman: 'Motarsaikal', category: 'transport', image: '🏍️' },
  { id: 226, english: 'Train', nepali: 'रेल', roman: 'Rel', category: 'transport', image: '🚆' },
  { id: 227, english: 'Car', nepali: 'गाडी', roman: 'Gaadi', category: 'transport', image: '🚗' },
  { id: 228, english: 'Driver', nepali: 'चालक', roman: 'Chaalak', category: 'transport', image: '🧑‍✈️' },
  { id: 229, english: 'Bus stop', nepali: 'बस बिसौनी', roman: 'Bus bisauni', category: 'transport', image: '🚏' },
  { id: 230, english: 'Journey', nepali: 'यात्रा', roman: 'Yatra', category: 'transport', image: '🧳' },

  // Shopping
  { id: 231, english: 'Price', nepali: 'दाम', roman: 'Daam', category: 'shopping', image: '💰' },
  { id: 232, english: 'Cheap', nepali: 'सस्तो', roman: 'Sasto', category: 'shopping', image: '🪙' },
  { id: 233, english: 'Expensive', nepali: 'महँगो', roman: 'Mahango', category: 'shopping', image: '💸' },
  { id: 234, english: 'Money', nepali: 'पैसा', roman: 'Paisa', category: 'shopping', image: '💵' },
  { id: 235, english: 'Rupee', nepali: 'रुपैयाँ', roman: 'Rupaiya', category: 'shopping', image: '💴' },
  { id: 236, english: 'Shop', nepali: 'पसल', roman: 'Pasal', category: 'shopping', image: '🏪' },
  { id: 237, english: 'Discount', nepali: 'छुट', roman: 'Chhut', category: 'shopping', image: '🏷️' },
  { id: 238, english: 'Bag', nepali: 'झोला', roman: 'Jhola', category: 'shopping', image: '👜' },
  { id: 239, english: 'Shopkeeper', nepali: 'साहुजी', roman: 'Sahuji', category: 'shopping', image: '🧑‍💼' },
  { id: 240, english: 'Change (money)', nepali: 'खुद्रा', roman: 'Khudra', category: 'shopping', image: '🪙' },
  { id: 241, english: 'Free', nepali: 'सित्तैमा', roman: 'Sittaima', category: 'shopping', image: '🆓' },
  { id: 242, english: 'Total', nepali: 'जम्मा', roman: 'Jamma', category: 'shopping', image: '🧾' },
  { id: 243, english: 'Bill', nepali: 'बिल', roman: 'Bil', category: 'shopping', image: '🧾' },
  { id: 244, english: 'Bargain', nepali: 'मोलमोलाइ', roman: 'Molmolai', category: 'shopping', image: '🤝' },

  // Health
  { id: 245, english: 'Doctor', nepali: 'डाक्टर', roman: 'Daktar', category: 'health', image: '🧑‍⚕️' },
  { id: 246, english: 'Medicine', nepali: 'औषधि', roman: 'Aushadhi', category: 'health', image: '💊' },
  { id: 247, english: 'Pain', nepali: 'दुखाइ', roman: 'Dukhai', category: 'health', image: '🤕' },
  { id: 248, english: 'Fever', nepali: 'ज्वरो', roman: 'Jwaro', category: 'health', image: '🤒' },
  { id: 249, english: 'Sick', nepali: 'बिरामी', roman: 'Birami', category: 'health', image: '😷' },
  { id: 250, english: 'Healthy', nepali: 'स्वस्थ', roman: 'Swastha', category: 'health', image: '💪' },
  { id: 251, english: 'Pharmacy', nepali: 'फार्मेसी', roman: 'Pharmesi', category: 'health', image: '⚕️' },
  { id: 252, english: 'Headache', nepali: 'टाउको दुखाइ', roman: 'Tauko dukhai', category: 'health', image: '🤯' },
  { id: 253, english: 'Stomachache', nepali: 'पेट दुखाइ', roman: 'Pet dukhai', category: 'health', image: '😖' },
  { id: 254, english: 'Cough', nepali: 'खोकी', roman: 'Khoki', category: 'health', image: '😮‍💨' },
  { id: 255, english: 'Cold (illness)', nepali: 'रुघा', roman: 'Rugha', category: 'health', image: '🤧' },
  { id: 256, english: 'Injection', nepali: 'सुई', roman: 'Sui', category: 'health', image: '💉' },
  { id: 257, english: 'Nurse', nepali: 'नर्स', roman: 'Nurse', category: 'health', image: '🧑‍⚕️' },
  { id: 258, english: 'Rest', nepali: 'आराम', roman: 'Aaram', category: 'health', image: '🛌' },

  // Emotions
  { id: 259, english: 'Angry', nepali: 'रिसाएको', roman: 'Risaeko', category: 'emotions', image: '😠' },
  { id: 260, english: 'Tired', nepali: 'थाकेको', roman: 'Thakeko', category: 'emotions', image: '😩' },
  { id: 261, english: 'Hungry', nepali: 'भोकाएको', roman: 'Bhokaeko', category: 'emotions', image: '😋' },
  { id: 262, english: 'Thirsty', nepali: 'तिर्खाएको', roman: 'Tirkhaeko', category: 'emotions', image: '🥤' },
  { id: 263, english: 'Scared', nepali: 'डराएको', roman: 'Daraeko', category: 'emotions', image: '😨' },
  { id: 264, english: 'Excited', nepali: 'उत्साहित', roman: 'Utsahit', category: 'emotions', image: '🤩' },
  { id: 265, english: 'Bored', nepali: 'दिक्क लागेको', roman: 'Dikka lageko', category: 'emotions', image: '🥱' },
  { id: 266, english: 'Love', nepali: 'माया', roman: 'Maya', category: 'emotions', image: '❤️' },
  { id: 267, english: 'Worried', nepali: 'चिन्तित', roman: 'Chintit', category: 'emotions', image: '😟' },
  { id: 268, english: 'Surprised', nepali: 'छक्क परेको', roman: 'Chhakka pareko', category: 'emotions', image: '😲' },
  { id: 269, english: 'Shy', nepali: 'लजाएको', roman: 'Lajaeko', category: 'emotions', image: '😳' },
  { id: 270, english: 'Proud', nepali: 'गर्व', roman: 'Garva', category: 'emotions', image: '😌' },

  // Clothing
  { id: 271, english: 'Clothes', nepali: 'लुगा', roman: 'Luga', category: 'clothing', image: '👕' },
  { id: 272, english: 'Shirt', nepali: 'सर्ट', roman: 'Sart', category: 'clothing', image: '👔' },
  { id: 273, english: 'Pants', nepali: 'पाइन्ट', roman: 'Paint', category: 'clothing', image: '👖' },
  { id: 274, english: 'Shoes', nepali: 'जुत्ता', roman: 'Jutta', category: 'clothing', image: '👟' },
  { id: 275, english: 'Cap / Hat', nepali: 'टोपी', roman: 'Topi', category: 'clothing', image: '🧢' },
  { id: 276, english: 'Dhaka Topi', nepali: 'ढाका टोपी', roman: 'Dhaka topi', category: 'clothing', image: '🇳🇵' },
  { id: 277, english: 'Jacket', nepali: 'ज्याकेट', roman: 'Jyaket', category: 'clothing', image: '🧥' },
  { id: 278, english: 'Sari', nepali: 'सारी', roman: 'Sari', category: 'clothing', image: '🥻' },
  { id: 279, english: 'Socks', nepali: 'मोजा', roman: 'Moja', category: 'clothing', image: '🧦' },
  { id: 280, english: 'Gloves', nepali: 'पन्जा', roman: 'Panja', category: 'clothing', image: '🧤' },
  { id: 281, english: 'Scarf', nepali: 'गलबन्दी', roman: 'Galbandi', category: 'clothing', image: '🧣' },
  { id: 282, english: 'Kurta', nepali: 'कुर्ता', roman: 'Kurta', category: 'clothing', image: '👗' },

  // Directions (fill)
  { id: 283, english: 'Far', nepali: 'टाढा', roman: 'Taadha', category: 'directions', image: '🗺️' },
  { id: 284, english: 'Behind', nepali: 'पछाडि', roman: 'Pachhadi', category: 'directions', image: '↩️' },
  { id: 285, english: 'In front', nepali: 'अगाडि', roman: 'Agadi', category: 'directions', image: '⏩' },
  { id: 286, english: 'Inside', nepali: 'भित्र', roman: 'Bhitra', category: 'directions', image: '📥' },
  { id: 287, english: 'Outside', nepali: 'बाहिर', roman: 'Bahira', category: 'directions', image: '📤' },
  { id: 288, english: 'Middle', nepali: 'बीचमा', roman: 'Bichma', category: 'directions', image: '⏺️' },

  // Body (fill)
  { id: 289, english: 'Hair', nepali: 'कपाल', roman: 'Kapal', category: 'body', image: '💇' },
  { id: 290, english: 'Teeth', nepali: 'दाँत', roman: 'Daant', category: 'body', image: '🦷' },
  { id: 291, english: 'Finger', nepali: 'औंला', roman: 'Aunla', category: 'body', image: '☝️' },
  { id: 292, english: 'Leg', nepali: 'गोडा', roman: 'Goda', category: 'body', image: '🦵' },
  { id: 293, english: 'Skin', nepali: 'छाला', roman: 'Chhala', category: 'body', image: '🫱' },
  { id: 294, english: 'Blood', nepali: 'रगत', roman: 'Ragat', category: 'body', image: '🩸' },

  // Time (fill)
  { id: 295, english: 'Hour', nepali: 'घण्टा', roman: 'Ghanta', category: 'time', image: '🕐' },
  { id: 296, english: 'Minute', nepali: 'मिनेट', roman: 'Minet', category: 'time', image: '⏱️' },
  { id: 297, english: 'Week', nepali: 'हप्ता', roman: 'Hapta', category: 'time', image: '🗓️' },
  { id: 298, english: 'Month', nepali: 'महिना', roman: 'Mahina', category: 'time', image: '📆' },
  { id: 299, english: 'Year', nepali: 'साल', roman: 'Saal', category: 'time', image: '📅' },

  // Food (fill)
  { id: 300, english: 'Chicken', nepali: 'कुखुरा', roman: 'Kukhura', category: 'food', image: '🍗' },
  { id: 301, english: 'Potato', nepali: 'आलु', roman: 'Aalu', category: 'food', image: '🥔' },
  { id: 302, english: 'Onion', nepali: 'प्याज', roman: 'Pyaj', category: 'food', image: '🧅' },
  { id: 303, english: 'Banana', nepali: 'केरा', roman: 'Kera', category: 'food', image: '🍌' },
  { id: 304, english: 'Mango', nepali: 'आँप', roman: 'Aanp', category: 'food', image: '🥭' },
  { id: 305, english: 'Spicy', nepali: 'पिरो', roman: 'Piro', category: 'food', image: '🌶️' },
  { id: 306, english: 'Sweet', nepali: 'गुलियो', roman: 'Guliyo', category: 'food', image: '🍯' },
  { id: 307, english: 'Curd', nepali: 'दही', roman: 'Dahi', category: 'food', image: '🥣' },
  { id: 308, english: 'Pickle (Achar)', nepali: 'अचार', roman: 'Achar', category: 'food', image: '🫙' },
  { id: 309, english: 'Snack', nepali: 'खाजा', roman: 'Khaja', category: 'food', image: '🍪' },

  // Places (fill)
  { id: 310, english: 'Bank', nepali: 'बैंक', roman: 'Bank', category: 'places', image: '🏦' },
  { id: 311, english: 'City', nepali: 'सहर', roman: 'Sahar', category: 'places', image: '🏙️' },
  { id: 312, english: 'Country', nepali: 'देश', roman: 'Desh', category: 'places', image: '🌏' },
  { id: 313, english: 'Hotel', nepali: 'होटल', roman: 'Hotel', category: 'places', image: '🏨' },
  { id: 314, english: 'Toilet', nepali: 'शौचालय', roman: 'Shauchalaya', category: 'places', image: '🚻' },
  { id: 315, english: 'Bridge', nepali: 'पुल', roman: 'Pul', category: 'places', image: '🌉' },
  { id: 316, english: 'Garden', nepali: 'बगैंचा', roman: 'Bagaincha', category: 'places', image: '🌷' },
  { id: 317, english: 'Field (farm)', nepali: 'खेत', roman: 'Khet', category: 'places', image: '🌾' },

  // Verbs (fill)
  { id: 318, english: 'Sit', nepali: 'बस्नु', roman: 'Basnu', category: 'verbs', image: '🪑' },
  { id: 319, english: 'Stand', nepali: 'उभिनु', roman: 'Ubhinu', category: 'verbs', image: '🧍' },
  { id: 320, english: 'Open', nepali: 'खोल्नु', roman: 'Kholnu', category: 'verbs', image: '🔓' },
  { id: 321, english: 'Close', nepali: 'बन्द गर्नु', roman: 'Banda garnu', category: 'verbs', image: '🔒' },
  { id: 322, english: 'Wash', nepali: 'धुनु', roman: 'Dhunu', category: 'verbs', image: '🧼' },
  { id: 323, english: 'Cook', nepali: 'पकाउनु', roman: 'Pakaunu', category: 'verbs', image: '🍳' },
  { id: 324, english: 'Laugh', nepali: 'हाँस्नु', roman: 'Haasnu', category: 'verbs', image: '😂' },
  { id: 325, english: 'Cry', nepali: 'रुनु', roman: 'Runu', category: 'verbs', image: '😭' },
  { id: 326, english: 'Wait', nepali: 'पर्खनु', roman: 'Parkhanu', category: 'verbs', image: '⏳' },
  { id: 327, english: 'Understand', nepali: 'बुझ्नु', roman: 'Bujhnu', category: 'verbs', image: '💡' },
];

export function getWordsByCategory(cat: string): Word[] {
  return vocab.filter(w => w.category === cat);
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
