import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore } from '../src/data/vocab';
import { categories, getWordsByCategory, GUEST_ID } from '../src/data/vocab';

const Profile = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { isLearned } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const isGuest = !user;

  const totalLearned = categories.reduce((sum, cat) => {
    const words = getWordsByCategory(cat);
    return sum + words.filter(w => isLearned(uid, w.id)).length;
  }, 0);
  const xp = totalLearned * 100;
  const streak = Math.min(totalLearned, 15);

  const userName = user?.name || 'Guest';
  const firstName = userName.split(' ')[0];

  const preferences = [
    { label: 'Notifications', icon: 'notifications-outline', route: '/settings' },
    { label: 'App Settings', icon: 'settings-outline', route: '/settings' },
    { label: 'Help Center', icon: 'help-circle-outline', route: null },
    { label: 'About Himalayan Academy', icon: 'information-circle-outline', route: null },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-12 pb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#800816" />
          </TouchableOpacity>
          <Text className="text-[#800816] text-xl font-bold ml-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Profile</Text>
        </View>

        {/* Avatar & Greeting */}
        <View className="items-center mb-8">
          <View style={{ backgroundColor: '#E8E4DF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }} className="w-24 h-24 rounded-full items-center justify-center mb-4">
            <Ionicons name="person-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-[#1F2937] text-3xl font-bold mb-2" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Namaste, {firstName}</Text>
          <Text className="text-[#6B7280] text-sm">Continue your journey to mastery</Text>
        </View>

        {/* Save Progress Card (Guest Only) */}
        {isGuest && (
          <View className="px-5 mb-8">
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }} className="p-6">
              <Text className="text-[#1F2937] text-xl font-bold mb-3" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Save Your Progress</Text>
              <Text className="text-[#6B7280] text-sm mb-6 leading-5">Create an account to keep your {streak}-day streak and earned XP. Don't lose your hard-earned achievements.</Text>
              <TouchableOpacity style={{ backgroundColor: '#800816' }} className="py-4 rounded-full items-center" onPress={() => router.push('/signin')}>
                <Text className="text-white font-semibold text-base">Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View className="flex-row justify-between px-5 mb-8">
          <View style={{ backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }} className="flex-1 mx-2 py-5 rounded-2xl items-center">
            <Ionicons name="flame-outline" size={24} color="#B45309" />
            <Text className="text-[#6B7280] text-xs font-semibold mt-2 mb-1">STREAK</Text>
            <Text className="text-[#1F2937] text-xl font-bold">{streak} Days</Text>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }} className="flex-1 mx-2 py-5 rounded-2xl items-center">
            <Ionicons name="star-outline" size={24} color="#065F46" />
            <Text className="text-[#6B7280] text-xs font-semibold mt-2 mb-1">TOTAL XP</Text>
            <Text className="text-[#1F2937] text-xl font-bold">{xp.toLocaleString()}</Text>
          </View>
        </View>

        {/* Preferences */}
        <View className="px-5 mb-8">
          <Text className="text-[#4A1942] text-sm font-semibold mb-3 tracking-wider">PREFERENCES</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 }} className="overflow-hidden">
            {preferences.map((pref, i) => (
              <TouchableOpacity
                key={i}
                className="flex-row items-center px-5 py-4"
                style={{ borderBottomWidth: i < preferences.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
                onPress={() => pref.route && router.push(pref.route as any)}
              >
                <Ionicons name={pref.icon as any} size={22} color="#6B7280" />
                <Text className="text-[#1F2937] text-base ml-4 flex-1">{pref.label}</Text>
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
          <Text className="text-[#9CA3AF] text-xs">Version 2.4.0 • Built for Clarity</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeTab="profile" />
    </View>
  );
};

export default Profile;
