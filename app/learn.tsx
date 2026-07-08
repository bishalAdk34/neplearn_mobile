import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { categories, vocab, CATEGORY_META, GUEST_ID, getWordsByCategory } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { useMistakesStore } from '../src/stores/mistakes';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';

const Learn = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let words = vocab;

    if (selectedCategory) {
      words = words.filter(w => w.category === selectedCategory);
    }

    if (query) {
      words = words.filter(w =>
        w.english.toLowerCase().includes(query) ||
        w.nepali.includes(query) ||
        w.roman.toLowerCase().includes(query)
      );
    }

    return words;
  }, [searchQuery, selectedCategory]);

  const mistakesByUser = useMistakesStore(s => s.mistakesByUser);
  const mistakeCount = Object.values(mistakesByUser[uid] || {}).filter(m => !m.resolved).length;

  const categoryStats = categories.map(cat => {
    const words = getWordsByCategory(cat);
    const learned = words.filter(w => isLearned(uid, w.id)).length;
    const meta = CATEGORY_META[cat];
    return { cat, learned, total: words.length, emoji: meta.emoji, color: meta.color };
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Learn" />
        <View className="px-5 -mt-2 pb-4">
          <Text style={{ color: colors.textSecondary }} className="text-sm">{vocab.length} words across {categories.length} categories</Text>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }} className="flex-row items-center px-4 py-3">
            <Ionicons name="search" size={20} color={colors.textTertiary} style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-ink text-base"
              placeholder="Search words in English, Nepali, or Roman..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="ml-2">
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <View className="px-5 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5">
            <TouchableOpacity
              style={{
                backgroundColor: selectedCategory === null ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedCategory === null ? colors.primary : colors.border,
              }}
              className="px-4 py-2 rounded-full mr-2"
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={{ color: selectedCategory === null ? '#FFFFFF' : colors.ink }} className="text-sm font-semibold">
                All ({vocab.length})
              </Text>
            </TouchableOpacity>
            {categoryStats.map((s) => (
              <TouchableOpacity
                key={s.cat}
                style={{
                  backgroundColor: selectedCategory === s.cat ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: selectedCategory === s.cat ? colors.primary : colors.border,
                }}
                className="px-4 py-2 rounded-full mr-2 flex-row items-center"
                onPress={() => setSelectedCategory(selectedCategory === s.cat ? null : s.cat)}
              >
                <Text className="mr-1">{s.emoji}</Text>
                <Text style={{ color: selectedCategory === s.cat ? '#FFFFFF' : colors.ink }} className="text-sm font-semibold">
                  {s.cat} ({s.learned}/{s.total})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Word List or Category Cards */}
        {searchQuery || selectedCategory ? (
          /* Word List View */
          <View className="px-5">
            <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">{filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} found</Text>
            {filteredWords.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">🔍</Text>
                <Text style={{ color: colors.textSecondary }} className="text-base">No words found</Text>
              </View>
            ) : (
              filteredWords.map((word) => {
                const meta = CATEGORY_META[word.category as keyof typeof CATEGORY_META];
                const learned = isLearned(uid, word.id);
                return (
                  <View
                    key={word.id}
                    style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                    className="p-4 mb-2 flex-row items-center"
                  >
                    <View style={{ backgroundColor: meta.color + '15' }} className="w-12 h-12 rounded-xl items-center justify-center mr-3">
                      <Text className="text-xl">{meta.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-ink text-base font-bold mr-2">{word.english}</Text>
                        {learned && <Text style={{ color: colors.success }} className="text-xs">✓</Text>}
                      </View>
                      <Text className="text-brand text-lg">{word.nepali}</Text>
                      <Text style={{ color: colors.textTertiary }} className="text-sm">{word.roman}</Text>
                    </View>
                    <View style={{ backgroundColor: meta.color + '15' }} className="px-2 py-1 rounded-full">
                      <Text style={{ color: meta.color }} className="text-xs font-semibold capitalize">{word.category}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* Category Grid View */
          <View className="px-5">
            {/* Skills & Practice */}
            <Text className="text-ink text-base font-semibold mb-3">Skills & Practice</Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {[
                { href: '/grammar', emoji: '📐', label: 'Grammar', sub: 'Tips & rules' },
                { href: '/sentence-builder', emoji: '🧩', label: 'Sentences', sub: 'Build & fill' },
                { href: '/listening', emoji: '🎧', label: 'Listening', sub: 'Train your ear' },
                { href: '/practice-mistakes', emoji: '🎯', label: 'Mistakes', sub: mistakeCount > 0 ? `${mistakeCount} to fix` : 'None to fix' },
              ].map(item => (
                <Link key={item.href} href={item.href as any} asChild>
                  <TouchableOpacity
                    style={{ backgroundColor: colors.surface, borderRadius: 16, width: '48%', ...shadows.card }}
                    className="p-4"
                  >
                    <Text className="text-2xl mb-2">{item.emoji}</Text>
                    <Text className="text-ink text-sm font-bold mb-0.5">{item.label}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">{item.sub}</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>

            <Text className="text-ink text-base font-semibold mb-3">Browse by Category</Text>
            {categoryStats.map((s) => (
              <View
                key={s.cat}
                style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }}
                className="p-4 mb-3"
              >
                <View className="flex-row items-center mb-3">
                  <View style={{ backgroundColor: s.color + '15' }} className="w-12 h-12 rounded-xl items-center justify-center mr-3">
                    <Text className="text-2xl">{s.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-lg font-bold capitalize">{s.cat}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-sm">{s.learned}/{s.total} words learned</Text>
                  </View>
                  <Text className="text-lg font-bold" style={{ color: s.color }}>{Math.round((s.learned / s.total) * 100)}%</Text>
                </View>
                <ProgressBar progress={s.learned / s.total} color={s.color} style={{ marginBottom: 12 }} />
                <View className="flex-row gap-2">
                  <Link href={`/flashcards/${s.cat}`} asChild style={{ flex: 1 }}>
                    <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: colors.mutedSurface }}>
                      <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>🃏 Flashcards</Text>
                    </TouchableOpacity>
                  </Link>
                  <Link href={`/quiz/${s.cat}`} asChild style={{ flex: 1 }}>
                    <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#EEF2FF' }}>
                      <Text className="text-sm font-semibold" style={{ color: colors.accent }}>✍️ Quiz</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeTab="learn" />
    </View>
  );
};

export default Learn;
