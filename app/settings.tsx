import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, GUEST_ID } from '../src/data/vocab';
import { useSettingsStore, TtsSpeed } from '../src/stores/settings';
import { supabase } from '../src/services/supabase';
import {
  getPrefs,
  savePrefs,
  requestPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleWordOfDay,
  cancelWordOfDay,
  sendTestNotification,
} from '../src/services/notifications';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';

const SPEED_OPTIONS: { label: string; value: TtsSpeed }[] = [
  { label: 'Slow', value: 'slow' },
  { label: 'Normal', value: 'normal' },
  { label: 'Fast', value: 'fast' },
];

const GOAL_OPTIONS = [
  { label: 'Casual — 25 XP / day', value: 25 },
  { label: 'Regular — 50 XP / day', value: 50 },
  { label: 'Serious — 100 XP / day', value: 100 },
];

const TIME_OPTIONS = [
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '10:00 AM', hour: 10, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '3:00 PM', hour: 15, minute: 0 },
  { label: '5:35 PM', hour: 17, minute: 35 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '8:00 PM', hour: 20, minute: 0 },
];

const WOD_HOUR_OPTIONS = [
  { label: '7:00 AM', hour: 7 },
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '10:00 AM', hour: 10 },
  { label: '12:00 PM', hour: 12 },
  { label: '6:00 PM', hour: 18 },
  { label: '8:00 PM', hour: 20 },
];

const Settings = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const { getLearned } = useVocabStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(17);
  const [reminderMinute, setReminderMinute] = useState(35);
  const [wordOfDayEnabled, setWordOfDayEnabled] = useState(false);
  const [wordOfDayHour, setWordOfDayHour] = useState(9);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [wodPickerVisible, setWodPickerVisible] = useState(false);
  const [speedPickerVisible, setSpeedPickerVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const ttsSpeed = useSettingsStore(s => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore(s => s.setTtsSpeed);
  const dailyGoalXp = useSettingsStore(s => s.dailyGoalXp);
  const setDailyGoalXp = useSettingsStore(s => s.setDailyGoalXp);

  const currentStreak = useVocabStore.getState().getLocalStreak(uid).current;

  useEffect(() => {
    getPrefs().then(prefs => {
      setNotificationsEnabled(prefs.enabled);
      setReminderHour(prefs.reminderHour);
      setReminderMinute(prefs.reminderMinute);
      setWordOfDayEnabled(prefs.wordOfDayEnabled);
      setWordOfDayHour(prefs.wordOfDayHour);
    });
  }, []);

  const timeLabel = TIME_OPTIONS.find(
    t => t.hour === reminderHour && t.minute === reminderMinute
  )?.label || `${reminderHour}:${String(reminderMinute).padStart(2, '0')}`;

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Enable notifications in your device settings to receive practice reminders.');
        return;
      }
      await scheduleDailyReminder(reminderHour, reminderMinute, currentStreak);
    } else {
      await cancelDailyReminder();
    }
    setNotificationsEnabled(value);
    await savePrefs({ enabled: value, reminderHour, reminderMinute, wordOfDayEnabled, wordOfDayHour });
  };

  const selectTime = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    setTimePickerVisible(false);
    await savePrefs({ enabled: notificationsEnabled, reminderHour: hour, reminderMinute: minute, wordOfDayEnabled, wordOfDayHour });
    if (notificationsEnabled) {
      await scheduleDailyReminder(hour, minute, currentStreak);
    }
  };

  const toggleWordOfDay = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Enable notifications in your device settings to receive the word of the day.');
        return;
      }
      await scheduleWordOfDay(wordOfDayHour);
    } else {
      await cancelWordOfDay();
    }
    setWordOfDayEnabled(value);
    await savePrefs({ enabled: notificationsEnabled, reminderHour, reminderMinute, wordOfDayEnabled: value, wordOfDayHour });
  };

  const selectWodHour = async (hour: number) => {
    setWordOfDayHour(hour);
    setWodPickerVisible(false);
    await savePrefs({ enabled: notificationsEnabled, reminderHour, reminderMinute, wordOfDayEnabled, wordOfDayHour: hour });
    if (wordOfDayEnabled) {
      await scheduleWordOfDay(hour);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Settings" backIcon="back" />

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View className="bg-white overflow-hidden mb-6" style={{ borderRadius: 16 }}>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}
            onPress={() => setSpeedPickerVisible(true)}
          >
            <Text className="text-ink text-base">Text-to-Speech Speed</Text>
            <Text style={{ color: colors.textSecondary }} className="text-base">
              {SPEED_OPTIONS.find(o => o.value === ttsSpeed)?.label || 'Normal'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}
            onPress={() => setGoalPickerVisible(true)}
          >
            <Text className="text-ink text-base">Daily XP Goal</Text>
            <Text style={{ color: colors.textSecondary }} className="text-base">{dailyGoalXp} XP</Text>
          </TouchableOpacity>
          <View className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-ink text-base">Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}
            onPress={() => setTimePickerVisible(true)}
          >
            <Text className="text-ink text-base">Daily Reminder</Text>
            <Text style={{ color: colors.textSecondary }} className="text-base">{notificationsEnabled ? timeLabel : 'Off'}</Text>
          </TouchableOpacity>
          <View className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-ink text-base">Word of the Day</Text>
            <Switch
              value={wordOfDayEnabled}
              onValueChange={toggleWordOfDay}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}
            onPress={() => setWodPickerVisible(true)}
          >
            <Text className="text-ink text-base">Word of the Day Time</Text>
            <Text style={{ color: colors.textSecondary }} className="text-base">
              {wordOfDayEnabled
                ? WOD_HOUR_OPTIONS.find(o => o.hour === wordOfDayHour)?.label || `${wordOfDayHour}:00`
                : 'Off'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center"
            onPress={sendTestNotification}
          >
            <Text className="text-ink text-base">Send Test Notification</Text>
            <Text className="text-brand text-base">Send</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white overflow-hidden mb-6" style={{ borderRadius: 16 }}>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}
            onPress={() => {
              Alert.alert(
                'Clear Learned Words',
                'This will reset all your learned words locally and in the cloud.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                      const learned = getLearned(uid);
                      for (const id of learned) {
                        useVocabStore.getState().unlearnWord(uid, id);
                      }
                      if (user) {
                        await supabase
                          .from('user_learned_words')
                          .delete()
                          .eq('user_id', uid);
                      }
                      Alert.alert('Done', 'All learned words have been cleared.');
                    },
                  },
                ],
              );
            }}
          >
            <Text className="text-ink text-base">Clear Learned Words</Text>
            <Text style={{ color: colors.danger }} className="text-base">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center"
            onPress={() => {
              if (user) {
                Alert.alert('Account', `Signed in as ${user.name || user.email}\n\nUser ID: ${user.id.slice(0, 8)}...`);
              } else {
                router.push('/signin');
              }
            }}
          >
            <Text className="text-ink text-base">Account</Text>
            <Text style={{ color: colors.textSecondary }} className="text-base">{user ? user.name || 'Signed In' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
        {user && (
          <TouchableOpacity
            className="bg-white overflow-hidden mb-6"
            style={{ borderRadius: 16 }}
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: async () => {
                    await useAuthStore.getState().clearUser();
                    router.replace('/');
                  },
                },
              ]);
            }}
          >
            <View className="px-4 py-4 items-center">
              <Text style={{ color: colors.danger }} className="text-base font-semibold">Sign Out</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={timePickerVisible} transparent animationType="slide" onRequestClose={() => setTimePickerVisible(false)}>
        <TouchableOpacity className="flex-1 justify-end" activeOpacity={1} onPress={() => setTimePickerVisible(false)}>
          <View className="bg-white pt-6 pb-10 px-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text className="text-ink text-lg font-bold mb-4 text-center">Reminder Time</Text>
            {TIME_OPTIONS.map(opt => {
              const selected = opt.hour === reminderHour && opt.minute === reminderMinute;
              return (
                <TouchableOpacity
                  key={opt.label}
                  className="py-4 px-4 flex-row items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}
                  onPress={() => selectTime(opt.hour, opt.minute)}
                >
                  <Text className={`text-base ${selected ? 'text-brand font-bold' : 'text-ink'}`}>{opt.label}</Text>
                  {selected && <Text className="text-brand text-lg">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={wodPickerVisible} transparent animationType="slide" onRequestClose={() => setWodPickerVisible(false)}>
        <TouchableOpacity className="flex-1 justify-end" activeOpacity={1} onPress={() => setWodPickerVisible(false)}>
          <View className="bg-white pt-6 pb-10 px-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text className="text-ink text-lg font-bold mb-4 text-center">Word of the Day Time</Text>
            {WOD_HOUR_OPTIONS.map(opt => {
              const selected = opt.hour === wordOfDayHour;
              return (
                <TouchableOpacity
                  key={opt.label}
                  className="py-4 px-4 flex-row items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}
                  onPress={() => selectWodHour(opt.hour)}
                >
                  <Text className={`text-base ${selected ? 'text-brand font-bold' : 'text-ink'}`}>{opt.label}</Text>
                  {selected && <Text className="text-brand text-lg">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={speedPickerVisible} transparent animationType="slide" onRequestClose={() => setSpeedPickerVisible(false)}>
        <TouchableOpacity className="flex-1 justify-end" activeOpacity={1} onPress={() => setSpeedPickerVisible(false)}>
          <View className="bg-white pt-6 pb-10 px-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text className="text-ink text-lg font-bold mb-4 text-center">Text-to-Speech Speed</Text>
            {SPEED_OPTIONS.map(opt => {
              const selected = opt.value === ttsSpeed;
              return (
                <TouchableOpacity
                  key={opt.value}
                  className="py-4 px-4 flex-row items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}
                  onPress={() => {
                    setTtsSpeed(opt.value);
                    setSpeedPickerVisible(false);
                  }}
                >
                  <Text className={`text-base ${selected ? 'text-brand font-bold' : 'text-ink'}`}>{opt.label}</Text>
                  {selected && <Text className="text-brand text-lg">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={goalPickerVisible} transparent animationType="slide" onRequestClose={() => setGoalPickerVisible(false)}>
        <TouchableOpacity className="flex-1 justify-end" activeOpacity={1} onPress={() => setGoalPickerVisible(false)}>
          <View className="bg-white pt-6 pb-10 px-5" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <Text className="text-ink text-lg font-bold mb-4 text-center">Daily XP Goal</Text>
            {GOAL_OPTIONS.map(opt => {
              const selected = opt.value === dailyGoalXp;
              return (
                <TouchableOpacity
                  key={opt.value}
                  className="py-4 px-4 flex-row items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}
                  onPress={() => {
                    setDailyGoalXp(opt.value);
                    setGoalPickerVisible(false);
                  }}
                >
                  <Text className={`text-base ${selected ? 'text-brand font-bold' : 'text-ink'}`}>{opt.label}</Text>
                  {selected && <Text className="text-brand text-lg">✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav />
    </View>
  );
};

export default Settings;
