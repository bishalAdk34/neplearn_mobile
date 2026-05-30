import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { phrases } from '../src/data/phrases';
import { shuffle } from '../src/data/vocab';
import { speak } from '../src/services/tts';

const PracticePhrases = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const sessionPhrases = useMemo(() => shuffle(phrases).slice(0, 8), []);
  const current = sessionPhrases[currentIndex];

  const handlePlay = async () => {
    if (!current) return;
    setIsPlaying(true);
    await speak(current.nepali, 'ne-NP');
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= sessionPhrases.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: '#FBF9F4' }}>
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-[#4A1942] text-2xl font-bold mb-2">Practice Complete!</Text>
        <Text className="text-[#6B7280] text-base mb-6 text-center">You've reviewed all Dashain phrases. Great job!</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#800816', borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-lg">Back to Learn</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!current) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-[#4A1942] text-lg font-bold">Practice Phrases</Text>
        <View style={{ backgroundColor: '#FEF3C7' }} className="px-3 py-1 rounded-full">
          <Text className="text-[#92400E] text-sm font-bold">{currentIndex + 1}/{sessionPhrases.length}</Text>
        </View>
      </View>

      <View className="px-5 mb-4">
        <View style={{ backgroundColor: '#E5D5D0' }} className="h-2 rounded-full overflow-hidden">
          <View style={{ width: `${((currentIndex) / sessionPhrases.length) * 100}%`, backgroundColor: '#800816' }} className="h-full rounded-full" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 mb-8 items-center">
          <View style={{ backgroundColor: '#FEE2E2' }} className="self-start px-3 py-1 rounded-full mb-6">
            <Text className="text-[#800816] text-xs font-bold uppercase">Dashain Greetings</Text>
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }} className="p-8 w-full items-center">
            <TouchableOpacity
              style={{ backgroundColor: isPlaying ? '#D1D5DB' : '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }}
              className="w-16 h-16 rounded-full items-center justify-center mb-6"
              onPress={handlePlay}
              disabled={isPlaying}
            >
              <Ionicons name={isPlaying ? 'pause' : 'volume-high'} size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-[#800816] text-3xl font-bold mb-3 text-center">{current.nepali}</Text>
            <Text className="text-[#6B7280] text-lg mb-6">{current.roman}</Text>

            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12 }} className="w-full p-4 items-center">
              <Text className="text-[#4A1942] text-base font-semibold">"{current.english}"</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-8 pt-4 gap-3" style={{ backgroundColor: '#FBF9F4' }}>
        <TouchableOpacity
          style={{ backgroundColor: currentIndex === 0 ? '#E5D5D0' : '#FFFFFF', borderWidth: 2, borderColor: '#800816', opacity: currentIndex === 0 ? 0.5 : 1 }}
          className="flex-1 py-4 rounded-xl items-center"
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={{ color: currentIndex === 0 ? '#9CA3AF' : '#800816' }} className="font-bold">Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: '#800816' }}
          className="flex-1 py-4 rounded-xl items-center"
          onPress={handleNext}
        >
          <Text className="text-white font-bold">{currentIndex + 1 >= sessionPhrases.length ? 'Complete' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PracticePhrases;
