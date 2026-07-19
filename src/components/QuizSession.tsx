import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { speak } from '../services/tts';
import { colors } from '../theme';
import { ProgressBar } from './ui';
import { hapticSuccess, hapticError } from '../utils/haptics';
import { useSrsStore } from '../stores/srs';
import type { MistakeSource } from '../stores/mistakes';
import { awardXp } from '../services/xp';
import Confetti from './Confetti';
import type { XpSource } from '../services/db';
import { buildQuestions, type QuizQuestion } from '../utils/quizBuilder';
import type { Word } from '../data/vocab';

type Props = {
  uid: string;
  words: Word[];
  count?: number;
  title: string;
  completeEmoji?: string;
  srsSource: MistakeSource;
  xpAmount: number;
  xpSource: XpSource;
};

/**
 * Reusable multiple-choice session: shows English, pick Nepali.
 * Records SRS results per answer and awards XP once on completion.
 */
export const QuizSession = ({
  uid,
  words,
  count = 10,
  title,
  completeEmoji = '🎉',
  srsSource,
  xpAmount,
  xpSource,
}: Props) => {
  const router = useRouter();
  const [questions] = useState<QuizQuestion[]>(() => buildQuestions(words, count));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const q = questions[currentIndex];

  const selectAnswer = (opt: string) => {
    if (selected || !q) return;
    setSelected(opt);
    const correct = opt === q.nepali;
    useSrsStore.getState().recordResult(uid, q.id, correct, srsSource);
    if (correct) {
      hapticSuccess();
      setScore((s) => s + 1);
      speak(q.nepali, 'ne-NP');
    } else {
      hapticError();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      if (!xpAwarded) {
        setXpAwarded(true);
        awardXp(uid, xpAmount, xpSource);
      }
      setIsComplete(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5 bg-cream">
        <Confetti active={true} />
        <Text className="text-6xl mb-4 text-center" style={{ lineHeight: 72, paddingVertical: 4 }}>{completeEmoji}</Text>
        <Text className="text-ink text-2xl font-bold mb-2">{title} Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2">You got {score}/{questions.length} correct</Text>
        <Text className="text-brand text-sm font-semibold mb-6">+{xpAmount} XP earned</Text>
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

  const progress = currentIndex / questions.length;

  return (
    <View className="flex-1 bg-cream">
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar progress={progress} height={8} color={colors.primary} trackColor={colors.border} />
        </View>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
          <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{questions.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-6 items-center">
          <Text className="text-ink text-xl font-bold mb-2">{title}</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center">Choose the correct Nepali translation</Text>
        </View>

        <View className="px-5 mb-8 items-center">
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, borderWidth: 2, borderColor: colors.border }} className="p-6 w-full items-center shadow-sm">
            <Text className="text-5xl mb-4 text-center" style={{ lineHeight: 60, paddingVertical: 4 }}>{q.image?.startsWith('http') ? '💡' : q.image || '💡'}</Text>
            <Text className="text-ink text-3xl font-bold mb-1">{q.english}</Text>
          </View>
        </View>

        <View className="px-5 mb-6">
          {q.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrectOption = opt === q.nepali;
            let borderColor: string = colors.border;
            let bgColor: string = colors.surface;

            if (selected) {
              if (isCorrectOption) { borderColor = colors.success; bgColor = '#D1FAE5'; }
              else if (isSelected) { borderColor = colors.danger; bgColor = '#FEE2E2'; }
            }

            return (
              <TouchableOpacity
                key={opt}
                disabled={!!selected}
                style={{ backgroundColor: bgColor, borderRadius: 12, borderWidth: 2, borderColor }}
                className="p-4 mb-3 flex-row items-center"
                onPress={() => selectAnswer(opt)}
              >
                <Text className="text-ink text-base font-semibold flex-1">{opt}</Text>
                {selected && isCorrectOption && <Text style={{ color: colors.success }} className="text-xl">✓</Text>}
                {selected && isSelected && !isCorrectOption && <Text style={{ color: colors.danger }} className="text-xl">✕</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3 bg-cream">
        {selected ? (
          <TouchableOpacity
            style={{ backgroundColor: selected === q.nepali ? colors.success : colors.primary }}
            className="flex-1 py-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold">CONTINUE</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={{ backgroundColor: colors.mutedSurface }} className="flex-1 py-4 rounded-xl items-center" onPress={handleNext}>
            <Text style={{ color: colors.textSecondary }} className="font-bold">SKIP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
