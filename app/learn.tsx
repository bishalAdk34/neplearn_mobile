import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { categories, vocab, CATEGORY_META, GUEST_ID, getWordsByCategory } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';

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

  const categoryStats = categories.map(cat => {
    const words = getWordsByCategory(cat);
    const learned = words.filter(w => isLearned(uid, w.id)).length;
    const meta = CATEGORY_META[cat];
    return { cat, learned, total: words.length, emoji: meta.emoji, color: meta.color };
  });

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-12 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#4A1942" />
            </TouchableOpacity>
            <Text className="text-[#4A1942] text-2xl font-bold">Learn</Text>
          </View>
          <Text className="text-[#6B7280] text-sm">{vocab.length} words across {categories.length} categories</Text>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5D5D0' }} className="flex-row items-center px-4 py-3">
            <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-[#4A1942] text-base"
              placeholder="Search words in English, Nepali, or Roman..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="ml-2">
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <View className="px-5 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5">
            <TouchableOpacity
              style={{
                backgroundColor: selectedCategory === null ? '#800816' : '#FFFFFF',
                borderWidth: 1,
                borderColor: selectedCategory === null ? '#800816' : '#E5D5D0',
              }}
              className="px-4 py-2 rounded-full mr-2"
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={{ color: selectedCategory === null ? '#FFFFFF' : '#4A1942' }} className="text-sm font-semibold">
                All ({vocab.length})
              </Text>
            </TouchableOpacity>
            {categoryStats.map((s) => (
              <TouchableOpacity
                key={s.cat}
                style={{
                  backgroundColor: selectedCategory === s.cat ? '#800816' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: selectedCategory === s.cat ? '#800816' : '#E5D5D0',
                }}
                className="px-4 py-2 rounded-full mr-2 flex-row items-center"
                onPress={() => setSelectedCategory(selectedCategory === s.cat ? null : s.cat)}
              >
                <Text className="mr-1">{s.emoji}</Text>
                <Text style={{ color: selectedCategory === s.cat ? '#FFFFFF' : '#4A1942' }} className="text-sm font-semibold">
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
            <Text className="text-[#6B7280] text-sm mb-3">{filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} found</Text>
            {filteredWords.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">🔍</Text>
                <Text className="text-[#6B7280] text-base">No words found</Text>
              </View>
            ) : (
              filteredWords.map((word) => {
                const meta = CATEGORY_META[word.category];
                const learned = isLearned(uid, word.id);
                return (
                  <View
                    key={word.id}
                    style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5D5D0' }}
                    className="p-4 mb-2 flex-row items-center"
                  >
                    <View style={{ backgroundColor: meta.color + '15' }} className="w-12 h-12 rounded-xl items-center justify-center mr-3">
                      <Text className="text-xl">{meta.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-[#4A1942] text-base font-bold mr-2">{word.english}</Text>
                        {learned && <Text className="text-[#10B981] text-xs">✓</Text>}
                      </View>
                      <Text className="text-[#800816] text-lg">{word.nepali}</Text>
                      <Text className="text-[#9CA3AF] text-sm">{word.roman}</Text>
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
            <Text className="text-[#4A1942] text-base font-semibold mb-3">Browse by Category</Text>
            {categoryStats.map((s) => (
              <View
                key={s.cat}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
                className="p-4 mb-3"
              >
                <View className="flex-row items-center mb-3">
                  <View style={{ backgroundColor: s.color + '15' }} className="w-12 h-12 rounded-xl items-center justify-center mr-3">
                    <Text className="text-2xl">{s.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#4A1942] text-lg font-bold capitalize">{s.cat}</Text>
                    <Text className="text-[#6B7280] text-sm">{s.learned}/{s.total} words learned</Text>
                  </View>
                  <Text className="text-lg font-bold" style={{ color: s.color }}>{Math.round((s.learned / s.total) * 100)}%</Text>
                </View>
                <View className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
                  <View className="h-full rounded-full" style={{ width: (s.learned / s.total * 100) + '%' as any, backgroundColor: s.color }} />
                </View>
                <View className="flex-row gap-2">
                  <Link href={`/flashcards/${s.cat}`} asChild style={{ flex: 1 }}>
                    <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#F1F5F9' }}>
                      <Text className="text-sm font-semibold" style={{ color: '#475569' }}>🃏 Flashcards</Text>
                    </TouchableOpacity>
                  </Link>
                  <Link href={`/quiz/${s.cat}`} asChild style={{ flex: 1 }}>
                    <TouchableOpacity className="py-2.5 rounded-xl items-center" style={{ backgroundColor: '#EEF2FF' }}>
                      <Text className="text-sm font-semibold" style={{ color: '#6366F1' }}>✍️ Quiz</Text>
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
