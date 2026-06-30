import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';

type Notification = {
  id: string;
  type: 'learning' | 'community' | 'achievement' | 'weekly';
  title: string;
  time: string;
  description: string;
  read: boolean;
  actionLabel?: string;
  progress?: { current: number; total: number; label: string };
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'learning',
    title: 'Learning Reminder',
    time: '2m ago',
    description: "Time for your daily Dashain greeting practice! Keep your progress going.",
    read: true,
    actionLabel: 'Start Lesson',
  },
  {
    id: '2',
    type: 'community',
    title: 'Community Update',
    time: '1h ago',
    description: 'Aama has a new story for you',
    read: false,
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Achievement Unlocked',
    time: '3h ago',
    description: "Magnificent! You've reached a 15-day streak! Your dedication reflects the mountain's endurance.",
    read: true,
    progress: { current: 15, total: 20, label: 'Gold Tier Progress' },
  },
  {
    id: '4',
    type: 'weekly',
    title: 'Weekly Roundup',
    time: 'Yesterday',
    description: 'See how your friends are doing this week in the Himalayan Learners Circle.',
    read: true,
  },
];

const ICON_BG: Record<string, string> = {
  learning: '#FDE8E8',
  community: '#FEF3C7',
  achievement: '#D1FAE5',
  weekly: '#E5E7EB',
};

const ICON_NAME: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  learning: 'school-outline',
  community: 'book-outline',
  achievement: 'trophy-outline',
  weekly: 'people-outline',
};

const ICON_COLOR: Record<string, string> = {
  learning: '#800816',
  community: '#92400E',
  achievement: '#065F46',
  weekly: '#6B7280',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      {/* Header */}
      <View className="px-5 pt-12 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#4A1942" />
          </TouchableOpacity>
          <Text className="text-[#4A1942] text-2xl font-bold">Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={24} color="#4A1942" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Section Header */}
        <View className="px-5 flex-row items-center justify-between mb-4">
          <Text className="text-[#6B7280] text-xs font-semibold tracking-wider">RECENT ACTIVITY</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text className="text-[#800816] text-sm font-semibold">Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Cards */}
        <View className="px-5">
          {notifications.map((notification) => (
            <View
              key={notification.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5D5D0',
                marginBottom: 16,
                opacity: notification.read ? 1 : 0.95,
              }}
              className="p-4"
            >
              <View className="flex-row items-start">
                {/* Icon */}
                <View
                  style={{ backgroundColor: ICON_BG[notification.type] }}
                  className="w-12 h-12 rounded-full items-center justify-center mr-3"
                >
                  <Ionicons name={ICON_NAME[notification.type]} size={22} color={ICON_COLOR[notification.type]} />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[#800816] text-base font-bold">{notification.title}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-[#9CA3AF] text-xs mr-2">{notification.time}</Text>
                      {!notification.read && (
                        <View style={{ backgroundColor: '#DC2626' }} className="w-2 h-2 rounded-full" />
                      )}
                    </View>
                  </View>
                  <Text className="text-[#4A1942] text-sm mb-2">{notification.description}</Text>

                  {/* Action Button */}
                  {notification.actionLabel && (
                    <TouchableOpacity
                      style={{ backgroundColor: '#800816' }}
                      className="py-2 px-5 rounded-full self-start mt-1"
                    >
                      <Text className="text-white text-sm font-bold">{notification.actionLabel}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Progress Bar */}
                  {notification.progress && (
                    <View className="mt-2">
                      <View style={{ backgroundColor: '#E5E7EB' }} className="h-2 rounded-full overflow-hidden mb-2">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${(notification.progress.current / notification.progress.total) * 100}%`,
                            backgroundColor: '#F59E0B',
                          }}
                        />
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[#6B7280] text-xs">{notification.progress.current} / {notification.progress.total} days</Text>
                        <Text className="text-[#92400E] text-xs font-semibold">{notification.progress.label}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View>
        <BottomNav activeTab="home" />
        <View style={{ position: 'absolute', top: -24, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
          <TouchableOpacity onPress={() => {}}>
            <View style={{ backgroundColor: '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }} className="w-14 h-14 rounded-full items-center justify-center">
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
