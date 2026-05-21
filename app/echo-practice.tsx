import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { vocab, shuffle } from '../src/data/vocab';
import { speak } from '../src/services/tts';

const EchoPractice = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const words = useMemo(() => shuffle(vocab).slice(0, 5), []);
  const currentWord = words[currentIndex];

  const handlePlay = async () => {
    if (!currentWord) return;
    setIsPlaying(true);
    await speak(currentWord.nepali, 'ne-NP');
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: '#FBF9F4' }}>
        <Text className="text-6xl mb-4">🗣️</Text>
        <Text className="text-[#4A1942] text-2xl font-bold mb-2">Echo Practice Complete!</Text>
        <Text className="text-[#6B7280] text-base mb-6">Great pronunciation practice!</Text>
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
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#6B7280] text-xl">✕</Text>
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

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24 }} className="p-8 w-full items-center shadow-sm">
            <Text className="text-[#800816] text-5xl font-bold mb-2">{currentWord.nepali}</Text>
            <Text className="text-[#6B7280] text-xl mb-6">{currentWord.roman}</Text>
            <Text className="text-[#4A1942] text-lg italic mb-8">"{currentWord.english}"</Text>

            <TouchableOpacity
              style={{ backgroundColor: isPlaying ? '#D1D5DB' : '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              onPress={handlePlay}
              disabled={isPlaying}
            >
              <Text className="text-white text-3xl">🔊</Text>
            </TouchableOpacity>
            <Text className="text-[#6B7280] text-sm">Tap to listen</Text>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4" style={{ backgroundColor: '#FBF9F4' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#800816' }}
          className="flex-1 py-4 rounded-xl items-center"
          onPress={handleNext}
        >
          <Text className="text-white font-bold">NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EchoPractice;
