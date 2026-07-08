import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vocab, shuffle, useVocabStore, GUEST_ID } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { useSrsStore } from '../src/stores/srs';
import { speak } from '../src/services/tts';
import { awardXp } from '../src/services/xp';
import { colors } from '../src/theme';
import { ProgressBar } from '../src/components/ui';
import { hapticSuccess, hapticError } from '../src/utils/haptics';

const MorningVocab = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { learnWord, isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);

  useEffect(() => {
    if (isComplete && !xpAwarded) {
      setXpAwarded(true);
      hapticSuccess();
      const earned = score * 20;
      awardXp(uid, earned, 'lesson');
    }
  }, [isComplete]);

  const words = useMemo(() => shuffle(vocab).slice(0, 5), []);
  const currentWord = words[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = vocab.filter(w => w.id !== currentWord.id);
    return shuffle([currentWord, ...shuffle(others).slice(0, 3)]);
  }, [currentWord]);

  const progress = ((currentIndex) / words.length) * 100;

  const handleCheck = () => {
    if (selectedOption === null) return;
    const correct = selectedOption === currentWord.id;
    setIsCorrect(correct);
    setIsAnswerChecked(true);
    useSrsStore.getState().recordResult(uid, currentWord.id, correct, 'morning_vocab');
    if (correct) {
      hapticSuccess();
      if (!isLearned(uid, currentWord.id)) learnWord(uid, currentWord.id);
      setScore(prev => prev + 1);
      speak(currentWord.nepali, 'ne-NP');
    } else {
      hapticError();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5 bg-cream">
        <Text className="text-6xl mb-4 text-center" style={{ lineHeight: 72, paddingVertical: 4 }}>🌅</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Morning Vocab Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2">Score: {score}/{words.length}</Text>
        <Text className="text-brand text-sm font-semibold mb-6">+{score * 20} XP earned</Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={() => router.push('/')}
        >
          <Text className="text-white font-bold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentWord) return null;

  return (
    <View className="flex-1 bg-cream">
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar progress={progress / 100} height={8} color={colors.primary} trackColor={colors.border} />
        </View>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
          <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{words.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-6 items-center">
          <Text className="text-ink text-xl font-bold mb-2">Morning Vocab</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center">What does this mean?</Text>
        </View>

        <View className="px-5 mb-8 items-center">
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, borderWidth: 2, borderColor: isAnswerChecked ? (isCorrect ? colors.success : colors.danger) : colors.border }} className="p-6 w-full items-center shadow-sm">
            {currentWord.image?.startsWith('http') ? (
              <Image source={{ uri: currentWord.image }} className="w-32 h-32 rounded-xl mb-4" />
            ) : (
              <Text className="text-6xl mb-4 text-center" style={{ lineHeight: 72, paddingVertical: 4 }}>{currentWord.image || '📖'}</Text>
            )}
            <Text className="text-brand text-4xl font-bold mb-1">{currentWord.nepali}</Text>
            <Text style={{ color: colors.textSecondary }} className="text-lg">{currentWord.roman}</Text>
            <TouchableOpacity className="mt-4" onPress={() => speak(currentWord.nepali, 'ne-NP')}>
              <View style={{ backgroundColor: '#FEE2E2' }} className="w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-brand">🔊</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mb-6">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOption = opt.id === currentWord.id;
            let borderColor: string = colors.border;
            let bgColor: string = colors.surface;

            if (isAnswerChecked) {
              if (isCorrectOption) { borderColor = colors.success; bgColor = '#D1FAE5'; }
              else if (isSelected && !isCorrect) { borderColor = colors.danger; bgColor = '#FEE2E2'; }
            } else if (isSelected) {
              borderColor = colors.primary; bgColor = '#FEE2E2';
            }

            return (
              <TouchableOpacity
                key={opt.id}
                disabled={isAnswerChecked}
                style={{ backgroundColor: bgColor, borderRadius: 12, borderWidth: 2, borderColor }}
                className="p-4 mb-3 flex-row items-center"
                onPress={() => setSelectedOption(opt.id)}
              >
                <Text className="text-ink text-base font-semibold flex-1">{opt.english}</Text>
                {isAnswerChecked && isCorrectOption && <Text style={{ color: colors.success }} className="text-xl">✓</Text>}
                {isAnswerChecked && isSelected && !isCorrect && <Text style={{ color: colors.danger }} className="text-xl">✕</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3 bg-cream">
        {!isAnswerChecked ? (
          <>
            <TouchableOpacity style={{ backgroundColor: colors.mutedSurface }} className="flex-1 py-4 rounded-xl items-center" onPress={handleNext}>
              <Text style={{ color: colors.textSecondary }} className="font-bold">SKIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: selectedOption !== null ? colors.primary : colors.disabled }}
              className="flex-1 py-4 rounded-xl items-center"
              disabled={selectedOption === null}
              onPress={handleCheck}
            >
              <Text className="text-white font-bold">CHECK ANSWER</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={{ backgroundColor: isCorrect ? colors.success : colors.primary }} className="flex-1 py-4 rounded-xl items-center" onPress={handleNext}>
            <Text className="text-white font-bold">CONTINUE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MorningVocab;
