import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, shuffle, GUEST_ID, type Word } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { awardXp } from '../src/services/xp';
import { speak } from '../src/services/tts';
import { networkManager } from '../src/services/network';
import { isPronunciationMatch } from '../src/hooks/useSpeechRecognition';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticLight, hapticSuccess, hapticError } from '../src/utils/haptics';
import Confetti from '../src/components/Confetti';

const SESSION_SIZE = 10;
const SLOW_RATE = 0.5;

const ListenType = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;

  const [words] = useState<Word[]>(() => {
    const learnedIds = useVocabStore.getState().getLearned(uid);
    const pool = learnedIds.length >= SESSION_SIZE
      ? vocab.filter(w => learnedIds.includes(w.id))
      : vocab;
    return shuffle(pool).slice(0, SESSION_SIZE);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOffline] = useState(() => !networkManager.getIsConnected());
  const xpAwarded = useRef(false);

  const word = words[currentIndex];

  const playAudio = async (rate?: number) => {
    if (!word || isPlaying) return;
    setIsPlaying(true);
    await speak(word.nepali, 'ne-NP', rate !== undefined ? { rate } : undefined);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isComplete || !word) return;
    playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleSubmit = () => {
    if (submitted || !typed.trim() || !word) return;
    const isCorrect = isPronunciationMatch(typed, word.roman);
    setSubmitted(true);
    setCorrect(isCorrect);
    useSrsStore.getState().recordResult(uid, word.id, isCorrect, 'listening');
    if (isCorrect) {
      setScore(prev => prev + 1);
      hapticSuccess();
    } else {
      hapticError();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= words.length) {
      if (!xpAwarded.current) {
        xpAwarded.current = true;
        awardXp(uid, 20, 'listening');
      }
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setTyped('');
      setSubmitted(false);
      setCorrect(false);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Confetti active={true} />
        <Text style={{ fontSize: 72, lineHeight: 88 }} className="mb-6">⌨️</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Listen & Type Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2 text-center">
          You got {score} of {words.length} correct.
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

  if (!word) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader
        title="Listen & Type"
        backIcon="close"
        centered
        right={
          <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
            <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{words.length}</Text>
          </View>
        }
      />

      <View className="px-5 mb-4">
        <ProgressBar progress={currentIndex / words.length} />
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
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, ...shadows.card }} className="p-8 items-center mb-6">
            <Text style={{ color: colors.textSecondary }} className="text-sm font-semibold mb-5 uppercase tracking-wider">
              Spell what you hear (Roman)
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

            {submitted && (
              <View style={{ backgroundColor: colors.mutedSurface, borderRadius: 12 }} className="w-full p-4 items-center mt-5">
                <Text className="text-brand text-2xl font-bold mb-1">{word.nepali}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-base">{word.roman}</Text>
              </View>
            )}
          </View>

          <TextInput
            editable={!submitted}
            value={typed}
            onChangeText={setTyped}
            placeholder="Type the Roman spelling..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            style={{
              backgroundColor: submitted ? (correct ? '#D1FAE5' : '#FEE2E2') : colors.surface,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: submitted ? (correct ? colors.success : colors.danger) : colors.border,
            }}
            className="p-4 text-ink text-base font-semibold mb-3"
          />
        </View>
      </ScrollView>

      <View className="px-5 pb-8 pt-4" style={{ backgroundColor: colors.background }}>
        <TouchableOpacity
          style={{ backgroundColor: submitted ? colors.primary : (typed.trim() ? colors.primary : colors.surface), borderWidth: submitted || typed.trim() ? 0 : 2, borderColor: colors.border }}
          className="py-4 rounded-xl items-center"
          onPress={submitted ? handleNext : handleSubmit}
          disabled={!submitted && !typed.trim()}
        >
          <Text style={{ color: submitted || typed.trim() ? '#FFFFFF' : colors.textSecondary }} className="font-bold text-base">
            {submitted ? (currentIndex + 1 >= words.length ? 'Finish' : 'Continue') : 'Check'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ListenType;
