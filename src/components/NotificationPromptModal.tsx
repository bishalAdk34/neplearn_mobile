import React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useNotifPromptStore } from '../stores/notifPrompt';
import { useAuthStore } from '../stores/auth';
import { useVocabStore, GUEST_ID } from '../data/vocab';
import { requestPermissions, getPrefs, savePrefs, scheduleDailyReminder } from '../services/notifications';
import { colors } from '../theme';

export default function NotificationPromptModal() {
  const visible = useNotifPromptStore(s => s.visible);
  const markPrompted = useNotifPromptStore(s => s.markPrompted);
  const hide = useNotifPromptStore(s => s.hide);

  const close = () => {
    markPrompted();
    hide();
  };

  const handleEnable = async () => {
    try {
      const granted = await requestPermissions();
      if (granted) {
        const uid = useAuthStore.getState().user?.id || GUEST_ID;
        const streak = useVocabStore.getState().getLocalStreak(uid).current;
        const prefs = await getPrefs();
        await scheduleDailyReminder(prefs.reminderHour, prefs.reminderMinute, streak);
        await savePrefs({ ...prefs, enabled: true });
      } else {
        Alert.alert('Permission Denied', 'Enable notifications in your device settings to receive practice reminders.');
      }
    } catch (e: any) {
      Alert.alert('Notification Error', e?.message || 'Failed to update notification settings.');
    } finally {
      close();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20 }} className="w-full p-6 items-center">
          <Text className="text-4xl mb-3">🔔</Text>
          <Text style={{ color: colors.ink }} className="text-xl font-bold mb-2 text-center">Stay on track</Text>
          <Text style={{ color: colors.textSecondary }} className="text-base mb-6 text-center">
            Get a daily reminder to keep your streak alive.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 12 }}
            className="w-full py-4 items-center mb-3"
            onPress={handleEnable}
          >
            <Text className="text-white font-bold text-base">Enable Reminders</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-2" onPress={close}>
            <Text style={{ color: colors.textSecondary }} className="text-base font-semibold">Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
