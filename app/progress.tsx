import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import { categories, vocab, GUEST_ID, CATEGORY_META } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { colors } from '../src/theme';
import { ProgressBar } from '../src/components/ui';

const Progress = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-brand px-6 pb-8" style={{ paddingTop: insets.top + 8, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="p-2 rounded-xl mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
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
        <View className="p-6 items-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24 }}>
          <Text className="text-5xl font-bold text-white mb-1">{overallPercent}%</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }} className="text-lg">Overall Progress</Text>
          <ProgressBar
            progress={overallPercent / 100}
            height={8}
            color={colors.surface}
            trackColor="rgba(255,255,255,0.3)"
            style={{ width: '100%', marginTop: 12 }}
          />
          <Text style={{ color: 'rgba(255,255,255,0.8)' }} className="text-sm mt-2">{totalLearned} of {totalWords} words mastered</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="px-5 -mt-4">
        {stats.map((s) => {
          const meta = CATEGORY_META[s.cat];
          const color = meta.color;
          const emoji = meta.emoji;

          return (
            <View
              key={s.cat}
              className="bg-white p-4 mb-3"
              style={{
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
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
              <ProgressBar
                progress={s.percent / 100}
                height={8}
                color={color}
                trackColor="#F1F5F9"
              />
              <View className="flex-row gap-2 mt-3">
                <Link href={`/flashcards/${s.cat}`} asChild style={{ flex: 1 }}>
                  <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#F1F5F9' }}>
                    <Text className="text-sm font-semibold" style={{ color: '#475569' }}>🃏 Review</Text>
                  </TouchableOpacity>
                </Link>
                <Link href={`/quiz/${s.cat}`} asChild style={{ flex: 1 }}>
                  <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#EEF2FF' }}>
                    <Text className="text-sm font-semibold" style={{ color: colors.accent }}>✍️ Quiz</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          );
        })}
      </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default Progress;
