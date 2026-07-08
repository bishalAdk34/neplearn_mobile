import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { useStatsStore } from '../src/stores/stats';
import { GUEST_ID } from '../src/data/vocab';
import { grammarTips } from '../src/data/grammar';
import { speak } from '../src/services/tts';
import { awardXp } from '../src/services/xp';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';
import { hapticLight } from '../src/utils/haptics';

const Grammar = () => {
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const grammarRead = useStatsStore(s => (s.statsByUser[uid] || { grammarRead: [] }).grammarRead);

  const toggleTip = (tipId: number) => {
    hapticLight();
    const opening = expandedId !== tipId;
    setExpandedId(opening ? tipId : null);
    if (opening) {
      // 5 XP the first time each tip is read
      const firstRead = useStatsStore.getState().markGrammarRead(uid, tipId);
      if (firstRead) awardXp(uid, 5, 'grammar');
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Grammar Tips" backIcon="back" />
        <View className="px-5 -mt-2 pb-4">
          <Text style={{ color: colors.textSecondary }} className="text-sm">
            {grammarRead.length}/{grammarTips.length} tips read • 5 XP per new tip
          </Text>
        </View>

        <View className="px-5">
          {grammarTips.map((tip) => {
            const expanded = expandedId === tip.id;
            const read = grammarRead.includes(tip.id);
            return (
              <View
                key={tip.id}
                style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: expanded ? colors.primary : colors.border }}
                className="mb-3 overflow-hidden"
              >
                <TouchableOpacity className="p-4 flex-row items-center" onPress={() => toggleTip(tip.id)} activeOpacity={0.7}>
                  <View style={{ backgroundColor: read ? '#D1FAE5' : colors.mutedSurface }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Text className="text-base">{read ? '✓' : '📘'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-base font-bold">{tip.title}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">{tip.summary}</Text>
                  </View>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                {expanded && (
                  <View className="px-4 pb-4">
                    <Text style={{ color: colors.textSecondary }} className="text-sm leading-5 mb-4">{tip.explanation}</Text>
                    {tip.examples.map((ex, i) => (
                      <View
                        key={i}
                        style={{ backgroundColor: colors.background, borderRadius: 12 }}
                        className="p-3 mb-2 flex-row items-center"
                      >
                        <View className="flex-1">
                          <Text className="text-brand text-lg font-semibold">{ex.nepali}</Text>
                          <Text style={{ color: colors.textTertiary }} className="text-sm">{ex.roman}</Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">{ex.english}</Text>
                        </View>
                        <TouchableOpacity onPress={() => speak(ex.nepali, 'ne-NP')} className="ml-2">
                          <View style={{ backgroundColor: '#FEE2E2' }} className="w-9 h-9 rounded-full items-center justify-center">
                            <Text>🔊</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Grammar;
