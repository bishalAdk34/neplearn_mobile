import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { GUEST_ID } from '../src/data/vocab';
import { getAchievementStatuses, type AchievementStatus } from '../src/data/achievements';
import { colors } from '../src/theme';
import { ScreenHeader, ErrorState, ProgressBar } from '../src/components/ui';

const Achievements = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const [statuses, setStatuses] = useState<AchievementStatus[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    getAchievementStatuses(uid)
      .then(s => {
        if (!cancelled) setStatuses(s);
      })
      .catch(e => {
        console.warn('Failed to load achievements:', e);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, reloadKey]);

  const unlocked = statuses.filter(s => s.unlocked).length;
  const total = statuses.length;

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ScreenHeader title="Achievements" backIcon="back" />

        {/* Error state */}
        {loadError && (
          <ErrorState
            title="Couldn't load achievements"
            message="Check your connection and try again."
            onRetry={() => setReloadKey(k => k + 1)}
          />
        )}

        {/* Progress Summary */}
        <View className="px-5 mb-8">
          <View className="bg-brand p-6 items-center" style={{ borderRadius: 20 }}>
            <Text className="text-white text-4xl font-bold mb-1">{unlocked}/{total}</Text>
            <Text className="text-white/80 text-sm">Achievements Unlocked</Text>
            <ProgressBar
              progress={total > 0 ? unlocked / total : 0}
              height={8}
              color={colors.surface}
              trackColor="rgba(255,255,255,0.2)"
              style={{ width: '100%', marginTop: 16 }}
            />
          </View>
        </View>

        {/* Achievement List */}
        <View className="px-5">
          {statuses.map((ach, i) => (
            <View
              key={ach.achievement.id}
              className="bg-white flex-row items-center p-4 mb-3 rounded-2xl"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: ach.unlocked ? 0.08 : 0.04,
                shadowRadius: 8,
                elevation: ach.unlocked ? 3 : 1,
                opacity: ach.unlocked ? 1 : 0.6,
              }}
            >
              <View style={{ backgroundColor: ach.unlocked ? ach.achievement.bgColor : colors.mutedSurface }} className="w-14 h-14 rounded-full items-center justify-center mr-4">
                <Text className="text-2xl">{ach.unlocked ? ach.achievement.icon : '🔒'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: ach.unlocked ? '#1F2937' : colors.textTertiary }}>
                  {ach.achievement.title}
                </Text>
                <Text className="text-sm mt-1" style={{ color: ach.unlocked ? colors.textSecondary : colors.textTertiary }}>
                  {ach.achievement.description}
                </Text>
              </View>
              {ach.unlocked && (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Achievements;
