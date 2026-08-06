import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Word } from '../data/vocab';
import { useSrsStore } from '../stores/srs';
import type { MistakeSource } from '../stores/mistakes';
import { awardXp } from '../services/xp';
import type { XpSource } from '../services/db';
import { buildMatchPairs, MatchTile } from '../utils/matchPairsBuilder';
import { colors, shadows } from '../theme';
import { hapticSuccess, hapticError, hapticLight } from '../utils/haptics';
import Confetti from './Confetti';

interface MatchPairsSessionProps {
  uid: string;
  words: Word[];
  count?: number;
  title: string;
  xpAmount: number;
  xpSource: XpSource;
  srsSource: MistakeSource;
  onComplete?: () => void;
}

export default function MatchPairsSession({
  uid,
  words,
  count = 8,
  title,
  xpAmount,
  xpSource,
  srsSource,
  onComplete,
}: MatchPairsSessionProps) {
  const { leftTiles, rightTiles } = useMemo(() => buildMatchPairs(words, count), [words, count]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: number; right: number } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const total = leftTiles.length;

  const selectLeft = (tile: MatchTile) => {
    if (matched.has(tile.wordId)) return;
    hapticLight();
    setWrongPair(null);
    setSelectedLeft(tile.wordId);
  };

  const selectRight = (tile: MatchTile) => {
    if (matched.has(tile.wordId) || selectedLeft === null) return;

    const correct = tile.wordId === selectedLeft;
    useSrsStore.getState().recordResult(uid, tile.wordId, correct, srsSource);

    if (correct) {
      hapticSuccess();
      const next = new Set(matched);
      next.add(tile.wordId);
      setMatched(next);
      setSelectedLeft(null);
      setWrongPair(null);

      if (next.size >= total) {
        if (!xpAwarded) {
          setXpAwarded(true);
          awardXp(uid, xpAmount, xpSource);
        }
        setIsComplete(true);
        onComplete?.();
      }
    } else {
      hapticError();
      setWrongPair({ left: selectedLeft, right: tile.wordId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 500);
    }
  };

  if (isComplete) {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Confetti active={true} />
        <Text style={{ fontSize: 72, lineHeight: 88 }} className="mb-6">🧠</Text>
        <Text className="text-ink text-2xl font-bold mb-2">All Matched!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-2 text-center">
          You matched all {total} pairs.
        </Text>
        <View style={{ backgroundColor: colors.warmSurface }} className="px-4 py-2 rounded-full">
          <Text style={{ color: colors.warmInk }} className="font-bold">+{xpAmount} XP</Text>
        </View>
      </View>
    );
  }

  const tileStyle = (wordId: number, isLeft: boolean) => {
    const isMatched = matched.has(wordId);
    const isSelected = isLeft && selectedLeft === wordId;
    const isWrong = wrongPair && (isLeft ? wrongPair.left === wordId : wrongPair.right === wordId);

    if (isMatched) return { backgroundColor: '#D1FAE5', borderColor: colors.success, opacity: 0.5 };
    if (isWrong) return { backgroundColor: '#FEE2E2', borderColor: colors.danger };
    if (isSelected) return { backgroundColor: '#EEF2FF', borderColor: colors.accent };
    return { backgroundColor: colors.surface, borderColor: colors.border };
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="px-5 pt-2 pb-4 items-center">
        <Text className="text-ink text-lg font-bold mb-1">{title}</Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm">
          {matched.size}/{total} matched
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row px-5 gap-3">
          <View className="flex-1 gap-2.5">
            {leftTiles.map(tile => {
              const style = tileStyle(tile.wordId, true);
              return (
                <TouchableOpacity
                  key={`left-${tile.wordId}`}
                  disabled={matched.has(tile.wordId)}
                  style={{ borderRadius: 12, borderWidth: 2, ...style, ...shadows.card }}
                  className="px-3 py-4 items-center justify-center"
                  onPress={() => selectLeft(tile)}
                >
                  <Text className="text-ink text-sm font-semibold text-center">{tile.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="flex-1 gap-2.5">
            {rightTiles.map(tile => {
              const style = tileStyle(tile.wordId, false);
              return (
                <TouchableOpacity
                  key={`right-${tile.wordId}`}
                  disabled={matched.has(tile.wordId)}
                  style={{ borderRadius: 12, borderWidth: 2, ...style, ...shadows.card }}
                  className="px-3 py-4 items-center justify-center"
                  onPress={() => selectRight(tile)}
                >
                  <Text className="text-brand text-sm font-semibold text-center">{tile.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
