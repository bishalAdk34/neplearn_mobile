import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { GUEST_ID, useVocabStore } from '../src/data/vocab';
import { saveJournalEntry, addXp, updateStreak } from '../src/services/db';

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
    if (result) {
      if (uid === GUEST_ID) {
        useVocabStore.getState().addLocalXp(uid, 25);
        useVocabStore.getState().addLocalStreak(uid);
      } else {
        await addXp(uid, 25, 'journal');
        await updateStreak(uid);
      }
    }
    setSaving(false);
    Alert.alert('Saved', result ? 'Your journal entry has been saved! You earned 25 XP.' : 'Journal entry saved locally.');
    router.push('/');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-[#4A1942] text-xl font-bold">Daily Journal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View className="px-5 flex-1">
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }} className="p-5 mb-4">
          <Text className="text-[#800816] text-sm font-bold mb-1">TODAY'S PROMPT</Text>
          <Text className="text-[#4A1942] text-xl font-bold mb-1">{prompt.nepali}</Text>
          <Text className="text-[#6B7280] text-sm mb-1">{prompt.roman}</Text>
          <Text className="text-[#9CA3AF] text-sm italic">{prompt.english}</Text>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, flex: 1 }} className="p-4">
          <TextInput
            className="text-[#4A1942] text-base flex-1"
            placeholder="Write your answer in Nepali here..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      <View className="px-5 pb-8 pt-4" style={{ backgroundColor: '#FBF9F4' }}>
        <TouchableOpacity
          style={{ backgroundColor: text.trim().length > 0 && !saving ? '#800816' : '#D1D5DB' }}
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
    </View>
  );
};

export default Journal;
