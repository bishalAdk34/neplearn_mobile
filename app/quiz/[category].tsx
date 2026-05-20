import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { vocab, getWordsByCategory, shuffle, GUEST_ID } from '../../src/data/vocab';
import { speak } from '../../src/services/tts';
import { getWordImage } from '../../src/services/image';
import { useVocabStore } from '../../src/data/vocab';
import { useAuthStore } from '../../src/stores/auth';

const Quiz = () => {
  const params = useGlobalSearchParams();
  const category = typeof params.category === 'string' ? params.category : '';
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { learnWord, isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const words = shuffle(getWordsByCategory(category)).slice(0, 10);
    const qData = words.map(word => {
      const allNepali = vocab.map(w => w.nepali).filter(n => n !== word.nepali);
      const wrong = shuffle(allNepali).slice(0, 3);
      const options = shuffle([word.nepali, ...wrong]);
      return { ...word, options };
    });
    setQuestions(qData);
  }, [category]);

  useEffect(() => {
    setSelected(null);
    scaleAnim.setValue(1);
  }, [currentQ]);

  const q = questions[currentQ];

  useEffect(() => {
    if (q) {
      if (q.image?.startsWith('http')) {
        setImgUrl(q.image);
        setLoadingImg(false);
      } else {
        setImgUrl(null);
        setLoadingImg(true);
        getWordImage(q.english).then(url => {
          setImgUrl(url);
          setLoadingImg(false);
        });
      }
    }
  }, [q]);

  const selectAnswer = (opt: string) => {
    if (selected) return;
    setSelected(opt);

    const correct = opt === q?.nepali;
    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      if (!isLearned(uid, q.id)) learnWord(uid, q.id);
      Animated.spring(scaleAnim, { toValue: 1.05, friction: 3, useNativeDriver: true }).start();
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        router.replace('/progress');
      }
    }, correct ? 600 : 1200);
  };

  const speakWord = () => {
    if (q) speak(q.english, 'en-US');
  };

  if (!q) return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
      <Text className="text-lg text-[#64748B]">Loading...</Text>
    </View>
  );

  const progress = ((currentQ) / questions.length) * 100;
  const isCorrect = (opt: string) => selected && opt === q.nepali;
  const isWrong = (opt: string) => selected && opt !== q.nepali && opt === selected;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <LinearGradient colors={['#6366F1', '#4F46E5']} className="px-6 pt-16 pb-8 rounded-b-[32px]">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="p-2 rounded-xl">
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Text className="text-yellow-300 text-lg mr-1">⭐</Text>
            <Text className="text-white text-lg font-bold">{score}/{currentQ}</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="px-3 py-1.5 rounded-xl">
            <Text className="text-white font-bold">{currentQ + 1}/{questions.length}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} className="h-1.5 rounded-full overflow-hidden">
          <View className="h-full bg-white rounded-full" style={{ width: progress + '%' as any }} />
        </View>
      </LinearGradient>

      <Animated.View
        style={{ transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }}
        className="flex-1 px-6 -mt-4"
      >
        <View style={{ backgroundColor: '#fff', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }} className="p-8 mt-6 items-center">
          <Text className="text-sm uppercase tracking-widest text-[#94A3B8] font-semibold mb-2">
            What does this mean?
          </Text>
          {loadingImg ? (
            <ActivityIndicator size="large" color="#6366F1" style={{ height: 80 }} />
          ) : imgUrl ? (
            <Image source={{ uri: imgUrl }} style={{ width: '100%', aspectRatio: 16 / 9 }} className="rounded-xl mb-3" resizeMode="contain" />
          ) : (
            <Text className="text-5xl mb-2">{q.image || '💡'}</Text>
          )}
          <TouchableOpacity onPress={speakWord} className="flex-row items-center mb-6">
            <Text className="text-3xl font-bold text-[#0F172A] mr-2">{q.english}</Text>
            <Text className="text-2xl">🔊</Text>
          </TouchableOpacity>

          <View className="w-full gap-3">
            {q.options.map((opt: string, i: number) => {
              let bgColor = 'bg-[#F8FAFC]';
              let borderColor = 'border-[#E2E8F0]';
              let textColor = 'text-[#0F172A]';

              if (selected) {
                if (opt === q.nepali) {
                  bgColor = 'bg-emerald-50';
                  borderColor = 'border-emerald-500';
                  textColor = 'text-emerald-700';
                } else if (opt === selected) {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-red-400';
                  textColor = 'text-red-600';
                }
              }

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => selectAnswer(opt)}
                  disabled={!!selected}
                  className={`${bgColor} ${borderColor} border-2 py-4 px-5 rounded-2xl flex-row items-center`}
                >
                  <View className={`w-8 h-8 rounded-full ${selected ? (opt === q.nepali ? 'bg-emerald-500' : opt === selected ? 'bg-red-400' : 'bg-[#E2E8F0]') : 'bg-[#E2E8F0]'} items-center justify-center mr-3`}>
                    <Text className={`font-bold ${selected ? 'text-white' : 'text-[#64748B]'}`}>
                      {opt === q.nepali && selected ? '✓' : opt === selected && selected ? '✗' : String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text className={`text-lg font-semibold flex-1 ${selected ? (opt === q.nepali ? 'text-emerald-700' : opt === selected ? 'text-red-600' : 'text-[#64748B]') : 'text-[#0F172A]'}`}>
                    {opt}
                  </Text>
                  {opt === q.nepali && selected && (
                    <Text className="text-emerald-500 text-xl">✅</Text>
                  )}
                  {opt === selected && selected !== q.nepali && (
                    <Text className="text-red-400 text-xl">❌</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {!selected && (
          <View className="items-center mt-8">
            <Text className="text-[#94A3B8] text-sm">Choose the correct Nepali translation</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default Quiz;
