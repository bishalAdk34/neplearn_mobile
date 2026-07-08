import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { useMistakesStore } from '../src/stores/mistakes';
import { vocab, GUEST_ID } from '../src/data/vocab';
import { QuizSession } from '../src/components/QuizSession';
import { ScreenHeader, EmptyState } from '../src/components/ui';

const PracticeMistakes = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const mistakesByUser = useMistakesStore(s => s.mistakesByUser);

  const mistakeWords = useMemo(() => {
    const userMistakes = mistakesByUser[uid] || {};
    const activeIds = new Set(
      Object.values(userMistakes)
        .filter(m => !m.resolved)
        .map(m => m.wordId)
    );
    return vocab.filter(w => activeIds.has(w.id));
    // Snapshot on mount only — resolving must not shrink the active session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (mistakeWords.length === 0) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Practice Mistakes" backIcon="back" />
        <EmptyState
          emoji="🎯"
          title="No mistakes to review"
          message="Great work! Words you miss in quizzes and lessons will show up here."
          actionLabel="Take a Quiz"
          onAction={() => router.replace('/learn')}
        />
      </View>
    );
  }

  return (
    <QuizSession
      uid={uid}
      words={mistakeWords}
      count={10}
      title="Practice Mistakes"
      completeEmoji="🎯"
      srsSource="mistakes"
      xpAmount={15}
      xpSource="mistakes"
    />
  );
};

export default PracticeMistakes;
