import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { useStatsStore } from '../src/stores/stats';
import { GUEST_ID, shuffle } from '../src/data/vocab';
import { sentenceExercises, fillBlankExercises, type SentenceExercise, type FillBlankExercise } from '../src/data/sentences';
import { speak } from '../src/services/tts';
import { awardXp } from '../src/services/xp';
import { colors } from '../src/theme';
import { ProgressBar } from '../src/components/ui';
import { hapticSuccess, hapticError, hapticLight } from '../src/utils/haptics';

type SessionItem =
  | { type: 'order'; ex: SentenceExercise }
  | { type: 'blank'; ex: FillBlankExercise };

const SESSION_SIZE = 5;

const SentenceBuilder = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;

  const session = useMemo<SessionItem[]>(() => {
    const orders = shuffle(sentenceExercises).slice(0, 3).map(ex => ({ type: 'order' as const, ex }));
    const blanks = shuffle(fillBlankExercises).slice(0, 2).map(ex => ({ type: 'blank' as const, ex }));
    return shuffle([...orders, ...blanks]).slice(0, SESSION_SIZE);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const item = session[currentIndex];

  const bank = useMemo(() => {
    if (!item || item.type !== 'order') return [];
    return shuffle([...item.ex.tokens, ...item.ex.distractors]);
  }, [item]);

  const addToken = (token: string, bankIndex: number) => {
    if (checked) return;
    hapticLight();
    setPicked(prev => [...prev, `${bankIndex}:${token}`]);
  };

  const removeToken = (pickedIndex: number) => {
    if (checked) return;
    hapticLight();
    setPicked(prev => prev.filter((_, i) => i !== pickedIndex));
  };

  const pickedTokens = picked.map(p => p.slice(p.indexOf(':') + 1));
  const usedBankIndexes = new Set(picked.map(p => Number(p.slice(0, p.indexOf(':')))));

  const canCheck =
    item?.type === 'order'
      ? pickedTokens.length === item.ex.tokens.length
      : selectedOption !== null;

  const handleCheck = () => {
    if (!item || !canCheck || checked) return;
    let correct = false;
    if (item.type === 'order') {
      correct = pickedTokens.join(' ') === item.ex.tokens.join(' ');
      speak(item.ex.tokens.join(' '), 'ne-NP');
    } else {
      correct = selectedOption === item.ex.answer;
      speak(item.ex.nepaliParts[0] + item.ex.answer + item.ex.nepaliParts[1], 'ne-NP');
    }
    setIsCorrect(correct);
    setChecked(true);
    if (correct) {
      hapticSuccess();
      setScore(s => s + 1);
    } else {
      hapticError();
    }
    useStatsStore.getState().incrementSentences(uid);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= session.length) {
      if (!xpAwarded) {
        setXpAwarded(true);
        awardXp(uid, 15, 'sentence');
      }
      setIsComplete(true);
    } else {
      setCurrentIndex(i => i + 1);
      setPicked([]);
      setSelectedOption(null);
      setChecked(false);
      setIsCorrect(false);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5 bg-cream">
        <Text className="text-6xl mb-4 text-center" style={{ lineHeight: 72, paddingVertical: 4 }}>🧩</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Sentences Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2">You got {score}/{session.length} correct</Text>
        <Text className="text-brand text-sm font-semibold mb-6">+15 XP earned</Text>
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

  if (!item) return null;

  return (
    <View className="flex-1 bg-cream">
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar progress={currentIndex / session.length} height={8} color={colors.primary} trackColor={colors.border} />
        </View>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
          <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{session.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-6 items-center">
          <Text className="text-ink text-xl font-bold mb-2">Sentence Builder</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center">
            {item.type === 'order' ? 'Tap the words in the correct order' : 'Fill in the blank'}
          </Text>
        </View>

        {/* Prompt */}
        <View className="px-5 mb-6">
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border }} className="p-5 items-center">
            <Text className="text-ink text-xl font-bold text-center">
              {item.type === 'order' ? item.ex.english : item.ex.english}
            </Text>
          </View>
        </View>

        {item.type === 'order' ? (
          <>
            {/* Answer area */}
            <View className="px-5 mb-6">
              <View
                style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: checked ? (isCorrect ? colors.success : colors.danger) : colors.border, minHeight: 72 }}
                className="p-3 flex-row flex-wrap items-center"
              >
                {pickedTokens.length === 0 && (
                  <Text style={{ color: colors.textTertiary }} className="text-sm px-2">Tap words below to build the sentence</Text>
                )}
                {pickedTokens.map((token, i) => (
                  <TouchableOpacity
                    key={`${picked[i]}-${i}`}
                    style={{ backgroundColor: '#FEE2E2', borderRadius: 10 }}
                    className="px-3 py-2 m-1"
                    onPress={() => removeToken(i)}
                    disabled={checked}
                  >
                    <Text className="text-brand text-lg font-semibold">{token}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Word bank */}
            <View className="px-5 mb-6 flex-row flex-wrap justify-center">
              {bank.map((token, i) => {
                const used = usedBankIndexes.has(i);
                return (
                  <TouchableOpacity
                    key={`${token}-${i}`}
                    style={{
                      backgroundColor: used ? colors.mutedSurface : colors.surface,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: used ? 0.4 : 1,
                    }}
                    className="px-4 py-2.5 m-1"
                    onPress={() => addToken(token, i)}
                    disabled={used || checked}
                  >
                    <Text className="text-ink text-lg font-semibold">{token}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {/* Fill-blank sentence */}
            <View className="px-5 mb-6">
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border }} className="p-5 items-center">
                <Text className="text-brand text-2xl font-bold text-center">
                  {item.ex.nepaliParts[0]}
                  <Text style={{ color: checked ? (isCorrect ? colors.success : colors.danger) : colors.accent }}>
                    {selectedOption ?? '____'}
                  </Text>
                  {item.ex.nepaliParts[1]}
                </Text>
              </View>
            </View>

            {/* Options */}
            <View className="px-5 mb-6">
              {item.ex.options.map((opt) => {
                const isSelected = selectedOption === opt;
                const isAnswer = opt === item.ex.answer;
                let borderColor: string = colors.border;
                let bgColor: string = colors.surface;
                if (checked) {
                  if (isAnswer) { borderColor = colors.success; bgColor = '#D1FAE5'; }
                  else if (isSelected) { borderColor = colors.danger; bgColor = '#FEE2E2'; }
                } else if (isSelected) {
                  borderColor = colors.primary; bgColor = '#FEE2E2';
                }
                return (
                  <TouchableOpacity
                    key={opt}
                    disabled={checked}
                    style={{ backgroundColor: bgColor, borderRadius: 12, borderWidth: 2, borderColor }}
                    className="p-4 mb-3 items-center"
                    onPress={() => { hapticLight(); setSelectedOption(opt); }}
                  >
                    <Text className="text-ink text-lg font-semibold">{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Feedback */}
        {checked && (
          <View className="px-5 mb-4">
            <View style={{ backgroundColor: isCorrect ? '#D1FAE5' : '#FEE2E2', borderRadius: 12 }} className="p-4">
              <Text style={{ color: isCorrect ? colors.successDark : colors.danger }} className="text-base font-bold mb-1">
                {isCorrect ? 'Correct!' : 'Not quite'}
              </Text>
              {item.type === 'order' ? (
                <>
                  <Text className="text-ink text-base">{item.ex.tokens.join(' ')}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm">{item.ex.roman}</Text>
                </>
              ) : (
                <Text className="text-ink text-base">
                  {item.ex.nepaliParts[0]}{item.ex.answer}{item.ex.nepaliParts[1]}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3 bg-cream">
        {!checked ? (
          <TouchableOpacity
            style={{ backgroundColor: canCheck ? colors.primary : colors.disabled }}
            className="flex-1 py-4 rounded-xl items-center"
            disabled={!canCheck}
            onPress={handleCheck}
          >
            <Text className="text-white font-bold">CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{ backgroundColor: isCorrect ? colors.success : colors.primary }}
            className="flex-1 py-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold">CONTINUE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SentenceBuilder;
