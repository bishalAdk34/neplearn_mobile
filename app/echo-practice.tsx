import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vocab, shuffle, GUEST_ID, useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { speak } from '../src/services/tts';
import { addXp, updateStreak } from '../src/services/db';
import { useSpeechRecognition, isPronunciationMatch } from '../src/hooks/useSpeechRecognition';

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
    if (phase !== 'listening' || !recognizedText) return;
    const prev = prevResultsRef.current[currentIndex];
    if (prev === recognizedText) return;
    prevResultsRef.current[currentIndex] = recognizedText;
    clearTimeout_();
    stopListening();
    const match = isPronunciationMatch(recognizedText, currentWord?.nepali || '');
    setPhase(match ? 'correct' : 'incorrect');
    if (match) {
      setCorrectCount((c) => c + 1);
    } else {
      setShowSkip(true);
    }
  }, [recognizedText, phase, currentWord, clearTimeout_, stopListening, currentIndex]);

  useEffect(() => {
    if (phase === 'listening') {
      timeoutRef.current = setTimeout(() => {
        stopListening();
        setShowSkip(true);
        if (recognizedText) {
          const match = isPronunciationMatch(recognizedText, currentWord?.nepali || '');
          setPhase(match ? 'correct' : 'incorrect');
          if (match) setCorrectCount((c) => c + 1);
        } else {
          setPhase('incorrect');
        }
      }, 5000);
    }
    return () => clearTimeout_();
  }, [phase, recognizedText, currentWord, clearTimeout_, stopListening]);

  useEffect(() => {
    if (isComplete && !xpAwarded) {
      setXpAwarded(true);
      const bonusXp = correctCount * 10;
      const totalXp = 30 + bonusXp;
      if (uid === GUEST_ID) {
        useVocabStore.getState().addLocalXp(uid, totalXp);
        useVocabStore.getState().addLocalStreak(uid);
      } else {
        addXp(uid, totalXp, 'echo_practice');
        updateStreak(uid);
      }
    }
  }, [isComplete, xpAwarded, uid, correctCount]);

  const handlePlay = async () => {
    if (!currentWord) return;
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
    await stopListening();
    setTimeout(() => handlePlay(), 300);
  };

  const handleContinue = () => {
    clearTimeout_();
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
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: '#FBF9F4' }}>
        <Text className="text-6xl mb-4">🗣️</Text>
        <Text className="text-[#4A1942] text-2xl font-bold mb-2">Echo Practice Complete!</Text>
        <Text className="text-[#6B7280] text-base mb-2">Great pronunciation practice!</Text>
        <Text className="text-[#800816] text-sm font-semibold mb-1">+{totalXp} XP earned</Text>
        {correctCount > 0 && (
          <Text className="text-[#065F46] text-sm mb-6">
            {correctCount}/{words.length} words pronounced correctly (+{bonusXp} XP bonus)
          </Text>
        )}
        {correctCount === 0 && (
          <Text className="text-[#6B7280] text-sm mb-6">
            0/{words.length} words pronounced correctly
          </Text>
        )}
        <TouchableOpacity
          style={{ backgroundColor: '#800816', borderRadius: 12 }}
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
    idle: '#E5D5D0',
    playing: '#F59E0B',
    listening: '#800816',
    correct: '#10B981',
    incorrect: '#DC2626',
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <View style={{ backgroundColor: '#E5D5D0' }} className="h-2 rounded-full overflow-hidden">
            <View style={{ width: `${((currentIndex) / words.length) * 100}%`, backgroundColor: '#800816' }} className="h-full rounded-full" />
          </View>
        </View>
        <View style={{ backgroundColor: '#FEF3C7' }} className="px-3 py-1 rounded-full">
          <Text className="text-[#92400E] text-sm font-bold">{currentIndex + 1}/{words.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-8 items-center">
          <Text className="text-[#4A1942] text-xl font-bold mb-2">Echo Practice</Text>
          <Text className="text-[#6B7280] text-sm text-center mb-8">Listen carefully, then repeat aloud with perfect pitch.</Text>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 2, borderColor: phaseColors[phase] }} className="p-8 w-full items-center shadow-sm">
            <Text className="text-[#800816] text-5xl font-bold mb-2" style={{ lineHeight: 60 }}>{currentWord.nepali}</Text>
            <Text className="text-[#6B7280] text-xl mb-6">{currentWord.roman}</Text>
            <Text className="text-[#4A1942] text-lg italic mb-8">"{currentWord.english}"</Text>

            {phase === 'idle' || phase === 'playing' ? (
              <TouchableOpacity
                style={{ backgroundColor: isPlaying ? '#D1D5DB' : '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                onPress={handlePlay}
                disabled={isPlaying}
              >
                <Text className="text-white text-3xl">🔊</Text>
              </TouchableOpacity>
            ) : phase === 'listening' ? (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Text className="text-white text-3xl">🎤</Text>
                </View>
                <Text className="text-[#800816] text-sm font-bold mb-1">LISTENING...</Text>
                <Text className="text-[#6B7280] text-xs text-center">Speak the Nepali word aloud</Text>
              </View>
            ) : phase === 'correct' ? (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: '#10B981' }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
                </View>
                <Text className="text-[#10B981] text-lg font-bold mb-1">Perfect!</Text>
                {recognizedText && (
                  <Text className="text-[#6B7280] text-xs">Recognized: "{recognizedText}"</Text>
                )}
              </View>
            ) : (
              <View className="items-center mb-4">
                <View style={{ backgroundColor: '#DC2626' }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="close-circle" size={48} color="#FFFFFF" />
                </View>
                <Text className="text-[#DC2626] text-lg font-bold mb-1">Not quite</Text>
                {recognizedText ? (
                  <Text className="text-[#6B7280] text-xs">Recognized: "{recognizedText}"</Text>
                ) : (
                  <Text className="text-[#6B7280] text-xs">No speech detected</Text>
                )}
              </View>
            )}

            {phase === 'listening' && partialText && (
              <View className="mt-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F3F4F6' }}>
                <Text className="text-[#6B7280] text-sm italic">{partialText}</Text>
              </View>
            )}
          </View>

          {!isAvailable && phase === 'idle' && (
            <Text className="text-[#F59E0B] text-sm mt-4 text-center">
              Speech recognition not available. Tap the speaker button then manually advance.
            </Text>
          )}
          {error && phase === 'listening' && (
            <Text className="text-[#DC2626] text-sm mt-4 text-center">
              Recognition error: {error}
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3" style={{ backgroundColor: '#FBF9F4' }}>
        {phase === 'correct' && (
          <TouchableOpacity
            style={{ backgroundColor: '#10B981' }}
            className="flex-1 py-4 rounded-xl items-center"
            onPress={handleNext}
          >
            <Text className="text-white font-bold">NEXT WORD</Text>
          </TouchableOpacity>
        )}

        {phase === 'incorrect' && (
          <>
            <TouchableOpacity
              style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' }}
              className="flex-1 py-4 rounded-xl items-center"
              onPress={handleRetry}
            >
              <Text className="text-[#4A1942] font-bold">RETRY</Text>
            </TouchableOpacity>
            {showSkip && (
              <TouchableOpacity
                style={{ backgroundColor: '#800816' }}
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
            style={{ backgroundColor: '#800816' }}
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
