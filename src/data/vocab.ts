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
  localStreak: Record<string, { current: number; longest: number; lastDate: string }>;
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
};

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
        let newCurrent = existing.lastDate === yesterdayStr ? existing.current + 1 : 1;
        const newLongest = Math.max(newCurrent, existing.longest);
        set({ localStreak: { ...get().localStreak, [userId]: { current: newCurrent, longest: newLongest, lastDate: today } } });
      },
      getLocalStreak: (userId) => {
        const s = get().localStreak[userId];
        return s ? { current: s.current, longest: s.longest } : { current: 0, longest: 0 };
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
  'verbs', 'questions', 'body', 'animals',
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
  { id: 14, english: 'Excuse me', nepali: 'लाग्दैन', roman: 'Laagdaina', category: 'greetings', image: '🙏' },
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
  { id: 26, english: 'Eleven', nepali: 'एघार', roman: 'Eghaar', category: 'numbers', image: '🔢' },
  { id: 27, english: 'Twelve', nepali: 'बाह्र', roman: 'Baahra', category: 'numbers', image: '🔢' },
  { id: 28, english: 'Twenty', nepali: 'बीस', roman: 'Bis', category: 'numbers', image: '🔢' },
  { id: 29, english: 'Thirty', nepali: 'तीस', roman: 'Tis', category: 'numbers', image: '🔢' },
  { id: 30, english: 'Fifty', nepali: 'पचास', roman: 'Pachaas', category: 'numbers', image: '🔢' },
  { id: 31, english: 'Hundred', nepali: 'एक सय', roman: 'Ek saya', category: 'numbers', image: '💯' },
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
  { id: 50, english: 'Child', nepali: 'बालबालिका', roman: 'Balbalika', category: 'family', image: '👶' },
  { id: 51, english: 'Grandmother', nepali: 'आमा बुबु', roman: 'Aama bubu', category: 'family', image: '👵' },
  { id: 52, english: 'Grandfather', nepali: 'बुबा बुबु', roman: 'Buba bubu', category: 'family', image: '👴' },
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
  { id: 64, english: 'Fish', nepali: 'माछा', roman: 'Maachha', category: 'food', image: '🐟' },
  { id: 65, english: 'Egg', nepali: 'अण्डा', roman: 'Andaa', category: 'food', image: '🥚' },
  { id: 66, english: 'Milk', nepali: 'दूध', roman: 'Dudh', category: 'food', image: '🥛' },
  { id: 67, english: 'Tea', nepali: 'चिया', roman: 'Chiya', category: 'food', image: '🍵' },
  { id: 68, english: 'Salt', nepali: 'नुन', roman: 'Nun', category: 'food', image: '🧂' },
  { id: 69, english: 'Sugar', nepali: 'चिनी', roman: 'Chini', category: 'food', image: '🍬' },
  { id: 70, english: 'Momo', nepali: 'मम', roman: 'Momo', category: 'food', image: '🥟' },
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
