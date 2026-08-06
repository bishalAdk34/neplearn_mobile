import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, GUEST_ID, Word, shuffle } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { awardXp } from '../src/services/xp';
import { speak } from '../src/services/tts';
import { isSpellingMatch } from '../src/utils/spellingMatch';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticLight, hapticSuccess, hapticError } from '../src/utils/haptics';
import Confetti from '../src/components/Confetti';

const SESSION_SIZE = 10;

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
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const handleCheck = () => {
    if (!word || checked || input.trim().length === 0) return;
    const correct = isSpellingMatch(input, word.roman);
    setIsCorrect(correct);
    setChecked(true);
    useSrsStore.getState().recordResult(uid, word.id, correct, 'listening');
    if (correct) {
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
      setInput('');
      setChecked(false);
      setIsCorrect(false);
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

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-5">
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, ...shadows.card }} className="p-8 items-center mb-6">
            <Text style={{ color: colors.textSecondary }} className="text-sm font-semibold mb-5 uppercase tracking-wider">
              Listen and type in Roman
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
                  playAudio(0.5);
                }}
                disabled={isPlaying}
              >
                <Text className="text-lg">🐢</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textTertiary }} className="text-xs">Tap 🐢 for slow replay</Text>

            {checked && (
              <View style={{ backgroundColor: colors.mutedSurface, borderRadius: 12 }} className="w-full p-4 items-center mt-5">
                <Text className="text-brand text-2xl font-bold mb-1">{word.nepali}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-base">{word.roman}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">{word.english}</Text>
              </View>
            )}
          </View>

          <TextInput
            editable={!checked}
            value={input}
            onChangeText={setInput}
            placeholder="Type what you hear..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: checked ? (isCorrect ? colors.success : colors.danger) : colors.border,
            }}
            className="p-4 text-ink text-lg mb-3"
            onSubmitEditing={handleCheck}
          />

          {checked && (
            <View style={{ backgroundColor: isCorrect ? '#D1FAE5' : '#FEE2E2', borderRadius: 12 }} className="p-4">
              <Text style={{ color: isCorrect ? colors.successDark : colors.danger }} className="text-base font-bold">
                {isCorrect ? 'Correct!' : `Not quite — correct spelling: ${word.roman}`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-5 pb-8 pt-4" style={{ backgroundColor: colors.background }}>
        {!checked ? (
          <TouchableOpacity
            style={{ backgroundColor: input.trim().length > 0 ? colors.primary : colors.disabled }}
            className="py-4 rounded-xl items-center"
            disabled={input.trim().length === 0}
            onPress={handleCheck}
          >
            <Text className="text-white font-bold text-base">CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{ backgroundColor: isCorrect ? colors.success : colors.primary }}
            className="py-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold text-base">
              {currentIndex + 1 >= words.length ? 'FINISH' : 'CONTINUE'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ListenType;
