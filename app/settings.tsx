import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, GUEST_ID } from '../src/data/vocab';
import { supabase } from '../src/services/supabase';
import {
  getPrefs,
  savePrefs,
  requestPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  sendTestNotification,
} from '../src/services/notifications';

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

const Settings = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const { getLearned } = useVocabStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(17);
  const [reminderMinute, setReminderMinute] = useState(35);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    getPrefs().then(prefs => {
      setNotificationsEnabled(prefs.enabled);
      setReminderHour(prefs.reminderHour);
      setReminderMinute(prefs.reminderMinute);
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
      await scheduleDailyReminder(reminderHour, reminderMinute);
    } else {
      await cancelDailyReminder();
    }
    setNotificationsEnabled(value);
    await savePrefs({ enabled: value, reminderHour, reminderMinute });
  };

  const selectTime = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    setTimePickerVisible(false);
    await savePrefs({ enabled: notificationsEnabled, reminderHour: hour, reminderMinute: minute });
    if (notificationsEnabled) {
      await scheduleDailyReminder(hour, minute);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <View className="px-5 pt-12 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#800816" />
        </TouchableOpacity>
        <Text className="text-[#4A1942] text-xl font-bold">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }} className="overflow-hidden mb-6">
          <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-[#4A1942] text-base">Text-to-Speech Speed</Text>
            <Text className="text-[#6B7280] text-base">Normal</Text>
          </TouchableOpacity>
          <View className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-[#4A1942] text-base">Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#D1D5DB', true: '#800816' }}
              thumbColor="#FFFFFF"
            />
          </View>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}
            onPress={() => setTimePickerVisible(true)}
          >
            <Text className="text-[#4A1942] text-base">Daily Reminder</Text>
            <Text className="text-[#6B7280] text-base">{notificationsEnabled ? timeLabel : 'Off'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-4 flex-row justify-between items-center"
            onPress={sendTestNotification}
          >
            <Text className="text-[#4A1942] text-base">Send Test Notification</Text>
            <Text className="text-[#800816] text-base">Send</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }} className="overflow-hidden mb-6">
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
            <Text className="text-[#4A1942] text-base">Clear Learned Words</Text>
            <Text className="text-[#DC2626] text-base">Reset</Text>
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
            <Text className="text-[#4A1942] text-base">Account</Text>
            <Text className="text-[#6B7280] text-base">{user ? user.name || 'Signed In' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
        {user && (
          <TouchableOpacity
            style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }}
            className="overflow-hidden mb-6"
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
              <Text className="text-[#DC2626] text-base font-semibold">Sign Out</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={timePickerVisible} transparent animationType="slide" onRequestClose={() => setTimePickerVisible(false)}>
        <TouchableOpacity className="flex-1 justify-end" activeOpacity={1} onPress={() => setTimePickerVisible(false)}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} className="pt-6 pb-10 px-5">
            <Text className="text-[#4A1942] text-lg font-bold mb-4 text-center">Reminder Time</Text>
            {TIME_OPTIONS.map(opt => {
              const selected = opt.hour === reminderHour && opt.minute === reminderMinute;
              return (
                <TouchableOpacity
                  key={opt.label}
                  className="py-4 px-4 flex-row items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}
                  onPress={() => selectTime(opt.hour, opt.minute)}
                >
                  <Text className={`text-base ${selected ? 'text-[#800816] font-bold' : 'text-[#4A1942]'}`}>{opt.label}</Text>
                  {selected && <Text className="text-[#800816] text-lg">✓</Text>}
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
