import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { GUEST_ID } from '../src/data/vocab';
import { getAchievementStatuses, type AchievementStatus } from '../src/data/achievements';

const Achievements = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const [statuses, setStatuses] = useState<AchievementStatus[]>([]);

  useEffect(() => {
    getAchievementStatuses(uid).then(setStatuses);
  }, [uid]);

  const unlocked = statuses.filter(s => s.unlocked).length;
  const total = statuses.length;

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-12 pb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#800816" />
          </TouchableOpacity>
          <Text className="text-[#800816] text-xl font-bold ml-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Achievements</Text>
        </View>

        {/* Progress Summary */}
        <View className="px-5 mb-8">
          <View style={{ backgroundColor: '#800816', borderRadius: 20 }} className="p-6 items-center">
            <Text className="text-white text-4xl font-bold mb-1">{unlocked}/{total}</Text>
            <Text className="text-white/80 text-sm">Achievements Unlocked</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="h-2 rounded-full w-full mt-4 overflow-hidden">
              <View style={{ width: total > 0 ? (unlocked / total) * 100 + '%' : '0%' }} className="h-full bg-white rounded-full" />
            </View>
          </View>
        </View>

        {/* Achievement List */}
        <View className="px-5">
          {statuses.map((ach, i) => (
            <View
              key={ach.achievement.id}
              className="flex-row items-center p-4 mb-3 rounded-2xl"
              style={{
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: ach.unlocked ? 0.08 : 0.04,
                shadowRadius: 8,
                elevation: ach.unlocked ? 3 : 1,
                opacity: ach.unlocked ? 1 : 0.6,
              }}
            >
              <View style={{ backgroundColor: ach.unlocked ? ach.achievement.bgColor : '#F3F4F6' }} className="w-14 h-14 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">{ach.unlocked ? ach.achievement.icon : '🔒'}</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-base font-bold ${ach.unlocked ? 'text-[#1F2937]' : 'text-[#9CA3AF]'}`}>
                  {ach.achievement.title}
                </Text>
                <Text className={`text-sm mt-1 ${ach.unlocked ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                  {ach.achievement.description}
                </Text>
              </View>
              {ach.unlocked && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Achievements;
