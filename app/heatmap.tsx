import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ScreenHeader } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { GUEST_ID } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { useDailyXpStore } from '../src/services/xp';
import { useSettingsStore } from '../src/stores/settings';
import { useStatsStore } from '../src/stores/stats';
import { fetchDailyXp } from '../src/services/db';

const CELL = 16;
const GAP = 3;
const WEEKS = 17;

const dateKey = (d: Date) => d.toISOString().split('T')[0];

function cellColor(xp: number, goal: number): string {
  if (xp <= 0) return colors.mutedSurface;
  const ratio = xp / Math.max(goal, 1);
  if (ratio < 0.5) return '#FECACA';
  if (ratio < 1) return '#F87171';
  if (ratio < 2) return '#DC2626';
  return colors.primary;
}

const Heatmap = () => {
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const isGuest = !user;
  const localHistory = useDailyXpStore(s => s.history[uid]) || {};
  const dailyGoalXp = useSettingsStore(s => s.dailyGoalXp);
  const goalDays = useStatsStore(s => (s.statsByUser[uid] || { goalDays: [] }).goalDays);
  const [cloudHistory, setCloudHistory] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isGuest) {
      fetchDailyXp(uid).then(setCloudHistory).catch(() => setCloudHistory({}));
    }
  }, [isGuest, uid]);

  // Merge local + cloud, taking the max per day (avoids double counting synced XP).
  const merged = useMemo(() => {
    const map: Record<string, number> = { ...localHistory };
    for (const [day, xp] of Object.entries(cloudHistory)) {
      map[day] = Math.max(map[day] || 0, xp);
    }
    return map;
  }, [localHistory, cloudHistory]);

  // Build WEEKS columns of 7 days ending today (grid aligned to Sunday rows).
  const weeks = useMemo(() => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - (WEEKS * 7 - 1) - end.getDay());
    const cols: { key: string; xp: number; future: boolean; goalHit: boolean }[][] = [];
    const cursor = new Date(start);
    for (let w = 0; w < WEEKS + 1; w++) {
      const col: { key: string; xp: number; future: boolean; goalHit: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = dateKey(cursor);
        col.push({
          key,
          xp: merged[key] || 0,
          future: cursor > end,
          goalHit: goalDays.includes(key),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col);
      if (cursor > end) break;
    }
    return cols;
  }, [merged, goalDays]);

  const totalDaysActive = Object.values(merged).filter(x => x > 0).length;
  const totalXp = Object.values(merged).reduce((a, b) => a + b, 0);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Activity" backIcon="back" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-4">
            Your daily XP over the last {WEEKS} weeks{isGuest ? ' (stored on this device)' : ''}.
          </Text>

          {/* Stats row */}
          <View className="flex-row mb-6">
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }} className="flex-1 p-4 mr-2 items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{totalDaysActive}</Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">Active days</Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }} className="flex-1 p-4 mx-1 items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{goalDays.length}</Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">Goals hit</Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }} className="flex-1 p-4 ml-2 items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>{totalXp}</Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">Total XP</Text>
            </View>
          </View>

          {/* Heatmap grid */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, ...shadows.card }} className="p-4 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {/* Day labels */}
                <View style={{ marginRight: GAP * 2 }}>
                  {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                    <View key={i} style={{ height: CELL, marginBottom: GAP, justifyContent: 'center' }}>
                      <Text style={{ color: colors.textTertiary, fontSize: 9 }}>{label}</Text>
                    </View>
                  ))}
                </View>
                {weeks.map((col, w) => (
                  <View key={w} style={{ marginRight: GAP }}>
                    {col.map(day => (
                      <View
                        key={day.key}
                        style={{
                          width: CELL,
                          height: CELL,
                          marginBottom: GAP,
                          borderRadius: 3,
                          backgroundColor: day.future ? 'transparent' : cellColor(day.xp, dailyGoalXp),
                          borderWidth: day.goalHit && !day.future ? 1.5 : 0,
                          borderColor: colors.ink,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Legend */}
            <View className="flex-row items-center justify-end mt-3">
              <Text style={{ color: colors.textTertiary, fontSize: 10 }} className="mr-1">Less</Text>
              {[0, dailyGoalXp * 0.3, dailyGoalXp * 0.7, dailyGoalXp, dailyGoalXp * 2].map((v, i) => (
                <View
                  key={i}
                  style={{ width: 12, height: 12, borderRadius: 3, marginHorizontal: 1.5, backgroundColor: cellColor(v, dailyGoalXp) }}
                />
              ))}
              <Text style={{ color: colors.textTertiary, fontSize: 10 }} className="ml-1">More</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View style={{ width: 12, height: 12, borderRadius: 3, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.mutedSurface }} className="mr-2" />
            <Text style={{ color: colors.textSecondary }} className="text-xs">Outlined = daily goal of {dailyGoalXp} XP reached</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Heatmap;
