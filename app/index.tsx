import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { categories, getWordsByCategory, GUEST_ID } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';

const Home = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const clearUser = useAuthStore(s => s.clearUser);
  const { isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const [menuVisible, setMenuVisible] = useState(false);

  const totalLearned = categories.reduce((sum, cat) => {
    const words = getWordsByCategory(cat);
    return sum + words.filter(w => isLearned(uid, w.id)).length;
  }, 0);
  const totalWords = categories.reduce((sum, cat) => sum + getWordsByCategory(cat).length, 0);
  const xp = totalLearned * 100;
  const xpToNext = 1500;
  const level = Math.floor(totalLearned / 5) + 1;
  const streak = Math.min(totalLearned, 15);

  const userName = user?.name || 'Guest';
  const firstName = userName.split(' ')[0];

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View style={{ backgroundColor: '#E5E7EB' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-base">👤</Text>
              </View>
              <View>
                <Text className="text-[#4A1942] text-sm">Namaste,</Text>
                <Text className="text-[#800816] text-base font-bold">{userName}</Text>
              </View>
            </View>
            <View className="flex-row">
              <TouchableOpacity style={{ backgroundColor: '#F3F4F6' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-lg">🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#F3F4F6' }} className="w-10 h-10 rounded-full items-center justify-center" onPress={() => setMenuVisible(true)}>
                <Text className="text-lg">☰</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Modal */}
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View className="absolute top-12 right-5" style={{ backgroundColor: '#FFFFFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, width: 220 }}>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); router.push('/settings'); }}>
                <Text className="text-[#4A1942] text-base font-semibold">⚙️ Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); Alert.alert('Help & Support', 'Contact us at support@neplearn.com'); }}>
                <Text className="text-[#4A1942] text-base font-semibold">❓ Help & Support</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); Alert.alert('About', 'NepLearn v1.0.0\nYour journey through the peaks of wisdom.'); }}>
                <Text className="text-[#4A1942] text-base font-semibold">ℹ️ About</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3" onPress={() => { setMenuVisible(false); clearUser(); }}>
                <Text className="text-[#DC2626] text-base font-semibold">🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tagline */}
        <View className="px-5 pb-4">
          <Text className="text-[#4A1942] text-lg font-semibold">NepLearn</Text>
          <Text className="text-[#6B7280] text-sm">Your journey through the peaks of wisdom.</Text>
        </View>

        {/* Daily Streak Card */}
        <View className="px-5 mb-6">
          <View style={{ backgroundColor: '#800816', borderRadius: 24 }} className="px-5 py-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white/80 text-sm font-semibold tracking-wider">DAILY STREAK</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="w-12 h-12 rounded-full items-center justify-center">
                <Text className="text-2xl">🔥</Text>
              </View>
            </View>
            <Text className="text-white text-4xl font-bold mb-4">{streak} Days</Text>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white/90 text-sm">Level {level}: Apprentice</Text>
              <Text className="text-white/90 text-sm">{xp} / {xpToNext} XP</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="h-2 rounded-full overflow-hidden mb-5">
              <View className="h-full rounded-full" style={{ width: `${Math.min((xp / xpToNext) * 100, 100)}%`, backgroundColor: '#F59E0B' }} />
            </View>
            <Link href="/profile" asChild>
              <TouchableOpacity style={{ backgroundColor: '#FFFFFF' }} className="py-3 rounded-full items-center">
                <Text className="text-[#800816] font-bold text-base">View Achievements</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Continue Learning */}
        <View className="px-5 mb-6">
          <Text className="text-[#4A1942] text-base font-semibold mb-3">CONTINUE LEARNING</Text>
          <Link href="/lesson" asChild>
            <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5D5D0' }} className="p-4 flex-row items-center">
              <View style={{ backgroundColor: '#800816' }} className="w-20 h-20 rounded-xl items-center justify-center mr-4">
                <Text className="text-3xl">▶️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#6B7280] text-xs mb-1">Basics of Devanagari</Text>
                <Text className="text-[#4A1942] text-sm font-semibold mb-2">Lesson 4: Vowel Markers (Matras)</Text>
                <Text className="text-[#92400E] text-sm font-semibold">8 mins left</Text>
              </View>
              <Text className="text-[#800816] text-xl">→</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Daily Challenges */}
        <View className="px-5 mb-6">
          <Text className="text-[#4A1942] text-base font-semibold mb-3">DAILY CHALLENGES</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E5D5D0' }} className="overflow-hidden">
            {/* Morning Vocab */}
            <TouchableOpacity className="p-4 flex-row items-center border-b" style={{ borderColor: '#E5D5D0' }}>
              <View style={{ backgroundColor: '#FEE2E2' }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-xl">文A</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#4A1942] text-sm font-semibold mb-1">Morning Vocab</Text>
                <Text className="text-[#6B7280] text-xs">Review 10 new mountain-related terms</Text>
              </View>
              <Text className="text-[#065F46] text-sm font-bold mr-2">+50 XP</Text>
              <Text className="text-[#800816]">›</Text>
            </TouchableOpacity>

            {/* Echo Practice */}
            <TouchableOpacity className="p-4 flex-row items-center border-b" style={{ borderColor: '#E5D5D0' }}>
              <View style={{ backgroundColor: '#FEF3C7' }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-xl"></Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#4A1942] text-sm font-semibold mb-1">Echo Practice</Text>
                <Text className="text-[#6B7280] text-xs">Pronounce 5 phrases with perfect pitch</Text>
              </View>
              <Text className="text-[#065F46] text-sm font-bold mr-2">+30 XP</Text>
              <Text className="text-[#800816]">›</Text>
            </TouchableOpacity>

            {/* Journal Prompt */}
            <TouchableOpacity className="p-4 flex-row items-center">
              <View style={{ backgroundColor: '#D1FAE5' }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-xl">📝</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#9CA3AF] text-sm font-semibold mb-1">Journal Prompt</Text>
                <Text className="text-[#9CA3AF] text-xs">Write 3 sentences about your day</Text>
              </View>
              <Text className="text-[#6B7280] mr-2">✓</Text>
              <Text className="text-[#6B7280]">›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ backgroundColor: '#FBF9F4', borderTopWidth: 1, borderTopColor: '#E5D5D0' }} className="flex-row items-center px-4 pb-6 pt-3">
        <View className="flex-1 items-center">
          <Text className="text-[#800816] text-xl">🏠</Text>
          <Text className="text-[#800816] text-xs mt-1 font-semibold">HOME</Text>
        </View>
        <View className="flex-1 items-center">
          <Link href="/learn" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">📖</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">LEARN</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center -mt-4">
          <View style={{ backgroundColor: '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }} className="w-14 h-14 rounded-full items-center justify-center">
            <Text className="text-white text-2xl font-bold">+</Text>
          </View>
        </View>
        <View className="flex-1 items-center">
          <Link href="/ai-tutor" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl"></Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">AI TUTOR</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center">
          <Link href="/profile" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">👤</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">PROFILE</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

export default Home;
