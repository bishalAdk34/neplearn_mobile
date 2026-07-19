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

type Phase = 'idle' | 'playing' | 'listening' | 'correct' | 'incorrect';

const EchoPractice = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  const words = useMemo(() => shuffle(vocab).slice(0, 5), []);
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
    if (!isAvailable) {
      setShowSkip(true);
    }
  }, [isAvailable]);

  // Keep latest recognized text in a ref so the timeout can read it
  // without re-arming (stale-closure race fix).
  useEffect(() => {
    recognizedTextRef.current = recognizedText || '';
  }, [recognizedText]);

  // Single idempotent settle path shared by result effect and timeout.
  const settleAnswer = useCallback((text: string) => {
    if (settledRef.current) return;
    settledRef.current = true;
    clearTimeout_();
    stopListening();
    if (text) {
      const match = isPronunciationMatch(text, currentWord?.nepali || '');
      setPhase(match ? 'correct' : 'incorrect');
      if (match) {
        hapticSuccess();
        setCorrectCount((c) => c + 1);
      } else {
        hapticError();
        setShowSkip(true);
      }
    } else {
      hapticError();
      setPhase('incorrect');
      setShowSkip(true);
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

  const handlePlay = async () => {
    if (!currentWord) return;
    settledRef.current = false;
    recognizedTextRef.current = '';
    setIsPlaying(true);
    setPhase('playing');
    await speak(currentWord.nepali, 'ne-NP');
    setIsPlaying(false);
    if (isAvailable) {
      setPhase('listening');
      await startListening('ne-NP');
    } else {
      setPhase('idle');
      setShowSkip(true);
    }
  };

  const handleNext = () => {
    setPhase('idle');
    setShowSkip(false);
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
    setPhase('idle');
    setShowSkip(false);
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    await stopListening();
    setTimeout(() => handlePlay(), 300);
  };

  const handleContinue = () => {
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    setPhase('idle');
    setShowSkip(false);
    if (currentIndex + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCompleteDone = () => {
    router.push('/');
  };

  if (isComplete) {
    const bonusXp = correctCount * 10;
    const totalXp = 30 + bonusXp;
    return (
      <View className="flex-1 items-center justify-center px-5 bg-cream">
        <Confetti active={true} />
        <Text className="text-6xl mb-4">🗣️</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Echo Practice Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2">Great pronunciation practice!</Text>
        <Text className="text-brand text-sm font-semibold mb-1">+{totalXp} XP earned</Text>
        {correctCount > 0 && (
          <Text style={{ color: colors.successDark }} className="text-sm mb-6">
            {correctCount}/{words.length} words pronounced correctly (+{bonusXp} XP bonus)
          </Text>
        )}
        {correctCount === 0 && (
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-6">
            0/{words.length} words pronounced correctly
          </Text>
        )}
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
    idle: colors.border,
    playing: colors.warning,
    listening: colors.primary,
    correct: colors.success,
    incorrect: colors.danger,
  };

  return (
    <View className="flex-1 bg-cream">
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <ProgressBar progress={(currentIndex / words.length)} height={8} color={colors.primary} trackColor={colors.border} />
        </View>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
          <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{currentIndex + 1}/{words.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-8 items-center">
          <Text className="text-ink text-xl font-bold mb-2">Echo Practice</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-8">Listen carefully, then repeat aloud with perfect pitch.</Text>

          <View style={{ backgroundColor: colors.surface, borderRadius: 24, borderWidth: 2, borderColor: phaseColors[phase] }} className="p-8 w-full items-center shadow-sm">
            <Text className="text-brand text-5xl font-bold mb-2" style={{ lineHeight: 60 }}>{currentWord.nepali}</Text>
            <Text style={{ color: colors.textSecondary }} className="text-xl mb-6">{currentWord.roman}</Text>
            <Text className="text-ink text-lg italic mb-8">"{currentWord.english}"</Text>

            {phase === 'idle' || phase === 'playing' ? (
              <TouchableOpacity
                style={{ backgroundColor: isPlaying ? colors.disabled : colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                onPress={handlePlay}
                disabled={isPlaying}
              >
                <Ionicons name="volume-high" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            ) : phase === 'listening' ? (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Text className="text-white text-3xl">🎤</Text>
                </View>
                <Text className="text-brand text-sm font-bold mb-1">LISTENING...</Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs text-center">Speak the Nepali word aloud</Text>
              </View>
            ) : phase === 'correct' ? (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: colors.success }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
                </View>
                <Text style={{ color: colors.success }} className="text-lg font-bold mb-1">Perfect!</Text>
                {recognizedText && (
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Recognized: "{recognizedText}"</Text>
                )}
              </View>
            ) : (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: colors.danger }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="close-circle" size={48} color="#FFFFFF" />
                </View>
                <Text style={{ color: colors.danger }} className="text-lg font-bold mb-1">Not quite</Text>
                {recognizedText ? (
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Recognized: "{recognizedText}"</Text>
                ) : (
                  <Text style={{ color: colors.textSecondary }} className="text-xs">No speech detected</Text>
                )}
              </View>
            )}

            {phase === 'listening' && partialText && (
              <View className="mt-2 px-4 py-2 rounded-lg" style={{ backgroundColor: colors.mutedSurface }}>
                <Text style={{ color: colors.textSecondary }} className="text-sm italic">{partialText}</Text>
              </View>
            )}
          </View>

          {!isAvailable && phase === 'idle' && (
            <Text style={{ color: colors.warning }} className="text-sm mt-4 text-center px-6">
              Speech recognition requires a development build. Using manual mode — tap speaker then tap NEXT.
            </Text>
          )}
          {error && phase === 'listening' && (
            <Text style={{ color: colors.danger }} className="text-sm mt-4 text-center">
              Recognition error: {error}
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3 bg-cream">
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
            {showSkip && (
              <TouchableOpacity
                style={{ backgroundColor: colors.primary }}
                className="flex-1 py-4 rounded-xl items-center"
                onPress={handleContinue}
              >
                <Text className="text-white font-bold">SKIP</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {phase === 'idle' && showSkip && !isPlaying && (
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="flex-1 py-4 rounded-xl items-center"
            onPress={handleContinue}
          >
            <Text className="text-white font-bold">NEXT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default EchoPractice;
