import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vocab, shuffle, GUEST_ID, useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { speak } from '../src/services/tts';
import { awardXp } from '../src/services/xp';
import { useSpeechRecognition, isPronunciationMatch } from '../src/hooks/useSpeechRecognition';
import { colors } from '../src/theme';
import { ProgressBar } from '../src/components/ui';
import { hapticSuccess, hapticError } from '../src/utils/haptics';
import Confetti from '../src/components/Confetti';

type Phase = 'prompt' | 'listening' | 'correct' | 'incorrect';

const SESSION_SIZE = 5;

const SpeakCheck = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [phase, setPhase] = useState<Phase>('prompt');
  const [correctCount, setCorrectCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const words = useMemo(() => shuffle(vocab).slice(0, SESSION_SIZE), []);
  const currentWord = words[currentIndex];

  const { isAvailable, recognizedText, partialText, error, startListening, stopListening } = useSpeechRecognition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevResultsRef = useRef<Record<number, string>>({});
  const recognizedTextRef = useRef('');
  const settledRef = useRef(false);

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    recognizedTextRef.current = recognizedText || '';
  }, [recognizedText]);

  const settleAnswer = useCallback((text: string) => {
    if (settledRef.current) return;
    settledRef.current = true;
    clearTimeout_();
    stopListening();
    setRevealed(true);
    if (text) {
      const match = isPronunciationMatch(text, currentWord?.nepali || '');
      setPhase(match ? 'correct' : 'incorrect');
      if (match) {
        hapticSuccess();
        setCorrectCount((c) => c + 1);
      } else {
        hapticError();
      }
    } else {
      hapticError();
      setPhase('incorrect');
    }
  }, [clearTimeout_, stopListening, currentWord]);

  useEffect(() => {
    if (phase !== 'listening' || !recognizedText) return;
    const prev = prevResultsRef.current[currentIndex];
    if (prev === recognizedText) return;
    prevResultsRef.current[currentIndex] = recognizedText;
    settleAnswer(recognizedText);
  }, [recognizedText, phase, currentIndex, settleAnswer]);

  useEffect(() => {
    if (phase === 'listening') {
      timeoutRef.current = setTimeout(() => {
        settleAnswer(recognizedTextRef.current);
      }, 5000);
    }
    return () => clearTimeout_();
  }, [phase, settleAnswer, clearTimeout_]);

  useEffect(() => {
    if (isComplete && !xpAwarded) {
      setXpAwarded(true);
      hapticSuccess();
      const bonusXp = correctCount * 10;
      const totalXp = 30 + bonusXp;
      awardXp(uid, totalXp, 'echo_practice');
    }
  }, [isComplete, xpAwarded, uid, correctCount]);

  const handleSpeak = async () => {
    if (!currentWord || !isAvailable) return;
    settledRef.current = false;
    recognizedTextRef.current = '';
    setPhase('listening');
    await startListening('ne-NP');
  };

  const handleManualReveal = (gotIt: boolean) => {
    if (!currentWord) return;
    setRevealed(true);
    setPhase(gotIt ? 'correct' : 'incorrect');
    if (gotIt) {
      hapticSuccess();
      setCorrectCount((c) => c + 1);
    } else {
      hapticError();
    }
  };

  const handleNext = () => {
    setPhase('prompt');
    setRevealed(false);
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    if (currentIndex + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRetry = async () => {
    setPhase('prompt');
    setRevealed(false);
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    await stopListening();
  };

  const handleCompleteDone = () => {
    router.back();
  };

  if (isComplete) {
    const bonusXp = correctCount * 10;
    const totalXp = 30 + bonusXp;
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Confetti active={true} />
        <Text className="text-6xl mb-4">🗣️</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Speak & Check Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2">Great recall practice!</Text>
        <Text className="text-brand text-sm font-semibold mb-1">+{totalXp} XP earned</Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-6">
          {correctCount}/{words.length} words recalled correctly
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={handleCompleteDone}
        >
          <Text className="text-white font-bold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentWord) return null;

  const phaseColors: Record<Phase, string> = {
    prompt: colors.border,
    listening: colors.primary,
    correct: colors.success,
    incorrect: colors.danger,
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar progress={currentIndex / words.length} height={8} color={colors.primary} trackColor={colors.border} />
        </View>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
          <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{words.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-8 items-center">
          <Text className="text-ink text-xl font-bold mb-2">Speak & Check</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-8">Say the Nepali word aloud before revealing the answer.</Text>

          <View style={{ backgroundColor: colors.surface, borderRadius: 24, borderWidth: 2, borderColor: phaseColors[phase] }} className="p-8 w-full items-center shadow-sm">
            <Text className="text-ink text-lg italic mb-2">"{currentWord.english}"</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm mb-6">How do you say this in Nepali?</Text>

            {revealed && (
              <View className="items-center mb-6">
                <Text className="text-brand text-4xl font-bold mb-1">{currentWord.nepali}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-lg">{currentWord.roman}</Text>
                <TouchableOpacity
                  className="mt-2"
                  onPress={() => speak(currentWord.nepali, 'ne-NP')}
                >
                  <Ionicons name="volume-medium-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            {phase === 'prompt' ? (
              isAvailable ? (
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
                  className="w-20 h-20 rounded-full items-center justify-center mb-2"
                  onPress={handleSpeak}
                >
                  <Text className="text-white text-3xl">🎤</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, borderRadius: 12 }}
                  className="px-6 py-3"
                  onPress={() => setRevealed(true)}
                >
                  <Text className="text-white font-bold">Reveal Answer</Text>
                </TouchableOpacity>
              )
            ) : phase === 'listening' ? (
              <View className="items-center mb-2">
                <View style={{ backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Text className="text-white text-3xl">🎤</Text>
                </View>
                <Text className="text-brand text-sm font-bold mb-1">LISTENING...</Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs text-center">Speak the Nepali word aloud</Text>
              </View>
            ) : phase === 'correct' ? (
              <View className="items-center mb-2">
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={{ color: colors.success }} className="text-lg font-bold mt-1">Correct!</Text>
                {recognizedText && (
                  <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">Recognized: "{recognizedText}"</Text>
                )}
              </View>
            ) : (
              <View className="items-center mb-2">
                <Ionicons name="close-circle" size={40} color={colors.danger} />
                <Text style={{ color: colors.danger }} className="text-lg font-bold mt-1">Not quite</Text>
                {recognizedText ? (
                  <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">Recognized: "{recognizedText}"</Text>
                ) : isAvailable ? (
                  <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">No speech detected</Text>
                ) : null}
              </View>
            )}

            {phase === 'listening' && partialText && (
              <View className="mt-2 px-4 py-2 rounded-lg" style={{ backgroundColor: colors.mutedSurface }}>
                <Text style={{ color: colors.textSecondary }} className="text-sm italic">{partialText}</Text>
              </View>
            )}
          </View>

          {!isAvailable && phase === 'prompt' && (
            <Text style={{ color: colors.warning }} className="text-sm mt-4 text-center px-6">
              Speech recognition requires a development build. Using manual mode — reveal, then self-report.
            </Text>
          )}
          {error && phase === 'listening' && (
            <Text style={{ color: colors.danger }} className="text-sm mt-4 text-center">
              Recognition error: {error}
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3" style={{ backgroundColor: colors.background }}>
        {revealed && !isAvailable && phase !== 'correct' && phase !== 'incorrect' && (
          <>
            <TouchableOpacity
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.disabled }}
              className="flex-1 py-4 rounded-xl items-center"
              onPress={() => handleManualReveal(false)}
            >
              <Text className="text-ink font-bold">I MISSED IT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: colors.success }}
              className="flex-1 py-4 rounded-xl items-center"
              onPress={() => handleManualReveal(true)}
            >
              <Text className="text-white font-bold">GOT IT RIGHT</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'correct' && (
          <TouchableOpacity
            style={{ backgroundColor: colors.success }}
            className="flex-1 py-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold">NEXT WORD</Text>
          </TouchableOpacity>
        )}

        {phase === 'incorrect' && (
          <>
            <TouchableOpacity
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.disabled }}
              className="flex-1 py-4 rounded-xl items-center"
              onPress={handleRetry}
            >
              <Text className="text-ink font-bold">RETRY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="flex-1 py-4 rounded-xl items-center"
              onPress={handleNext}
            >
              <Text className="text-white font-bold">NEXT</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default SpeakCheck;
