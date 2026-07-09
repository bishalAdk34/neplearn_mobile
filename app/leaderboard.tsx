import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores/auth';
import { fetchWeeklyLeaderboard, type LeaderboardRow } from '../src/services/db';
import { useNetworkState } from '../src/hooks/useNetworkState';
import { ScreenHeader } from '../src/components/ui';
import { colors, shadows } from '../src/theme';

const CACHE_KEY = 'nepali-leaderboard-cache';

const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

const Leaderboard = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isGuest = !user || user.id.startsWith('__guest__');
  const { isOffline } = useNetworkState();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;

    const load = async () => {
      // Show cached result first (also the offline fallback).
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && !cancelled) {
          setRows(JSON.parse(raw));
          setFromCache(true);
        }
      } catch {}

      if (isOffline) return;
      setLoading(true);
      const fresh = await fetchWeeklyLeaderboard(50);
      if (cancelled) return;
      setLoading(false);
      if (fresh.length > 0) {
        setRows(fresh);
        setFromCache(false);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
      } else if (!rows) {
        setRows([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest, isOffline]);

  // ---- Guest locked state ----
  if (isGuest) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title="Leaderboard" backIcon="back" />
        <View className="px-5">
          <View className="bg-white p-6 items-center" style={{ borderRadius: 24, ...shadows.card }}>
            <Text className="text-5xl mb-4">🏆</Text>
            <Text className="text-xl font-bold mb-3" style={{ color: '#1F2937' }}>Join the Weekly Race</Text>
            <Text className="text-sm mb-6 leading-5 text-center" style={{ color: colors.textSecondary }}>
              Create an account to compete with other learners and see where your weekly XP ranks.
            </Text>
            <TouchableOpacity
              className="bg-brand py-4 rounded-full items-center w-full"
              onPress={() => router.push('/signin')}
            >
              <Text className="text-white font-semibold text-base">Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title="Leaderboard" backIcon="back" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-4">
            This week's XP race — resets every Monday.
          </Text>

          {isOffline && (
            <View style={{ backgroundColor: colors.warmSurface, borderRadius: 12 }} className="p-3 mb-4">
              <Text style={{ color: colors.warmInk }} className="text-sm text-center">
                You're offline{fromCache ? ' — showing last saved rankings.' : '. Rankings will load when you reconnect.'}
              </Text>
            </View>
          )}

          {loading && !rows && (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {rows && rows.length === 0 && (
            <View className="bg-white p-6 items-center" style={{ borderRadius: 20, ...shadows.card }}>
              <Text className="text-4xl mb-3">🌱</Text>
              <Text className="text-ink text-base font-bold mb-1">No XP yet this week</Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm text-center">
                Be the first — earn XP from quizzes and lessons to claim the top spot.
              </Text>
            </View>
          )}

          {rows && rows.map(row => {
            const m = medal(row.rank);
            const isSelf = user?.name && row.name === user.name;
            return (
              <View
                key={`${row.rank}-${row.name}`}
                className="flex-row items-center p-4 mb-3"
                style={{
                  backgroundColor: isSelf ? '#EEF2FF' : colors.surface,
                  borderRadius: 16,
                  borderWidth: isSelf ? 1.5 : 0,
                  borderColor: colors.accent,
                  ...shadows.card,
                }}
              >
                <View className="w-10 items-center mr-2">
                  {m ? (
                    <Text className="text-2xl">{m}</Text>
                  ) : (
                    <Text className="text-base font-bold" style={{ color: colors.textSecondary }}>#{row.rank}</Text>
                  )}
                </View>
                {row.avatar_url ? (
                  <Image source={{ uri: row.avatar_url }} className="w-10 h-10 rounded-full mr-3" />
                ) : (
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#E8E4DF' }}>
                    <Text className="text-base">🧑</Text>
                  </View>
                )}
                <Text className="text-ink text-base font-semibold flex-1" numberOfLines={1}>
                  {row.name}{isSelf ? ' (you)' : ''}
                </Text>
                <Text className="text-brand text-base font-bold">{row.weekly_xp} XP</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Leaderboard;
