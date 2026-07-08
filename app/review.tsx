import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { useSrsStore } from '../src/stores/srs';
import { vocab, GUEST_ID } from '../src/data/vocab';
import { QuizSession } from '../src/components/QuizSession';
import { ScreenHeader, EmptyState } from '../src/components/ui';

const Review = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const srsByUser = useSrsStore(s => s.srsByUser);

  const dueWords = useMemo(() => {
    const userSrs = srsByUser[uid] || {};
    const now = new Date().toISOString();
    const dueIds = new Set(
      Object.values(userSrs)
        .filter(e => e.dueAt <= now)
        .map(e => e.wordId)
    );
    return vocab.filter(w => dueIds.has(w.id));
    // Snapshot on mount only — answering must not shrink the active session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  if (dueWords.length === 0) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Review" backIcon="back" />
        <EmptyState
          emoji="🧘"
          title="All caught up"
          message="No words are due for review right now. Learn new words or come back later."
          actionLabel="Learn Words"
          onAction={() => router.replace('/learn')}
        />
      </View>
    );
  }

  return (
    <QuizSession
      uid={uid}
      words={dueWords}
      count={10}
      title="Review"
      completeEmoji="🧠"
      srsSource="review"
      xpAmount={20}
      xpSource="review"
    />
  );
};

export default Review;
