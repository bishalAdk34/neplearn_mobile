import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(onFinish);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient colors={['#6366F1', '#4F46E5']} className="flex-1 items-center justify-center">
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="items-center">
          <View className="w-24 h-24 bg-white/20 rounded-3xl items-center justify-center mb-6">
            <Text className="text-5xl">🇳🇵</Text>
          </View>
          <Text className="text-4xl font-bold text-white tracking-wide">NepLearn</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }} className="text-lg mt-2">
            Learn Nepali, one word at a time
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}
