import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { colors } from '../src/theme';
import { ScreenHeader, EmptyState, LoadingSkeleton } from '../src/components/ui';
import {
  getScheduledReminders,
  getNotificationLog,
  clearNotificationLog,
  ScheduledReminder,
  NotificationLogEntry,
} from '../src/services/notifications';

function formatTime(hour: number | null, minute: number | null): string {
  if (hour === null || minute === null) return 'Scheduled';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm} daily`;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [log, setLog] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getScheduledReminders(), getNotificationLog()])
        .then(([reminders, entries]) => {
          if (!active) return;
          setScheduled(reminders);
          setLog(entries);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const handleClearLog = async () => {
    await clearNotificationLog();
    setLog([]);
  };

  const isEmpty = scheduled.length === 0 && log.length === 0;

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader
        title="Notifications"
        backIcon="back"
        right={
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.ink} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View className="px-5">
          <LoadingSkeleton height={80} style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={80} style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={80} />
        </View>
      ) : isEmpty ? (
        <EmptyState
          emoji="🔔"
          title="No notifications yet"
          message="Turn on daily reminders in Settings and your notifications will show up here."
          actionLabel="Open Settings"
          onAction={() => router.push('/settings')}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Scheduled reminders */}
          {scheduled.length > 0 && (
            <>
              <View className="px-5 mb-3">
                <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold tracking-wider">UPCOMING REMINDERS</Text>
              </View>
              <View className="px-5">
                {scheduled.map(reminder => (
                  <View
                    key={reminder.identifier}
                    className="bg-white border border-line p-4 flex-row items-start"
                    style={{ borderRadius: 16, marginBottom: 16 }}
                  >
                    <View style={{ backgroundColor: '#FDE8E8' }} className="w-12 h-12 rounded-full items-center justify-center mr-3">
                      <Ionicons name="alarm-outline" size={22} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-brand text-base font-bold flex-1 mr-2" numberOfLines={1}>{reminder.title}</Text>
                        <Text style={{ color: colors.textTertiary }} className="text-xs">{formatTime(reminder.hour, reminder.minute)}</Text>
                      </View>
                      <Text className="text-ink text-sm">{reminder.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Delivered log */}
          {log.length > 0 && (
            <>
              <View className="px-5 flex-row items-center justify-between mb-3">
                <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold tracking-wider">RECENT ACTIVITY</Text>
                <TouchableOpacity onPress={handleClearLog}>
                  <Text className="text-brand text-sm font-semibold">Clear</Text>
                </TouchableOpacity>
              </View>
              <View className="px-5">
                {log.map(entry => (
                  <View
                    key={entry.id}
                    className="bg-white border border-line p-4 flex-row items-start"
                    style={{ borderRadius: 16, marginBottom: 16 }}
                  >
                    <View style={{ backgroundColor: '#D1FAE5' }} className="w-12 h-12 rounded-full items-center justify-center mr-3">
                      <Ionicons name="notifications-outline" size={22} color={colors.successDark} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-brand text-base font-bold flex-1 mr-2" numberOfLines={1}>{entry.title}</Text>
                        <Text style={{ color: colors.textTertiary }} className="text-xs">{timeAgo(entry.receivedAt)}</Text>
                      </View>
                      <Text className="text-ink text-sm">{entry.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <BottomNav activeTab="home" />
    </View>
  );
}
