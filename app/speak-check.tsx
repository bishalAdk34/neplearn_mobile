import React, { useState } from 'react';
import { View } from 'react-native';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, getWordsByCategory, GUEST_ID, Word, shuffle } from '../src/data/vocab';
import { ScreenHeader } from '../src/components/ui';
import SpeakCheckSession from '../src/components/SpeakCheckSession';
import { colors } from '../src/theme';

const SESSION_SIZE = 5;

const SpeakCheck = () => {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const category = params.category as string | undefined;
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;

  const [words] = useState<Word[]>(() => {
    if (category) return shuffle(getWordsByCategory(category)).slice(0, SESSION_SIZE);
    const learnedIds = useVocabStore.getState().getLearned(uid);
    const pool = learnedIds.length >= SESSION_SIZE
      ? vocab.filter(w => learnedIds.includes(w.id))
      : vocab;
    return shuffle(pool).slice(0, SESSION_SIZE);
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Speak & Check" backIcon="close" centered />
      <SpeakCheckSession
        uid={uid}
        words={words}
        title="Say it in Nepali"
        xpSource="speak_check"
        srsSource="speak_check"
        onComplete={() => {
          setTimeout(() => router.back(), 1500);
        }}
      />
    </View>
  );
};

export default SpeakCheck;
