import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { categories, vocab, GUEST_ID } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';

const CATEGORY_COLORS: Record<string, string> = {
  greetings: '#6366F1',
  numbers: '#8B5CF6',
  colors: '#EC4899',
  family: '#14B8A6',
  food: '#F97316',
  directions: '#06B6D4',
  days: '#F59E0B',
  time: '#10B981',
  adjectives: '#D946EF',
  places: '#0EA5E9',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  greetings: '👋',
  numbers: '🔢',
  colors: '🎨',
  family: '👨‍👩‍👧‍👦',
  food: '🍜',
  directions: '🧭',
  days: '📅',
  time: '⏰',
  adjectives: '✨',
  places: '🏔️',
};

const Progress = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const clearUser = useAuthStore(s => s.clearUser);
  const { isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;

  const stats = categories.map(cat => {
    const words = vocab.filter(w => w.category === cat);
    const learned = words.filter(w => isLearned(uid, w.id)).length;
    return { cat, learned, total: words.length, percent: Math.round((learned / words.length) * 100) };
  });

  const totalLearned = stats.reduce((sum, s) => sum + s.learned, 0);
  const totalWords = stats.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#FBF9F4' }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#800816', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }} className="px-6 pt-14 pb-8">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="p-2 rounded-xl mr-3">
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>
            {user ? `${user.name}'s Progress` : 'Progress'}
          </Text>
          {user ? (
            <TouchableOpacity onPress={clearUser} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="px-3 py-1.5 rounded-xl">
              <Text className="text-white text-sm font-semibold">Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <Link href="/signin" asChild>
              <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="px-3 py-1.5 rounded-xl">
                <Text className="text-white text-sm font-semibold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24 }} className="p-6 items-center">
          <Text className="text-5xl font-bold text-white mb-1">{overallPercent}%</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }} className="text-lg">Overall Progress</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} className="h-2 rounded-full w-full mt-3 overflow-hidden">
            <View className="h-full bg-white rounded-full" style={{ width: overallPercent + '%' as any }} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }} className="text-sm mt-2">{totalLearned} of {totalWords} words mastered</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="px-5 -mt-4">
        {stats.map((s) => {
          const color = CATEGORY_COLORS[s.cat] || '#6366F1';
          const emoji = CATEGORY_EMOJIS[s.cat] || '📖';

          return (
            <View
              key={s.cat}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
              className="p-4 mb-3"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#F1F5F9' }}>
                  <Text className="text-xl">{emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-[#1A1A2E] capitalize">{s.cat}</Text>
                  <Text className="text-sm" style={{ color: '#64748B' }}>{s.learned}/{s.total} words</Text>
                </View>
                <Text className="text-lg font-bold" style={{ color }}>{s.percent}%</Text>
              </View>
              <View className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <View className="h-full rounded-full" style={{ width: s.percent + '%' as any, backgroundColor: color }} />
              </View>
              <View className="flex-row gap-2 mt-3">
                <Link href={`/flashcards/${s.cat}`} asChild style={{ flex: 1 }}>
                  <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#F1F5F9' }}>
                    <Text className="text-sm font-semibold" style={{ color: '#475569' }}>🃏 Review</Text>
                  </TouchableOpacity>
                </Link>
                <Link href={`/quiz/${s.cat}`} asChild style={{ flex: 1 }}>
                  <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#EEF2FF' }}>
                    <Text className="text-sm font-semibold" style={{ color: '#6366F1' }}>✍️ Quiz</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default Progress;
