import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const heatmapData = [
  [0, 1, 1, 0.5, 0, 1, 1],
  [1, 0.8, 1, 0.4, 0.8, 1, 1],
  [1, 0, 0, 0, 0, 0, 0],
];

const achievements = [
  { id: 1, title: 'Early Bird', desc: '50 morning sessions completed', icon: '️', bg: '#FEF3C7', unlocked: true },
  { id: 2, title: 'Culture Explorer', desc: 'Mastered 10 festival units', icon: '🏛️', bg: '#D1FAE5', unlocked: true },
  { id: 3, title: 'Grammar Guru', desc: 'Requires Level 15', icon: '🔒', bg: '#F3F4F6', unlocked: false },
];

const Profile = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
          <TouchableOpacity>
            <Text className="text-[#800816] text-xl">☰</Text>
          </TouchableOpacity>
          <Text className="text-[#800816] text-lg font-bold">NepLearn</Text>
          <View style={{ backgroundColor: '#FEF3C7' }} className="px-3 py-1 rounded-full">
            <Text className="text-[#92400E] text-xs font-semibold">12 Day Streak</Text>
          </View>
        </View>

        {/* Profile Info */}
        <View className="items-center mb-6">
          <View style={{ backgroundColor: '#E5D5D0' }} className="w-20 h-20 rounded-full items-center justify-center mb-3">
            <Text className="text-3xl">👨</Text>
          </View>
          <Text className="text-[#4A1942] text-2xl font-bold">Namaste, Arjun</Text>
          <Text className="text-[#6B7280] text-sm mt-1">Intermediate Learner • Oct 2023</Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between px-5 mb-6">
          {[
            { label: 'LEVEL', value: '14', color: '#800816' },
            { label: 'RANK', value: '#12', color: '#92400E' },
            { label: 'XP', value: '2,840', color: '#065F46' },
          ].map((stat, i) => (
            <View key={i} style={{ backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }} className="flex-1 mx-1 py-3 rounded-xl items-center">
              <Text className="text-[#6B7280] text-xs font-semibold mb-1">{stat.label}</Text>
              <Text style={{ color: stat.color }} className="text-lg font-bold">{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Fluency Peak Card */}
        <View className="px-5 mb-6">
          <View style={{ backgroundColor: '#F3F0EB', borderRadius: 20 }} className="p-5 items-center">
            <View className="flex-row items-center justify-between w-full mb-4">
              <View>
                <Text className="text-[#4A1942] text-lg font-bold">Fluency Peak</Text>
                <Text className="text-[#6B7280] text-sm">Current Path: Social Situations</Text>
              </View>
              <View style={{ backgroundColor: '#FEE2E2' }} className="w-10 h-10 rounded-full items-center justify-center">
                <Text className="text-[#800816]">⛰️</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#800816' }} className="w-16 h-16 rounded-full items-center justify-center mb-3">
              <Text className="text-white text-2xl"></Text>
            </View>
            <TouchableOpacity>
              <Text className="text-[#800816] font-bold underline">Continue Journey</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consistency */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#4A1942] text-lg font-bold">Consistency</Text>
            <TouchableOpacity>
              <Text className="text-[#800816] text-sm font-semibold">View Heatmap</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }} className="p-4">
            {/* Heatmap Header */}
            <View className="flex-row justify-between mb-2 px-2">
              {days.map((d, i) => (
                <Text key={i} className="text-[#9CA3AF] text-xs font-semibold w-8 text-center">{d}</Text>
              ))}
            </View>
            {/* Heatmap Grid */}
            {heatmapData.map((row, rIdx) => (
              <View key={rIdx} className="flex-row justify-between mb-2">
                {row.map((val, cIdx) => (
                  <View key={cIdx} style={{ backgroundColor: val === 0 ? '#F3F4F6' : val === 1 ? '#800816' : '#C4A3A8', width: 32, height: 32, borderRadius: 6 }} />
                ))}
              </View>
            ))}
            {/* Progress Bar */}
            <View className="mt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-[#4A1942] text-sm font-semibold">Daily Goal Progress</Text>
                <Text className="text-[#800816] text-sm font-bold">85%</Text>
              </View>
              <View style={{ backgroundColor: '#F3F4F6' }} className="h-2 rounded-full overflow-hidden">
                <View style={{ width: '85%', backgroundColor: '#800816' }} className="h-full rounded-full" />
              </View>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View className="px-5 mb-6">
          <Text className="text-[#4A1942] text-lg font-bold mb-3">Achievements</Text>
          {achievements.map((ach) => (
            <View key={ach.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }} className="flex-row items-center p-4 mb-3">
              <View style={{ backgroundColor: ach.bg }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                <Text className="text-xl">{ach.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-base font-bold ${ach.unlocked ? 'text-[#4A1942]' : 'text-[#9CA3AF]'}`}>{ach.title}</Text>
                <Text className={`text-sm ${ach.unlocked ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>{ach.desc}</Text>
              </View>
              <Text className="text-[#9CA3AF] text-lg">›</Text>
            </View>
          ))}
          <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5D5D0' }} className="py-3 items-center mt-2">
            <Text className="text-[#4A1942] font-semibold">View All 24 Badges</Text>
          </TouchableOpacity>
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
          <Link href="/ai-tutor" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">🤖</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">AI Tutor</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-[#800816] text-xl">👤</Text>
          <Text className="text-[#800816] text-xs mt-1 font-semibold">Profile</Text>
        </View>
      </View>
    </View>
  );
};

export default Profile;
