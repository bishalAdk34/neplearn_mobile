import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, GUEST_ID } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { useStatsStore } from '../src/stores/stats';
import { buildEnglishOptionQuestions, EnglishQuizQuestion } from '../src/utils/quizBuilder';
import { awardXp } from '../src/services/xp';
import { speak } from '../src/services/tts';
import { networkManager } from '../src/services/network';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticLight, hapticSuccess, hapticError } from '../src/utils/haptics';

const SESSION_SIZE = 10;
const SLOW_RATE = 0.5;

const Listening = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;

  const [questions] = useState<EnglishQuizQuestion[]>(() => {
    const learnedIds = useVocabStore.getState().getLearned(uid);
    const pool = learnedIds.length >= SESSION_SIZE
      ? vocab.filter(w => learnedIds.includes(w.id))
      : vocab;
    return buildEnglishOptionQuestions(pool, SESSION_SIZE);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOffline] = useState(() => !networkManager.getIsConnected());
  const xpAwarded = useRef(false);

  const q = questions[currentIndex];

  const playAudio = async (rate?: number) => {
    if (!q || isPlaying) return;
    setIsPlaying(true);
    await speak(q.nepali, 'ne-NP', rate !== undefined ? { rate } : undefined);
    setIsPlaying(false);
  };

  // Auto-play each new question
  useEffect(() => {
    if (isComplete || !q) return;
    playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const selectAnswer = (option: string) => {
    if (selected || !q) return;
    const correct = option === q.english;
    setSelected(option);
    useSrsStore.getState().recordResult(uid, q.id, correct, 'listening');
    if (correct) {
      setScore(prev => prev + 1);
      hapticSuccess();
    } else {
      hapticError();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      if (!xpAwarded.current) {
        xpAwarded.current = true;
        awardXp(uid, 20, 'listening');
        useStatsStore.getState().incrementListening(uid);
      }
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Text className="text-6xl mb-4">🎧</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Listening Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2 text-center">
          You got {score} of {questions.length} correct.
        </Text>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-4 py-2 rounded-full mb-6">
          <Text style={{ color: colors.warmInk }} className="font-bold">+20 XP</Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!q) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader
        title="Listening"
        backIcon="close"
        centered
        right={
          <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
            <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{questions.length}</Text>
          </View>
        }
      />

      <View className="px-5 mb-4">
        <ProgressBar progress={currentIndex / questions.length} />
      </View>

      {isOffline && (
        <View style={{ backgroundColor: colors.warmSurface, borderRadius: 12 }} className="mx-5 mb-4 p-3 flex-row items-center">
          <Ionicons name="cloud-offline-outline" size={18} color={colors.warmInk} />
          <Text style={{ color: colors.warmInk }} className="text-sm ml-2 flex-1">
            You're offline. Audio may not play if your device has no Nepali voice installed.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="px-5">
          {/* Audio card — no text until answered */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, ...shadows.card }} className="p-8 items-center mb-6">
            <Text style={{ color: colors.textSecondary }} className="text-sm font-semibold mb-5 uppercase tracking-wider">
              What do you hear?
            </Text>
            <View className="flex-row items-center mb-2">
              <TouchableOpacity
                style={{ backgroundColor: isPlaying ? colors.disabled : colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
                className="w-20 h-20 rounded-full items-center justify-center mr-4"
                onPress={() => {
                  hapticLight();
                  playAudio();
                }}
                disabled={isPlaying}
              >
                <Ionicons name="volume-high" size={36} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary }}
                className="w-14 h-14 rounded-full items-center justify-center"
                onPress={() => {
                  hapticLight();
                  playAudio(SLOW_RATE);
                }}
                disabled={isPlaying}
              >
                <Text className="text-lg">🐢</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textTertiary }} className="text-xs">Tap 🐢 for slow replay</Text>

            {selected && (
              <View style={{ backgroundColor: colors.mutedSurface, borderRadius: 12 }} className="w-full p-4 items-center mt-5">
                <Text className="text-brand text-2xl font-bold mb-1">{q.nepali}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-base">{q.roman}</Text>
              </View>
            )}
          </View>

          {/* English options */}
          {q.options.map(option => {
            const isSelected = selected === option;
            const isCorrectOption = option === q.english;
            let borderColor: string = colors.border;
            let bgColor: string = colors.surface;
            if (selected) {
              if (isCorrectOption) { borderColor = colors.success; bgColor = '#D1FAE5'; }
              else if (isSelected) { borderColor = colors.danger; bgColor = '#FEE2E2'; }
            }
            return (
              <TouchableOpacity
                key={option}
                disabled={!!selected}
                style={{ backgroundColor: bgColor, borderRadius: 12, borderWidth: 2, borderColor }}
                className="p-4 mb-3"
                onPress={() => selectAnswer(option)}
              >
                <Text className="text-ink text-base font-semibold">{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 pb-8 pt-4" style={{ backgroundColor: colors.background }}>
        <TouchableOpacity
          style={{ backgroundColor: selected ? colors.primary : colors.surface, borderWidth: selected ? 0 : 2, borderColor: colors.border }}
          className="py-4 rounded-xl items-center"
          onPress={selected ? handleNext : () => { setSelected('__skipped__'); }}
        >
          <Text style={{ color: selected ? '#FFFFFF' : colors.textSecondary }} className="font-bold text-base">
            {selected ? (currentIndex + 1 >= questions.length ? 'Finish' : 'Continue') : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Listening;
