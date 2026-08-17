import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { categories, CATEGORY_META, GUEST_ID, getWordsByCategory, vocab } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { ScreenHeader } from '../src/components/ui';
import { colors, shadows } from '../src/theme';

const NODE_SIZE = 72;

const SkillTree = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isLearned = useVocabStore(s => s.isLearned);
  const learnedByUser = useVocabStore(s => s.learnedByUser);
  const uid = user?.id || GUEST_ID;

  const nodes = useMemo(() => {
    return categories.map(cat => {
      const words = getWordsByCategory(cat);
      const learned = words.filter(w => isLearned(uid, w.id)).length;
      const meta = CATEGORY_META[cat];
      return { cat, learned, total: words.length, emoji: meta.emoji, color: meta.color };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, learnedByUser]);

  const totalLearned = nodes.reduce((sum, n) => sum + n.learned, 0);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Skill Path" />
      <View className="px-5 -mt-2 pb-3">
        <Text style={{ color: colors.textSecondary }} className="text-sm">
          {totalLearned}/{vocab.length} words learned across {categories.length} categories
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        {nodes.map((node, index) => {
          const alignRight = index % 2 === 1;
          const pct = node.total > 0 ? node.learned / node.total : 0;
          const complete = pct >= 1;
          return (
            <View key={node.cat}>
              {index > 0 && (
                <View
                  style={{
                    width: 3,
                    height: 32,
                    backgroundColor: colors.border,
                    alignSelf: alignRight ? 'flex-end' : 'flex-start',
                    marginHorizontal: NODE_SIZE / 2 - 1,
                  }}
                />
              )}
              <View style={{ alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
                <TouchableOpacity
                  onPress={() => router.push(`/flashcards/${node.cat}`)}
                  style={{ alignItems: 'center', width: NODE_SIZE + 80 }}
                >
                  <View
                    style={{
                      width: NODE_SIZE,
                      height: NODE_SIZE,
                      borderRadius: NODE_SIZE / 2,
                      backgroundColor: complete ? node.color : colors.surface,
                      borderWidth: 3,
                      borderColor: node.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...shadows.card,
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{node.emoji}</Text>
                  </View>
                  <Text className="text-ink text-sm font-bold capitalize mt-2">{node.cat}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    {node.learned}/{node.total} learned
                  </Text>
                  <View style={{ backgroundColor: node.color + '18' }} className="px-2 py-0.5 rounded-full mt-1">
                    <Text style={{ color: node.color }} className="text-xs font-semibold">
                      {Math.round(pct * 100)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default SkillTree;
