import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Word } from '../data/vocab';
import { awardXp } from '../services/xp';
import { useSrsStore } from '../stores/srs';
import type { MistakeSource } from '../stores/mistakes';
import type { XpSource } from '../services/db';
import { useSpeechRecognition, isPronunciationMatch } from '../hooks/useSpeechRecognition';
import { colors } from '../theme';
import { ProgressBar } from './ui';
import { hapticSuccess, hapticError } from '../utils/haptics';
import Confetti from './Confetti';

type Phase = 'idle' | 'listening' | 'correct' | 'incorrect';

interface SpeakCheckSessionProps {
  uid: string;
  words: Word[];
  title: string;
  xpSource: XpSource;
  srsSource: MistakeSource;
  onComplete?: () => void;
}

export default function SpeakCheckSession({
  uid,
  words,
  title,
  xpSource,
  srsSource,
  onComplete,
}: SpeakCheckSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

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

  useEffect(() => {
    recognizedTextRef.current = recognizedText || '';
  }, [recognizedText]);

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

  // Record SRS result once a phase settles (correct/incorrect) — separate signal
  // from echo-practice since this tests unprompted recall, not repetition.
  useEffect(() => {
    if (!currentWord) return;
    if (phase === 'correct') {
      useSrsStore.getState().recordResult(uid, currentWord.id, true, srsSource);
    } else if (phase === 'incorrect') {
      useSrsStore.getState().recordResult(uid, currentWord.id, false, srsSource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (isComplete && !xpAwarded) {
      setXpAwarded(true);
      hapticSuccess();
      const bonusXp = correctCount * 10;
      const totalXp = 30 + bonusXp;
      awardXp(uid, totalXp, xpSource);
    }
  }, [isComplete, xpAwarded, uid, correctCount, xpSource]);

  const handleListen = async () => {
    if (!currentWord) return;
    settledRef.current = false;
    recognizedTextRef.current = '';
    if (isAvailable) {
      setPhase('listening');
      await startListening('ne-NP');
    } else {
      setShowSkip(true);
    }
  };

  const advance = () => {
    if (currentIndex + 1 >= words.length) {
      setIsComplete(true);
      onComplete?.();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setPhase('idle');
    setShowSkip(false);
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    advance();
  };

  const handleRetry = async () => {
    setPhase('idle');
    setShowSkip(false);
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    await stopListening();
    setTimeout(() => handleListen(), 300);
  };

  const handleContinue = () => {
    clearTimeout_();
    settledRef.current = false;
    recognizedTextRef.current = '';
    setPhase('idle');
    setShowSkip(false);
    advance();
  };

  if (isComplete) {
    const bonusXp = correctCount * 10;
    const totalXp = 30 + bonusXp;
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Confetti active={true} />
        <Text className="text-6xl mb-4">🎯</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Speak & Check Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2">Nice recall practice!</Text>
        <Text className="text-brand text-sm font-semibold mb-1">+{totalXp} XP earned</Text>
        <Text style={{ color: correctCount > 0 ? colors.successDark : colors.textSecondary }} className="text-sm mb-6">
          {correctCount}/{words.length} words recalled correctly{correctCount > 0 ? ` (+${bonusXp} XP bonus)` : ''}
        </Text>
      </View>
    );
  }

  if (!currentWord) return null;

  const phaseColors: Record<Phase, string> = {
    idle: colors.border,
    listening: colors.primary,
    correct: colors.success,
    incorrect: colors.danger,
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="px-5 pt-2 pb-4">
        <ProgressBar progress={(currentIndex / words.length)} height={8} color={colors.primary} trackColor={colors.border} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-8 items-center">
          <Text className="text-ink text-xl font-bold mb-2">{title}</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-8">Say the Nepali word for this — no audio hint.</Text>

          <View style={{ backgroundColor: colors.surface, borderRadius: 24, borderWidth: 2, borderColor: phaseColors[phase] }} className="p-8 w-full items-center shadow-sm">
            <Text className="text-ink text-3xl font-bold mb-8 text-center">{currentWord.english}</Text>

            {(phase === 'correct' || phase === 'incorrect') && (
              <View className="items-center mb-4">
                <Text className="text-brand text-2xl font-bold mb-1">{currentWord.nepali}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-base">{currentWord.roman}</Text>
              </View>
            )}

            {phase === 'idle' ? (
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                onPress={handleListen}
              >
                <Ionicons name="mic" size={32} color="#FFFFFF" />
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
                <View style={{ backgroundColor: colors.success }} className="w-16 h-16 rounded-full items-center justify-center mb-2">
                  <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
                </View>
                <Text style={{ color: colors.success }} className="text-lg font-bold mb-1">Perfect!</Text>
                {recognizedText && (
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Recognized: "{recognizedText}"</Text>
                )}
              </View>
            ) : (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: colors.danger }} className="w-16 h-16 rounded-full items-center justify-center mb-2">
                  <Ionicons name="close-circle" size={40} color="#FFFFFF" />
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
              Speech recognition requires a development build. Using manual mode — tap NEXT to reveal and continue.
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

        {phase === 'idle' && showSkip && (
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
}
