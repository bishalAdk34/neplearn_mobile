import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { QuickActionsModal } from '@/src/components/QuickActionsModal';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore } from '../src/data/vocab';
import { categories, getWordsByCategory, GUEST_ID } from '../src/data/vocab';
import { getTotalXp, getStreak } from '../src/services/db';
import { getAchievementStatuses, type AchievementStatus } from '../src/data/achievements';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';

const Profile = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const isGuest = !user;
  const [cloudXp, setCloudXp] = useState<number | null>(null);
  const [cloudStreak, setCloudStreak] = useState<{ current_streak: number; longest_streak: number } | null>(null);
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const totalLearned = categories.reduce((sum, cat) => {
    const words = getWordsByCategory(cat);
    return sum + words.filter(w => isLearned(uid, w.id)).length;
  }, 0);

  useEffect(() => {
    if (!isGuest) {
      getTotalXp(uid).then(setCloudXp).catch(() => setCloudXp(null));
      getStreak(uid).then(setCloudStreak).catch(() => setCloudStreak(null));
    }
    getAchievementStatuses(uid)
      .then(setAchievements)
      .catch(e => console.warn('Failed to load achievements:', e));
  }, [isGuest, uid]);

  const localXp = useVocabStore.getState().getLocalXp(uid);
  const localStreak = useVocabStore.getState().getLocalStreak(uid);
  const xp = isGuest ? localXp : (cloudXp ?? 0);
  const streak = isGuest ? localStreak.current : (cloudStreak?.current_streak ?? 0);

  const userName = user?.name || 'Guest';
  const firstName = userName.split(' ')[0];

  const preferences: { label: string; icon: string; route: string | null; onPress?: () => void }[] = [
    { label: 'View Heatmap', icon: 'grid-outline', route: '/heatmap' },
    { label: 'Notifications', icon: 'notifications-outline', route: '/settings' },
    { label: 'App Settings', icon: 'settings-outline', route: '/settings' },
    { label: 'Help Center', icon: 'help-circle-outline', route: '/help' },
    { label: 'About NepLearn', icon: 'information-circle-outline', route: '/about' },
  ];

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ScreenHeader title="Profile" backIcon="back" />

        {/* Avatar & Greeting */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#E8E4DF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
            <Ionicons name="person-outline" size={40} color={colors.textTertiary} />
          </View>
          <Text className="text-3xl font-bold mb-2" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1F2937' }}>Namaste, {firstName}</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm">Continue your journey to mastery</Text>
        </View>

        {/* Save Progress Card (Guest Only) */}
        {isGuest && (
          <View className="px-5 mb-8">
            <View className="bg-white p-6" style={{ borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
              <Text className="text-xl font-bold mb-3" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: '#1F2937' }}>Save Your Progress</Text>
              <Text className="text-sm mb-6 leading-5" style={{ color: colors.textSecondary }}>Create an account to keep your {streak}-day streak and earned XP. Don't lose your hard-earned achievements.</Text>
              <TouchableOpacity className="bg-brand py-4 rounded-full items-center" onPress={() => router.push('/signin')}>
                <Text className="text-white font-semibold text-base">Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View className="flex-row justify-between px-5 mb-8">
          <View className="bg-white flex-1 mx-2 py-5 rounded-2xl items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Ionicons name="flame-outline" size={24} color="#B45309" />
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold mt-2 mb-1">STREAK</Text>
            <Text className="text-xl font-bold" style={{ color: '#1F2937' }}>{streak} Days</Text>
          </View>
          <View className="bg-white flex-1 mx-2 py-5 rounded-2xl items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <Ionicons name="star-outline" size={24} color={colors.successDark} />
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold mt-2 mb-1">TOTAL XP</Text>
            <Text className="text-xl font-bold" style={{ color: '#1F2937' }}>{xp.toLocaleString()}</Text>
          </View>
        </View>

        {/* Achievements */}
        <View className="px-5 mb-8">
          <Text className="text-ink text-sm font-semibold mb-3 tracking-wider">ACHIEVEMENTS</Text>
          <View className="bg-white overflow-hidden" style={{ borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 }}>
            {achievements.slice(0, 3).map((ach, i) => (
              <View
                key={ach.achievement.id}
                className="flex-row items-center px-5 py-4"
                style={{ borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
              >
                <View style={{ backgroundColor: ach.unlocked ? ach.achievement.bgColor : colors.mutedSurface }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                  <Text className="text-xl">{ach.unlocked ? ach.achievement.icon : '🔒'}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-bold`} style={{ color: ach.unlocked ? '#1F2937' : colors.textTertiary }}>{ach.achievement.title}</Text>
                  <Text className="text-sm" style={{ color: ach.unlocked ? colors.textSecondary : colors.textTertiary }}>{ach.achievement.description}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              className="py-4 items-center"
              style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
              onPress={() => router.push('/achievements')}
            >
              <Text className="text-brand font-semibold">View All Achievements</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences */}
        <View className="px-5 mb-8">
          <Text className="text-ink text-sm font-semibold mb-3 tracking-wider">PREFERENCES</Text>
          <View className="bg-white overflow-hidden" style={{ borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 }}>
            {preferences.map((pref, i) => (
              <TouchableOpacity
                key={i}
                className="flex-row items-center px-5 py-4"
                style={{ borderBottomWidth: i < preferences.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
                onPress={() => {
                  if (pref.onPress) pref.onPress();
                  else if (pref.route) router.push(pref.route as any);
                }}
              >
                <Ionicons name={pref.icon as any} size={22} color={colors.textSecondary} />
                <Text className="text-base ml-4 flex-1" style={{ color: '#1F2937' }}>{pref.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#D4C4B7" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-6">
          <View style={{ backgroundColor: '#D4C4B7' }} className="w-20 h-20 rounded-lg items-center justify-center mb-3">
            <Text className="text-2xl">️</Text>
          </View>
          <Text className="text-[#9CA3AF] text-xs">Version 1.0.0 • NepLearn</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View>
        <BottomNav activeTab="profile" />
        <View style={{ position: 'absolute', top: -24, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
          <TouchableOpacity onPress={() => setQuickActionsVisible(true)}>
            <View style={{ backgroundColor: '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }} className="w-14 h-14 rounded-full items-center justify-center">
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <QuickActionsModal visible={quickActionsVisible} onClose={() => setQuickActionsVisible(false)} />
    </View>
  );
};

export default Profile;
