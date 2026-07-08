import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { GUEST_ID } from '../src/data/vocab';
import { saveJournalEntry } from '../src/services/db';
import { awardXp } from '../src/services/xp';
import { ScreenHeader } from '../src/components/ui';
import { colors } from '../src/theme';

const prompts = [
  { nepali: 'आज तपाईंको दिन कस्तो थियो?', roman: 'Aaja tapaiko din kasto thiyo?', english: 'How was your day today?' },
  { nepali: 'तपाईंले के खानुभयो?', roman: 'Tapaile ke khanubhayo?', english: 'What did you eat?' },
  { nepali: 'भोलि तपाईं के गर्नुहुन्छ?', roman: 'Bholi tapaai ke garnuhunchha?', english: 'What will you do tomorrow?' },
  { nepali: 'तपाईंको मनपर्ने रंग कुन हो?', roman: 'Tapaiko manparne rang kun ho?', english: 'What is your favorite color?' },
];

const Journal = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const prompt = React.useMemo(
    () => prompts[Math.floor(Math.random() * prompts.length)],
    [],
  );

  const handleSubmit = async () => {
    if (text.trim().length === 0) {
      Alert.alert('Empty', 'Please write something before submitting.');
      return;
    }
    setSaving(true);
    const result = await saveJournalEntry(uid, prompt.nepali, prompt.roman, prompt.english, text.trim());
    await awardXp(uid, 25, 'journal');
    setSaving(false);
    Alert.alert(
      'Saved',
      result.queued
        ? 'Saved offline — will sync when online. You earned 25 XP.'
        : 'Your journal entry has been saved! You earned 25 XP.'
    );
    router.push('/');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Daily Journal" backIcon="close" centered />

      <View className="px-5 flex-1">
        <View style={{ backgroundColor: colors.surface, borderRadius: 16 }} className="p-5 mb-4">
          <Text className="text-brand text-sm font-bold mb-1">TODAY'S PROMPT</Text>
          <Text className="text-ink text-xl font-bold mb-1">{prompt.nepali}</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-1">{prompt.roman}</Text>
          <Text style={{ color: colors.textTertiary }} className="text-sm italic">{prompt.english}</Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 16, flex: 1 }} className="p-4">
          <TextInput
            className="text-ink text-base flex-1"
            placeholder="Write your answer in Nepali here..."
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      <View className="px-5 pb-8 pt-4" style={{ backgroundColor: colors.background }}>
        <TouchableOpacity
          style={{ backgroundColor: text.trim().length > 0 && !saving ? colors.primary : colors.disabled }}
          className="py-4 rounded-xl items-center flex-row justify-center"
          onPress={handleSubmit}
          disabled={text.trim().length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">SAVE ENTRY</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Journal;
