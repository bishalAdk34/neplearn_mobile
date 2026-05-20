import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Link } from 'expo-router';

const AITutor = () => {
  const [isListening, setIsListening] = useState(true);
  const animValues = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.6),
    new Animated.Value(1),
    new Animated.Value(0.5),
    new Animated.Value(0.8),
  ]).current;

  useEffect(() => {
    if (!isListening) return;
    const animations = animValues.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 400 + i * 100,
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 400 + i * 100,
            useNativeDriver: false,
          }),
        ])
      )
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  }, [isListening]);

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <View className="flex-row items-center">
          <Link href="/" asChild>
            <TouchableOpacity className="mr-3">
              <Text className="text-[#800816] text-xl">‹</Text>
            </TouchableOpacity>
          </Link>
          <View>
            <Text className="text-[#4A1942] text-lg font-bold">AI Tutor</Text>
            <View className="flex-row items-center">
              <View style={{ backgroundColor: '#10B981' }} className="w-2 h-2 rounded-full mr-1" />
              <Text className="text-[#10B981] text-xs">Online</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center">
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D5D0' }} className="flex-row items-center px-3 py-1.5 rounded-full mr-3">
            <Text className="text-[#F59E0B] mr-1">🔥</Text>
            <Text className="text-[#4A1942] text-sm font-bold">12</Text>
          </View>
          <TouchableOpacity>
            <Text className="text-[#6B7280] text-xl">⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Tutor Profile */}
        <View className="items-center mb-6">
          <View style={{ backgroundColor: '#E5D5D0' }} className="w-24 h-24 rounded-full items-center justify-center mb-3">
            <Text className="text-4xl">👩</Text>
          </View>
          <Text className="text-[#4A1942] text-2xl font-bold mb-1">Aama</Text>
          <Text className="text-[#6B7280] text-sm">Native Speaker & Language Expert</Text>
        </View>

        {/* Chat Bubble */}
        <View className="px-5 mb-4">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderBottomLeftRadius: 4 }} className="p-4">
            <Text className="text-[#4A1942] text-base mb-2">"तपाईंलाई कस्तो छ?" (Tapāīlāī kasto cha?)</Text>
            <Text className="text-[#800816] text-base font-semibold">How are you doing today?</Text>
          </View>
        </View>

        {/* Aama's Tip */}
        <View className="px-5 mb-6">
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 16 }} className="p-4">
            <View className="flex-row items-start">
              <View style={{ backgroundColor: '#FDE68A' }} className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5">
                <Text className="text-lg">💡</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#92400E] text-sm font-bold mb-2">AAMA'S TIP</Text>
                <Text className="text-[#78350F] text-sm leading-5">
                  In Nepali, we use <Text className="font-bold">तपाईं (Tapāī)</Text> for respect. Try replying: <Text className="italic">"Sanchai chu, dhanyabaad!"</Text>
                </Text>
              </View>
              <TouchableOpacity className="absolute top-2 right-2">
                <Text className="text-[#9CA3AF] text-lg">✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Cards */}
        <View className="px-5 mb-6">
          <View className="flex-row">
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5D5D0' }} className="flex-1 p-4 mr-2 items-center">
              <View style={{ backgroundColor: '#FEE2E2' }} className="w-12 h-12 rounded-full items-center justify-center mb-3">
                <Text className="text-xl">文A</Text>
              </View>
              <Text className="text-[#6B7280] text-xs mb-1">VOCABULARY</Text>
              <Text className="text-[#4A1942] text-base font-bold">Essentials</Text>
            </View>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5D5D0' }} className="flex-1 p-4 ml-2 items-center">
              <View style={{ backgroundColor: '#FEF3C7' }} className="w-12 h-12 rounded-full items-center justify-center mb-3">
                <Text className="text-xl">📖</Text>
              </View>
              <Text className="text-[#6B7280] text-xs mb-1">SCRIPT</Text>
              <Text className="text-[#4A1942] text-base font-bold">Devanagari</Text>
            </View>
          </View>
        </View>

        {/* Microphone Button */}
        <View className="items-center mb-4">
          <View style={{ backgroundColor: '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }} className="w-20 h-20 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-3xl">🎤</Text>
          </View>
          <Text className="text-[#800816] text-sm font-bold mb-4">AAMA IS LISTENING...</Text>
          <View className="flex-row items-center justify-center">
            {animValues.map((val, i) => (
              <Animated.View
                key={i}
                style={{
                  width: 4,
                  height: 24,
                  marginHorizontal: 3,
                  borderRadius: 2,
                  backgroundColor: i === 2 ? '#800816' : '#D4D4D8',
                  transform: [{ scaleY: val }],
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ backgroundColor: '#FBF9F4', borderTopWidth: 1, borderTopColor: '#E5D5D0' }} className="flex-row items-center px-4 pb-6 pt-3">
        <View className="flex-1 items-center">
          <Link href="/" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">🏠</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">Home</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center">
          <Link href="/learn" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">🔍</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">Explore</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-[#800816] text-xl">🤖</Text>
          <Text className="text-[#800816] text-xs mt-1 font-semibold">AI Tutor</Text>
        </View>
        <View className="flex-1 items-center">
          <Link href="/profile" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">👤</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">Profile</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

export default AITutor;
