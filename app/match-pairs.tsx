import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, shuffle, GUEST_ID, type Word } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { awardXp } from '../src/services/xp';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticSuccess, hapticError } from '../src/utils/haptics';
import Confetti from '../src/components/Confetti';

const PAIR_COUNT = 6;

type Card = {
  key: string;
  wordId: number;
  label: string;
  lang: 'en' | 'ne';
  matched: boolean;
};

function buildCards(): Card[] {
  const learnedIds = useVocabStore.getState().getLearned(useAuthStore.getState().user?.id || GUEST_ID);
  const pool: Word[] = learnedIds.length >= PAIR_COUNT
    ? vocab.filter(w => learnedIds.includes(w.id))
    : vocab;
  const words = shuffle(pool).slice(0, PAIR_COUNT);
  const cards: Card[] = words.flatMap(w => [
    { key: `${w.id}-en`, wordId: w.id, label: w.english, lang: 'en' as const, matched: false },
    { key: `${w.id}-ne`, wordId: w.id, label: w.nepali, lang: 'ne' as const, matched: false },
  ]);
  return shuffle(cards);
}

const MatchPairs = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;

  const [cards, setCards] = useState<Card[]>(() => buildCards());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [wrongKeys, setWrongKeys] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const xpAwarded = useRef(false);
  const busy = useRef(false);

  const handleFinish = () => {
    if (!xpAwarded.current) {
      xpAwarded.current = true;
      awardXp(uid, 20, 'quiz');
    }
    setIsComplete(true);
  };

  const selectCard = (card: Card) => {
    if (busy.current || card.matched || card.key === selectedKey) return;

    if (!selectedKey) {
      setSelectedKey(card.key);
      return;
    }

    const first = cards.find(c => c.key === selectedKey)!;
    if (first.wordId === card.wordId && first.lang !== card.lang) {
      // Match
      hapticSuccess();
      const newCards = cards.map(c =>
        c.wordId === card.wordId ? { ...c, matched: true } : c
      );
      setCards(newCards);
      setSelectedKey(null);
      const newCount = matchedCount + 1;
      setMatchedCount(newCount);
      if (newCount >= PAIR_COUNT) {
        handleFinish();
      }
    } else {
      // Mismatch
      hapticError();
      busy.current = true;
      setWrongKeys([first.key, card.key]);
      setTimeout(() => {
        setWrongKeys([]);
        setSelectedKey(null);
        busy.current = false;
      }, 500);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Confetti active={true} />
        <Text style={{ fontSize: 72, lineHeight: 88 }} className="mb-6">🧠</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Match Pairs Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2 text-center">
          You matched all {PAIR_COUNT} pairs.
        </Text>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-4 py-2 rounded-full mb-6">
          <Text style={{ color: colors.warmInk }} className="font-bold">+20 XP</Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader
        title="Match Pairs"
        backIcon="close"
        centered
        right={
          <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
            <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{matchedCount}/{PAIR_COUNT}</Text>
          </View>
        }
      />

      <View className="px-5 mb-4">
        <ProgressBar progress={matchedCount / PAIR_COUNT} />
      </View>

      <View className="px-5 flex-row flex-wrap justify-between">
        {cards.map(card => {
          const isSelected = card.key === selectedKey;
          const isWrong = wrongKeys.includes(card.key);
          let borderColor: string = colors.border;
          let bgColor: string = colors.surface;
          if (card.matched) {
            borderColor = colors.success;
            bgColor = '#D1FAE5';
          } else if (isWrong) {
            borderColor = colors.danger;
            bgColor = '#FEE2E2';
          } else if (isSelected) {
            borderColor = colors.primary;
            bgColor = colors.mutedSurface;
          }
          return (
            <TouchableOpacity
              key={card.key}
              disabled={card.matched}
              style={{
                width: '48%',
                backgroundColor: bgColor,
                borderRadius: 16,
                borderWidth: 2,
                borderColor,
                ...shadows.card,
                opacity: card.matched ? 0.4 : 1,
              }}
              className="p-4 mb-3 items-center justify-center"
              onPress={() => selectCard(card)}
            >
              <Text className="text-ink text-base font-semibold text-center">{card.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default MatchPairs;
