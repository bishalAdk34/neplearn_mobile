import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { useMistakesStore } from '../src/stores/mistakes';
import { useSrsStore } from '../src/stores/srs';
import { vocab, GUEST_ID } from '../src/data/vocab';
import { QuizSession } from '../src/components/QuizSession';
import { ScreenHeader, EmptyState, ProgressBar } from '../src/components/ui';
import { generateMistakeQuiz, isOffline, type AiQuizQuestion } from '../src/services/ai';
import { awardXp } from '../src/services/xp';
import { colors, shadows } from '../src/theme';
import { hapticSuccess, hapticError } from '../src/utils/haptics';

type Mode = 'choose' | 'standard' | 'ai';

const PracticeMistakes = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const mistakesByUser = useMistakesStore(s => s.mistakesByUser);
  const [mode, setMode] = useState<Mode>('choose');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<AiQuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const mistakeWords = useMemo(() => {
    const userMistakes = mistakesByUser[uid] || {};
    const activeIds = new Set(
      Object.values(userMistakes)
        .filter(m => !m.resolved)
        .map(m => m.wordId)
    );
    return vocab.filter(w => activeIds.has(w.id));
    // Snapshot on mount only — resolving must not shrink the active session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const startAiQuiz = async () => {
    // Offline or AI failure → fall back to the standard local quiz.
    if (isOffline()) {
      setMode('standard');
      return;
    }
    setLoadingAi(true);
    const questions = await generateMistakeQuiz(
      mistakeWords.slice(0, 10).map(w => ({ id: w.id, english: w.english, nepali: w.nepali, roman: w.roman }))
    );
    setLoadingAi(false);
    if (!questions) {
      setMode('standard');
      return;
    }
    setAiQuestions(questions);
    setCurrentQ(0);
    setScore(0);
    setDone(false);
    setMode('ai');
  };

  const selectAiAnswer = (index: number) => {
    if (selected !== null) return;
    const q = aiQuestions[currentQ];
    setSelected(index);
    const correct = index === q.answerIndex;
    // recordResult with source 'mistakes' auto-resolves on correct answers.
    useSrsStore.getState().recordResult(uid, q.wordId, correct, 'mistakes');
    if (correct) {
      hapticSuccess();
      setScore(s => s + 1);
      awardXp(uid, 15, 'mistakes');
    } else {
      hapticError();
    }
    setTimeout(() => {
      setSelected(null);
      if (currentQ < aiQuestions.length - 1) {
        setCurrentQ(c => c + 1);
      } else {
        setDone(true);
      }
    }, correct ? 600 : 1400);
  };

  if (mistakeWords.length === 0) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Practice Mistakes" backIcon="back" />
        <EmptyState
          emoji="🎯"
          title="No mistakes to review"
          message="Great work! Words you miss in quizzes and lessons will show up here."
          actionLabel="Take a Quiz"
          onAction={() => router.replace('/learn')}
        />
      </View>
    );
  }

  if (mode === 'standard') {
    return (
      <QuizSession
        uid={uid}
        words={mistakeWords}
        count={10}
        title="Practice Mistakes"
        completeEmoji="🎯"
        srsSource="mistakes"
        xpAmount={15}
        xpSource="mistakes"
      />
    );
  }

  // ---- AI quiz session ----
  if (mode === 'ai') {
    if (done) {
      return (
        <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
          <Text className="text-6xl mb-4">✨</Text>
          <Text className="text-ink text-2xl font-bold mb-2">AI Quiz Complete!</Text>
          <Text style={{ color: colors.textSecondary }} className="text-base mb-6 text-center">
            You got {score} of {aiQuestions.length} right. Correct answers resolve those mistakes.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 12 }}
            className="px-8 py-4 w-full items-center"
            onPress={() => router.replace('/learn')}
          >
            <Text className="text-white font-bold text-lg">Back to Learn</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const q = aiQuestions[currentQ];
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title="✨ AI Quiz"
          backIcon="close"
          right={
            <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
              <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentQ + 1}/{aiQuestions.length}</Text>
            </View>
          }
        />
        <View className="px-5 mb-6">
          <ProgressBar progress={currentQ / aiQuestions.length} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-5">
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, ...shadows.card }} className="p-6 mb-6">
              <Text className="text-ink text-xl font-bold text-center">{q.question}</Text>
            </View>
            {q.options.map((option, index) => {
              let borderColor: string = colors.border;
              let bgColor: string = colors.surface;
              if (selected !== null) {
                if (index === q.answerIndex) {
                  borderColor = colors.success;
                  bgColor = '#D1FAE5';
                } else if (index === selected) {
                  borderColor = colors.danger;
                  bgColor = '#FEE2E2';
                }
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={{ backgroundColor: bgColor, borderWidth: 2, borderColor, borderRadius: 16 }}
                  className="p-4 mb-3"
                  onPress={() => selectAiAnswer(index)}
                  disabled={selected !== null}
                >
                  <Text className="text-ink text-base font-semibold">{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---- Mode picker ----
  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Practice Mistakes" backIcon="back" />
      <View className="px-5">
        <Text style={{ color: colors.textSecondary }} className="text-base mb-6">
          {mistakeWords.length} word{mistakeWords.length !== 1 ? 's' : ''} to fix. Choose how to practice:
        </Text>

        <TouchableOpacity
          style={{ backgroundColor: colors.surface, borderRadius: 20, ...shadows.card }}
          className="p-5 mb-4 flex-row items-center"
          onPress={() => setMode('standard')}
        >
          <Text className="text-4xl mr-4">🎯</Text>
          <View className="flex-1">
            <Text className="text-ink text-lg font-bold mb-1">Standard Quiz</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">Multiple choice from your mistake words. Works offline.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: colors.surface, borderRadius: 20, ...shadows.card, opacity: loadingAi ? 0.6 : 1 }}
          className="p-5 mb-4 flex-row items-center"
          onPress={startAiQuiz}
          disabled={loadingAi}
        >
          <Text className="text-4xl mr-4">✨</Text>
          <View className="flex-1">
            <Text className="text-ink text-lg font-bold mb-1">AI Quiz</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              Fresh AI-made questions targeting your weak words. Needs internet — falls back to standard offline.
            </Text>
          </View>
          {loadingAi && <ActivityIndicator color={colors.primary} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PracticeMistakes;
