import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { vocab, getWordsByCategory, categories, shuffle, useVocabStore, GUEST_ID } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { speak } from '../src/services/tts';

const Lesson = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.category as string | undefined;
  const user = useAuthStore(s => s.user);
  const { learnWord, isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const sessionWords = useMemo(() => {
    const words = category ? getWordsByCategory(category) : vocab;
    return shuffle(words).slice(0, 5);
  }, [category]);

  const currentWord = sessionWords[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = vocab.filter(w => w.id !== currentWord.id);
    const distractors = shuffle(others).slice(0, 3);
    return shuffle([currentWord, ...distractors]);
  }, [currentWord]);

  const progress = ((currentIndex) / sessionWords.length) * 100;

  const handleCheck = () => {
    if (selectedOption === null) return;
    const correct = selectedOption === currentWord.id;
    setIsCorrect(correct);
    setIsAnswerChecked(true);
    if (correct) {
      if (!isLearned(uid, currentWord.id)) learnWord(uid, currentWord.id);
      setCorrectCount(prev => prev + 1);
      speak(currentWord.nepali, 'ne-NP');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= sessionWords.length) {
      setIsLessonComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  if (isLessonComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: '#FBF9F4' }}>
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-[#4A1942] text-2xl font-bold mb-2">Lesson Complete!</Text>
        <Text className="text-[#6B7280] text-base mb-6">You got {correctCount}/{sessionWords.length} correct</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#800816', borderRadius: 12 }}
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
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#6B7280] text-xl">✕</Text>
        </TouchableOpacity>
        <View className="flex-1 mx-4">
          <View style={{ backgroundColor: '#E5D5D0' }} className="h-2 rounded-full overflow-hidden">
            <View style={{ width: `${progress}%`, backgroundColor: '#800816' }} className="h-full rounded-full" />
          </View>
        </View>
        <View style={{ backgroundColor: '#FEF3C7' }} className="px-3 py-1 rounded-full">
          <Text className="text-[#92400E] text-sm font-bold">{currentIndex + 1}/{sessionWords.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View className="px-5 mb-6 items-center">
          <Text className="text-[#4A1942] text-xl font-bold mb-2">What does this mean?</Text>
        </View>

        {/* Word Card */}
        <View className="px-5 mb-8 items-center">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 2, borderColor: isAnswerChecked ? (isCorrect ? '#10B981' : '#EF4444') : '#E5D5D0' }} className="p-6 w-full items-center shadow-sm">
            {currentWord.image?.startsWith('http') ? (
              <Image source={{ uri: currentWord.image }} className="w-32 h-32 rounded-xl mb-4" />
            ) : (
              <Text className="text-6xl mb-4">{currentWord.image || '📖'}</Text>
            )}
            <Text className="text-[#800816] text-4xl font-bold mb-1">{currentWord.nepali}</Text>
            <Text className="text-[#6B7280] text-lg">{currentWord.roman}</Text>
            <TouchableOpacity className="mt-4" onPress={() => speak(currentWord.nepali, 'ne-NP')}>
              <View style={{ backgroundColor: '#FEE2E2' }} className="w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-[#800816]">🔊</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Options */}
        <View className="px-5 mb-6">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOption = opt.id === currentWord.id;
            let borderColor = '#E5D5D0';
            let bgColor = '#FFFFFF';

            if (isAnswerChecked) {
              if (isCorrectOption) {
                borderColor = '#10B981';
                bgColor = '#D1FAE5';
              } else if (isSelected && !isCorrect) {
                borderColor = '#EF4444';
                bgColor = '#FEE2E2';
              }
            } else if (isSelected) {
              borderColor = '#800816';
              bgColor = '#FEE2E2';
            }

            return (
              <TouchableOpacity
                key={opt.id}
                disabled={isAnswerChecked}
                style={{ backgroundColor: bgColor, borderRadius: 12, borderWidth: 2, borderColor }}
                className="p-4 mb-3 flex-row items-center"
                onPress={() => setSelectedOption(opt.id)}
              >
                <Text className="text-[#4A1942] text-base font-semibold flex-1">{opt.english}</Text>
                {isAnswerChecked && isCorrectOption && <Text className="text-[#10B981] text-xl">✓</Text>}
                {isAnswerChecked && isSelected && !isCorrect && <Text className="text-[#EF4444] text-xl">✕</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="flex-row px-5 pb-8 pt-4 gap-3" style={{ backgroundColor: '#FBF9F4' }}>
        {!isAnswerChecked ? (
          <>
            <TouchableOpacity
              style={{ backgroundColor: '#F3F4F6' }}
              className="flex-1 py-4 rounded-xl items-center"
              onPress={handleSkip}
            >
              <Text className="text-[#6B7280] font-bold">SKIP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: selectedOption !== null ? '#800816' : '#D1D5DB' }}
              className="flex-1 py-4 rounded-xl items-center"
              disabled={selectedOption === null}
              onPress={handleCheck}
            >
              <Text className="text-white font-bold">CHECK ANSWER</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={{ backgroundColor: isCorrect ? '#10B981' : '#800816' }}
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

export default Lesson;
