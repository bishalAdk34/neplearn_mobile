import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PHRASE_CATEGORIES, getPhrasesByCategory } from '../src/data/phrases';
import { shuffle } from '../src/data/vocab';
import { speak } from '../src/services/tts';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticLight } from '../src/utils/haptics';

const PracticePhrases = () => {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const sessionPhrases = useMemo(
    () => shuffle(getPhrasesByCategory(category)).slice(0, 8),
    [category]
  );
  const current = sessionPhrases[currentIndex];

  const activeCategory = PHRASE_CATEGORIES.find(c => c.key === (current?.category ?? category));

  const selectCategory = (key: string) => {
    if (key === category) return;
    hapticLight();
    setCategory(key);
    setCurrentIndex(0);
    setIsComplete(false);
  };

  const handlePlay = async () => {
    if (!current) return;
    setIsPlaying(true);
    await speak(current.nepali, 'ne-NP');
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= sessionPhrases.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Practice Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-6 text-center">
          You've reviewed {sessionPhrases.length} phrases. Great job!
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center mb-3"
          onPress={() => {
            setCurrentIndex(0);
            setIsComplete(false);
          }}
        >
          <Text className="text-white font-bold text-lg">Practice Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.primary }} className="font-bold text-lg">Back to Learn</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader
        title="Practice Phrases"
        backIcon="close"
        centered
        right={
          <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
            <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{sessionPhrases.length}</Text>
          </View>
        }
      />

      {/* Category chips */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {PHRASE_CATEGORIES.map(cat => {
            const active = cat.key === category;
            return (
              <TouchableOpacity
                key={cat.key}
                style={{
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
                className="px-4 py-2 rounded-full flex-row items-center"
                onPress={() => selectCategory(cat.key)}
              >
                <Text className="text-sm mr-1">{cat.emoji}</Text>
                <Text style={{ color: active ? '#FFFFFF' : colors.textSecondary }} className="text-sm font-semibold">
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View className="px-5 mb-4">
        <ProgressBar progress={sessionPhrases.length ? currentIndex / sessionPhrases.length : 0} />
      </View>

      {current ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 mb-8 items-center">
            <View style={{ backgroundColor: '#FEE2E2' }} className="self-start px-3 py-1 rounded-full mb-6">
              <Text className="text-brand text-xs font-bold uppercase">
                {activeCategory ? `${activeCategory.emoji} ${activeCategory.label}` : 'Phrases'}
              </Text>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 24, ...shadows.card }} className="p-8 w-full items-center">
              <TouchableOpacity
                style={{ backgroundColor: isPlaying ? colors.disabled : colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
                className="w-16 h-16 rounded-full items-center justify-center mb-6"
                onPress={handlePlay}
                disabled={isPlaying}
              >
                <Ionicons name={isPlaying ? 'pause' : 'volume-high'} size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <Text className="text-brand text-3xl font-bold mb-3 text-center">{current.nepali}</Text>
              <Text style={{ color: colors.textSecondary }} className="text-lg mb-6">{current.roman}</Text>

              <View style={{ backgroundColor: colors.mutedSurface, borderRadius: 12 }} className="w-full p-4 items-center">
                <Text className="text-ink text-base font-semibold">"{current.english}"</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1" />
      )}

      <View className="flex-row px-5 pb-8 pt-4 gap-3" style={{ backgroundColor: colors.background }}>
        <TouchableOpacity
          style={{ backgroundColor: currentIndex === 0 ? colors.border : colors.surface, borderWidth: 2, borderColor: colors.primary, opacity: currentIndex === 0 ? 0.5 : 1 }}
          className="flex-1 py-4 rounded-xl items-center"
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={{ color: currentIndex === 0 ? colors.textTertiary : colors.primary }} className="font-bold">Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary }}
          className="flex-1 py-4 rounded-xl items-center"
          onPress={handleNext}
        >
          <Text className="text-white font-bold">{currentIndex + 1 >= sessionPhrases.length ? 'Complete' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PracticePhrases;
