import React, { useState } from 'react';
import { View } from 'react-native';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, getWordsByCategory, GUEST_ID, Word, shuffle } from '../src/data/vocab';
import { ScreenHeader } from '../src/components/ui';
import MatchPairsSession from '../src/components/MatchPairsSession';
import { colors } from '../src/theme';

const PAIR_COUNT = 8;

const MatchPairs = () => {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const category = params.category as string | undefined;
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;

  const [words] = useState<Word[]>(() => {
    if (category) return getWordsByCategory(category);
    const learnedIds = useVocabStore.getState().getLearned(uid);
    const pool = learnedIds.length >= PAIR_COUNT
      ? vocab.filter(w => learnedIds.includes(w.id))
      : vocab;
    return shuffle(pool);
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Match Pairs" backIcon="close" centered />
      <MatchPairsSession
        uid={uid}
        words={words}
        count={PAIR_COUNT}
        title="Tap matching English & Nepali pairs"
        xpAmount={20}
        xpSource="match_pairs"
        srsSource="match_pairs"
        onComplete={() => {
          setTimeout(() => router.back(), 1500);
        }}
      />
    </View>
  );
};

export default MatchPairs;
