import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { QuickActionsModal } from '@/src/components/QuickActionsModal';
import { categories, vocab, CATEGORY_META, GUEST_ID, getWordsByCategory, Word } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { getPrioritizedCategories } from '../src/data/personalization';
import { useAuthStore } from '../src/stores/auth';
import { useMistakesStore } from '../src/stores/mistakes';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';


function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const wordsByCategory: Record<string, typeof vocab> = {};
for (const word of vocab) {
  if (!wordsByCategory[word.category]) wordsByCategory[word.category] = [];
  wordsByCategory[word.category].push(word);
}

const Learn = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isLearned = useVocabStore(s => s.isLearned);
  const learningGoal = useVocabStore(s => s.learningGoal);
  const learningLevel = useVocabStore(s => s.learningLevel);
  const learnedByUser = useVocabStore(s => s.learnedByUser);
  const uid = user?.id || GUEST_ID;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 250);

  const isFiltering = debouncedSearch.trim().length > 0 || selectedCategory !== null;

  const filteredWords = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
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
  }, [debouncedSearch, selectedCategory]);

  const mistakesByUser = useMistakesStore(s => s.mistakesByUser);
  const mistakeCount = useMemo(() =>
    Object.values(mistakesByUser[uid] || {}).filter(m => !m.resolved).length,
  [mistakesByUser, uid]);

  const categoryStats = useMemo(() => {
    return getPrioritizedCategories(learningGoal, learningLevel).map(cat => {
      const words = wordsByCategory[cat];
      const learned = words.filter(w => isLearned(uid, w.id)).length;
      const meta = CATEGORY_META[cat];
      return { cat, learned, total: words.length, emoji: meta.emoji, color: meta.color };
    });
  }, [learningGoal, learningLevel, uid, learnedByUser]);

  type CategoryStat = (typeof categoryStats)[number];
  type ListRow =
    | { key: 'filterCount' }
    | { key: 'skillsAndBrowseTitle' }
    | { key: 'empty' }
    | { key: `word-${number}`; word: Word }
    | { key: `cat-${string}`; stat: CategoryStat; index: number };

  const rows = useMemo<ListRow[]>(() => {
    if (isFiltering) {
      const base: ListRow[] = [{ key: 'filterCount' }];
      if (filteredWords.length === 0) return [...base, { key: 'empty' }];
      return [...base, ...filteredWords.map(word => ({ key: `word-${word.id}` as const, word }))];
    }
    return [
      { key: 'skillsAndBrowseTitle' },
      ...categoryStats.map((stat, index) => ({ key: `cat-${stat.cat}` as const, stat, index })),
    ];
  }, [isFiltering, filteredWords, categoryStats]);

  const renderRow = useCallback(({ item }: { item: ListRow }) => {
    switch (item.key) {
      case 'filterCount':
        return (
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-3 px-5">
            {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} found
          </Text>
        );

      case 'skillsAndBrowseTitle':
        return (
          <View className="px-5">
            <Text className="text-ink text-base font-semibold mb-3">Skills & Practice</Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {[
                { href: '/grammar', emoji: '📐', label: 'Grammar', sub: 'Tips & rules' },
                { href: '/sentence-builder', emoji: '🧩', label: 'Sentences', sub: 'Build & fill' },
                { href: '/listening', emoji: '🎧', label: 'Listening', sub: 'Train your ear' },
                { href: '/practice-mistakes', emoji: '🎯', label: 'Mistakes', sub: mistakeCount > 0 ? `${mistakeCount} to fix` : 'None to fix' },
                { href: '/story', emoji: '📖', label: 'Stories', sub: 'Read & understand' },
                { href: '/culture', emoji: '🪔', label: 'Culture', sub: 'Customs & festivals' },
                { href: '/roleplay', emoji: '🎭', label: 'Roleplay', sub: 'Practice scenarios' },
                { href: '/photo-vocab', emoji: '📷', label: 'Photo Vocab', sub: 'Snap & learn' },
              ].map(skill => (
                <Link key={skill.href} href={skill.href as any} asChild>
                  <TouchableOpacity
                    style={{ backgroundColor: colors.surface, borderRadius: 16, width: '48%', ...shadows.card }}
                    className="p-4"
                  >
                    <Text className="text-2xl mb-2">{skill.emoji}</Text>
                    <Text className="text-ink text-sm font-bold mb-0.5">{skill.label}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs">{skill.sub}</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>

            <Text className="text-ink text-base font-semibold mb-3">Browse by Category</Text>
          </View>
        );

      case 'empty':
        return (
          <View className="items-center py-16">
            <Text className="text-5xl pt-3">🔍</Text>
            <Text className="text-ink text-base font-semibold mb-1">No words found</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">Try a different search or category</Text>
          </View>
        );

      default: {
        if ('word' in item) {
          const word = item.word;
          const meta = CATEGORY_META[word.category as keyof typeof CATEGORY_META];
          const learned = isLearned(uid, word.id);
          return (
            <View
              style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }}
              className="p-4 mb-3 mx-5"
            >
              <View className="flex-row items-center">
                <View style={{ backgroundColor: meta.color + '12' }} className="w-14 h-14 rounded-2xl items-center justify-center mr-4">
                  <Text className="text-2xl">{meta.emoji}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-0.5">
                    <Text className="text-ink text-lg font-bold">{word.english}</Text>
                    {learned && (
                      <View style={{ backgroundColor: colors.success + '18' }} className="px-1.5 py-0.5 rounded-full ml-2">
                        <Text style={{ color: colors.success }} className="text-xs font-semibold">Learned</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: colors.primary }} className="text-lg font-semibold">{word.nepali}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm">{word.roman}</Text>
                </View>
                <View style={{ backgroundColor: meta.color + '12' }} className="px-2.5 py-1 rounded-full">
                  <Text style={{ color: meta.color }} className="text-xs font-semibold capitalize">{word.category}</Text>
                </View>
              </View>
            </View>
          );
        }

        const { stat: s, index } = item;
        return (
          <View
            style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }}
            className="p-4 mb-3 mx-5"
          >
            <View className="flex-row items-center mb-3">
              <View style={{ backgroundColor: s.color + '15' }} className="w-12 h-12 rounded-xl items-center justify-center mr-3">
                <Text className="text-2xl">{s.emoji}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-ink text-lg font-bold capitalize">{s.cat}</Text>
                  {learningGoal !== null && index < 3 && (
                    <View style={{ backgroundColor: colors.primary + '15' }} className="px-2 py-0.5 rounded-full ml-2">
                      <Text style={{ color: colors.primary }} className="text-xs font-semibold">Recommended</Text>
                    </View>
                  )}
                </View>
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
              <Link href={`/quiz/${s.cat}?mode=reverse`} asChild style={{ flex: 1 }}>
                <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#FEF3C7' }}>
                  <Text className="text-sm font-semibold" style={{ color: colors.warmInk }}>🔁 Reverse</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        );
      }
    }
  }, [uid, isLearned, learningGoal, searchQuery, selectedCategory, categoryStats, filteredWords, mistakeCount]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Fixed header — does not scroll */}
      <ScreenHeader title="Learn" />
      <View className="px-5 -mt-2 pb-3">
        <Text style={{ color: colors.textSecondary }} className="text-sm">{vocab.length} words across {categories.length} categories</Text>
      </View>

      <View className="px-5 pb-3">
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border }} className="flex-row items-center px-4 py-1">
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

      <View className="pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row px-5">
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

      {/* Scrollable content starts from Skills & Practice */}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        data={rows}
        keyExtractor={row => row.key}
        renderItem={renderRow}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab="learn" onCenterPress={() => setQuickActionsVisible(true)} />

      <QuickActionsModal visible={quickActionsVisible} onClose={() => setQuickActionsVisible(false)} />
    </View>
  );
};

export default Learn;
