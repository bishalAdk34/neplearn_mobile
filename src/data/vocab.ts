import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage } from 'zustand/middleware';

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
};

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      learnedByUser: {},
      learningGoal: null,
      learningLevel: null,
      onboardingDone: false,
      setLearningGoal: (goal) => set({ learningGoal: goal }),
      setLearningLevel: (level) => set({ learningLevel: level }),
      completeOnboarding: () => set({ onboardingDone: true }),
      learnWord: (userId, id) => {
        const userLearned = get().learnedByUser[userId] || [];
        set({ learnedByUser: { ...get().learnedByUser, [userId]: [...userLearned, id] } });
      },
      unlearnWord: (userId, id) => {
        const userLearned = get().learnedByUser[userId] || [];
        set({ learnedByUser: { ...get().learnedByUser, [userId]: userLearned.filter(l => l !== id) } });
      },
      isLearned: (userId, id) => (get().learnedByUser[userId] || []).includes(id),
      toggleLearned: (userId, id) => {
        const userLearned = get().learnedByUser[userId] || [];
        if (userLearned.includes(id)) {
          set({ learnedByUser: { ...get().learnedByUser, [userId]: userLearned.filter(l => l !== id) } });
        } else {
          set({ learnedByUser: { ...get().learnedByUser, [userId]: [...userLearned, id] } });
        }
      },
      getLearned: (userId) => get().learnedByUser[userId] || [],
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
] as const;

export type Category = (typeof categories)[number];

export const vocab: Word[] = [
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
  { id: 11, english: 'One', nepali: 'एक', roman: 'Ek', category: 'numbers', image: '1️⃣' },
  { id: 12, english: 'Two', nepali: 'दुई', roman: 'Dui', category: 'numbers', image: '2️⃣' },
  { id: 13, english: 'Three', nepali: 'तीन', roman: 'Tin', category: 'numbers', image: '3️⃣' },
  { id: 14, english: 'Four', nepali: 'चार', roman: 'Char', category: 'numbers', image: '4️⃣' },
  { id: 15, english: 'Five', nepali: 'पाँच', roman: 'Panch', category: 'numbers', image: '5️⃣' },
  { id: 16, english: 'Six', nepali: 'छ', roman: 'Chha', category: 'numbers', image: '6️⃣' },
  { id: 17, english: 'Seven', nepali: 'सात', roman: 'Saat', category: 'numbers', image: '7️⃣' },
  { id: 18, english: 'Eight', nepali: 'आठ', roman: 'Aath', category: 'numbers', image: '8️⃣' },
  { id: 19, english: 'Nine', nepali: 'नौ', roman: 'Nau', category: 'numbers', image: '9️⃣' },
  { id: 20, english: 'Ten', nepali: 'दस', roman: 'Das', category: 'numbers', image: '🔟' },
  { id: 21, english: 'Red', nepali: 'रातो', roman: 'Rato', category: 'colors', image: '🔴' },
  { id: 22, english: 'Blue', nepali: 'निलो', roman: 'Nilo', category: 'colors', image: '🔵' },
  { id: 23, english: 'Green', nepali: 'हरियो', roman: 'Hariyo', category: 'colors', image: '🟢' },
  { id: 24, english: 'Yellow', nepali: 'पहेंलो', roman: 'Pahenlo', category: 'colors', image: '🟡' },
  { id: 25, english: 'Black', nepali: 'कालो', roman: 'Kalo', category: 'colors', image: '⚫' },
  { id: 26, english: 'Mother', nepali: 'आमा', roman: 'Aama', category: 'family', image: '👩' },
  { id: 27, english: 'Father', nepali: 'बुबा', roman: 'Buba', category: 'family', image: '👨' },
  { id: 28, english: 'Brother', nepali: 'दाजु/भाइ', roman: 'Daju/Bhai', category: 'family', image: '👦' },
  { id: 29, english: 'Sister', nepali: 'दिदी/बहिनी', roman: 'Didi/Bahini', category: 'family', image: '👧' },
  { id: 30, english: 'Child', nepali: 'बालबालिका', roman: 'Balbalika', category: 'family', image: '👶' },
  { id: 31, english: 'Water', nepali: 'पानी', roman: 'Pani', category: 'food', image: '💧' },
  { id: 32, english: 'Rice', nepali: 'भात', roman: 'Bhaat', category: 'food', image: '🍚' },
  { id: 33, english: 'Bread', nepali: 'रोटी', roman: 'Roti', category: 'food', image: '🍞' },
  { id: 34, english: 'Vegetable', nepali: 'तरकारी', roman: 'Tarkari', category: 'food', image: '🥦' },
  { id: 35, english: 'Fruit', nepali: 'फलफूल', roman: 'Phalphal', category: 'food', image: '🍎' },
  { id: 36, english: 'Left', nepali: 'बायाँ', roman: 'Bayaa', category: 'directions', image: '⬅️' },
  { id: 37, english: 'Right', nepali: 'दायाँ', roman: 'Daya', category: 'directions', image: '➡️' },
  { id: 38, english: 'Straight', nepali: 'सिधा', roman: 'Sidha', category: 'directions', image: '⬆️' },
  { id: 39, english: 'Here', nepali: 'यहाँ', roman: 'Yahaa', category: 'directions', image: '📍' },
  { id: 40, english: 'There', nepali: 'त्यहाँ', roman: 'Tyahaa', category: 'directions', image: '📍' },
  { id: 41, english: 'Monday', nepali: 'सोमबार', roman: 'Sombar', category: 'days', image: '📅' },
  { id: 42, english: 'Tuesday', nepali: 'मङ्गलबार', roman: 'Mangalbar', category: 'days', image: '📅' },
  { id: 43, english: 'Wednesday', nepali: 'बुधबार', roman: 'Budhbar', category: 'days', image: '📅' },
  { id: 44, english: 'Thursday', nepali: 'बिहीबार', roman: 'Bihibar', category: 'days', image: '📅' },
  { id: 45, english: 'Friday', nepali: 'शुक्रबार', roman: 'Shukrabar', category: 'days', image: '📅' },
  { id: 46, english: 'Today', nepali: 'आज', roman: 'Aaja', category: 'time', image: '📅' },
  { id: 47, english: 'Tomorrow', nepali: 'भोलि', roman: 'Bholi', category: 'time', image: '📅' },
  { id: 48, english: 'Big', nepali: 'ठूलो', roman: 'Thulo', category: 'adjectives', image: '📏' },
  { id: 49, english: 'Small', nepali: 'सानो', roman: 'Sano', category: 'adjectives', image: '🔍' },
  { id: 50, english: 'Happy', nepali: 'खुशी', roman: 'Khushi', category: 'adjectives', image: '😊' },
  { id: 51, english: 'House', nepali: 'घर', roman: 'Ghar', category: 'places', image: '🏠' },
  { id: 52, english: 'School', nepali: 'स्कूल', roman: 'School', category: 'places', image: '🏫' },
  { id: 53, english: 'Market', nepali: 'बजार', roman: 'Bajar', category: 'places', image: '🏪' },
  { id: 54, english: 'Mountain', nepali: 'हिमाल', roman: 'Himal', category: 'places', image: '⛰️' },
];

export function getWordsByCategory(cat: string): Word[] {
  return vocab.filter(w => w.category === cat);
}

export function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}
