import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Image, Animated, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWordsByCategory, shuffle, GUEST_ID } from '../../src/data/vocab';
import { speak } from '../../src/services/tts';
import { getWordImage } from '../../src/services/image';
import { useVocabStore } from '../../src/data/vocab';
import { useAuthStore } from '../../src/stores/auth';
import { useSrsStore } from '../../src/stores/srs';
import { colors } from '../../src/theme';
import { ProgressBar } from '../../src/components/ui';
import { hapticLight } from '../../src/utils/haptics';

const Flashcards = () => {
  const params = useGlobalSearchParams();
  const category = typeof params.category === 'string' ? params.category : '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { toggleLearned, isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const words = useMemo(() => shuffle(getWordsByCategory(category)), [category]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const word = words[currentIndex];

  useEffect(() => {
    let cancelled = false;
    if (word.image?.startsWith('http')) {
      setImgUrl(word.image);
      setLoadingImg(false);
    } else {
      setImgUrl(null);
      setLoadingImg(true);
      getWordImage(word.english)
        .then(url => {
          if (cancelled) return;
          setImgUrl(url);
          setLoadingImg(false);
        })
        .catch(() => {
          if (cancelled) return;
          setImgUrl(null);
          setLoadingImg(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [word.english, word.image]);

  const speakWord = useCallback((text: string) => {
    speak(text, 'ne-NP').catch(() =>
      Alert.alert('Pronunciation Unavailable', 'Could not play audio. Check your internet connection.')
    );
  }, []);

  const reveal = () => {
    setRevealed(true);
  };

  const goNext = () => {
    if (currentIndex >= words.length - 1) { router.back(); return; }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setRevealed(false);
      setCurrentIndex(prev => prev + 1);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    });
  };

  const goBack = () => {
    if (currentIndex <= 0) return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 50, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setRevealed(false);
      setCurrentIndex(prev => prev - 1);
      fadeAnim.setValue(0);
      slideAnim.setValue(-50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleLearn = () => {
    hapticLight();
    // Self-grade: marking as learned counts as a correct review
    if (!isLearned(uid, word.id)) {
      useSrsStore.getState().recordResult(uid, word.id, true, 'flashcards');
    }
    toggleLearned(uid, word.id);
    goNext();
  };

  if (!category) return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
      <Text className="text-lg text-[#64748B]">Category not found</Text>
    </View>
  );

  if (!word) return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
      <Text className="text-lg text-[#64748B]">No words found!</Text>
    </View>
  );

  const progress = ((currentIndex) / words.length) * 100;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <LinearGradient colors={[colors.accent, '#4F46E5']} style={{ paddingTop: insets.top + 12 }} className="px-6 pb-8 rounded-b-[32px]">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="p-2 rounded-xl">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold capitalize">{category}</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="px-3 py-1.5 rounded-xl">
            <Text className="text-white font-bold">{currentIndex + 1}/{words.length}</Text>
          </View>
        </View>
        <ProgressBar progress={progress / 100} height={6} color="#FFFFFF" trackColor="rgba(255,255,255,0.3)" />
      </LinearGradient>

      <View className="flex-1 px-6 -mt-4">
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
          className="flex-1 justify-center"
        >
          <TouchableOpacity
            onPress={reveal}
            activeOpacity={0.9}
            style={{ backgroundColor: '#fff', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }} className="p-6 justify-start"
          >
            {!revealed ? (
              <View className="items-center">
                {loadingImg ? (
                  <ActivityIndicator size="large" color="#6366F1" style={{ height: 80 }} />
                ) : imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={{ width: '100%', aspectRatio: 16 / 9 }} className="rounded-xl mb-4" resizeMode="contain" />
                ) : (
                  <Text className="text-6xl mb-4 text-center" style={{ lineHeight: 72, paddingVertical: 4 }}>{word.image || '💡'}</Text>
                )}
                <Text className="text-3xl font-bold text-[#0F172A] text-center">{word.english}</Text>
                <Text className="text-base text-[#94A3B8] mt-4">Tap to reveal Nepali</Text>
              </View>
            ) : (
              <View className="items-center">
                {loadingImg ? (
                  <ActivityIndicator size="large" color="#6366F1" style={{ height: 80 }} />
                ) : imgUrl ? (
                  <Image source={{ uri: imgUrl }} style={{ width: '100%', aspectRatio: 16 / 9 }} className="rounded-xl mb-3" resizeMode="contain" />
                ) : (
                  <Text className="text-5xl mb-3 text-center" style={{ lineHeight: 56, paddingVertical: 4 }}>{word.image || '💡'}</Text>
                )}
                <Text className="text-4xl font-bold text-[#4F46E5] text-center mb-3">{word.nepali}</Text>
                <Text className="text-xl text-[#64748B] text-center">({word.roman})</Text>
                <TouchableOpacity
                  onPress={() => speakWord(word.nepali)}
                  className="mt-6 bg-[#EEF2FF] px-6 py-2 rounded-full flex-row items-center"
                >
                  <Text className="text-lg mr-2">🔊</Text>
                  <Text className="text-accent font-semibold">Pronounce</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center gap-3 mt-6">
            <TouchableOpacity
              onPress={goBack}
              disabled={currentIndex === 0}
              style={currentIndex === 0 ? {} : { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }} className={`p-4 rounded-2xl ${currentIndex === 0 ? 'bg-[#E2E8F0]' : 'bg-white'}`}
            >
              <Text className="text-2xl">⬅️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLearn}
              className="flex-1 bg-emerald-500 py-4 rounded-2xl flex-row justify-center items-center"
              style={{ shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
            >
              <Text className="text-white font-bold text-lg mr-2">✅</Text>
              <Text className="text-white font-bold text-lg">Learned</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goNext}
              className="flex-1 bg-accent py-4 rounded-2xl flex-row justify-center items-center"
              style={{ shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
            >
              <Text className="text-white font-bold text-lg mr-2">➡️</Text>
              <Text className="text-white font-bold text-lg">Next</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export default Flashcards;
