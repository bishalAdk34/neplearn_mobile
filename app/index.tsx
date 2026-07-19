import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import BottomNav from '../src/components/BottomNav';
import { Ionicons } from '@expo/vector-icons';
import { categories, getWordsByCategory, CATEGORY_META, GUEST_ID } from '../src/data/vocab';
import { useVocabStore } from '../src/data/vocab';
import { getContinueCategory } from '../src/data/personalization';
import { useAuthStore } from '../src/stores/auth';
import { useSrsStore } from '../src/stores/srs';
import { useMistakesStore } from '../src/stores/mistakes';
import { useSettingsStore } from '../src/stores/settings';
import { useDailyXpStore } from '../src/services/xp';
import { QuickActionsModal } from '@/src/components/QuickActionsModal';
import { getPrefs } from '../src/services/notifications';
import { getTotalXp, getStreak } from '../src/services/db';
import { colors } from '../src/theme';
import { ProgressBar } from '../src/components/ui';

const Home = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const clearUser = useAuthStore(s => s.clearUser);
  const { isLearned, learningGoal, learningLevel } = useVocabStore();
  const uid = user?.id || GUEST_ID;
  const [menuVisible, setMenuVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [cloudXp, setCloudXp] = useState<number | null>(null);
  const [cloudStreak, setCloudStreak] = useState<{ current_streak: number; longest_streak: number } | null>(null);

  useEffect(() => {
    getPrefs().then(p => setNotificationsOn(p.enabled));
  }, []);

  const isGuest = !user;

  useEffect(() => {
    if (!isGuest && uid) {
      getTotalXp(uid).then(setCloudXp).catch(() => setCloudXp(null));
      getStreak(uid).then(setCloudStreak).catch(() => setCloudStreak(null));
    }
  }, [isGuest, uid]);

  const totalLearned = categories.reduce((sum, cat) => {
    const words = getWordsByCategory(cat);
    return sum + words.filter(w => isLearned(uid, w.id)).length;
  }, 0);
  const totalWords = categories.reduce((sum, cat) => sum + getWordsByCategory(cat).length, 0);
  const localXp = useVocabStore.getState().getLocalXp(uid);
  const localStreak = useVocabStore.getState().getLocalStreak(uid);
  const xp = isGuest ? localXp : (cloudXp ?? 0);
  const xpToNext = 1500;
  const level = Math.floor((xp) / 500) + 1;
  const streak = isGuest ? localStreak.current : (cloudStreak?.current_streak ?? 0);

  const userName = user?.name || 'Guest';
  const firstName = userName.split(' ')[0];

  // Daily goal progress (subscribe to daily map so the bar live-updates)
  useDailyXpStore(s => s.daily);
  const todayXp = useDailyXpStore.getState().getTodayXp(uid);
  const dailyGoalXp = useSettingsStore(s => s.dailyGoalXp);
  const goalMet = todayXp >= dailyGoalXp;

  // Review + mistakes counters
  const srsByUser = useSrsStore(s => s.srsByUser);
  const dueCount = useMemo(() => {
    const now = new Date().toISOString();
    return Object.values(srsByUser[uid] || {}).filter(e => e.dueAt <= now).length;
  }, [srsByUser, uid]);
  const mistakesByUser = useMistakesStore(s => s.mistakesByUser);
  const mistakeCount = Object.values(mistakesByUser[uid] || {}).filter(m => !m.resolved).length;

  const continueRec = useMemo(
    () => getContinueCategory(learningGoal, learningLevel, id => isLearned(uid, id)),
    [learningGoal, learningLevel, uid, totalLearned]
  );

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View style={{ backgroundColor: '#E5E7EB' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-base">👤</Text>
              </View>
              <View>
                <Text className="text-ink text-sm">Namaste,</Text>
                <Text className="text-brand text-base font-bold">{userName}</Text>
              </View>
            </View>
            <View className="flex-row">
              <TouchableOpacity
                style={{ backgroundColor: '#F3F4F6' }}
                className="w-10 h-10 rounded-full items-center justify-center mr-3 relative"
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.ink} />
                {notificationsOn && (
                  <View className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.danger }} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#F3F4F6' }} className="w-10 h-10 rounded-full items-center justify-center" onPress={() => setMenuVisible(true)}>
                <Text className="text-lg">☰</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Modal */}
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View className="absolute top-12 right-5" style={{ backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, width: 220 }}>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); router.push('/settings'); }}>
                <Text className="text-ink text-base font-semibold">⚙️ Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); router.push('/help'); }}>
                <Text className="text-ink text-base font-semibold">❓ Help</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); router.push('/support'); }}>
                <Text className="text-ink text-base font-semibold">📧 Support</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3 border-b" style={{ borderColor: '#E5E7EB' }} onPress={() => { setMenuVisible(false); router.push('/about'); }}>
                <Text className="text-ink text-base font-semibold">ℹ️ About</Text>
              </TouchableOpacity>
              {user && (
                <TouchableOpacity className="px-4 py-3" onPress={() => { setMenuVisible(false); clearUser(); }}>
                  <Text style={{ color: colors.danger }} className="text-base font-semibold">🚪 Sign Out</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tagline */}
        <View className="px-5 pb-4">
          <Text className="text-ink text-lg font-semibold">NepLearn</Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm">Your journey through the peaks of wisdom.</Text>
        </View>

        {/* Daily Streak Card */}
        <View className="px-5 mb-6">
          <View className="bg-brand px-5 py-5" style={{ borderRadius: 24 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white/80 text-sm font-semibold tracking-wider">DAILY STREAK</Text>
              <View className="flex-row items-center">
                <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="w-12 h-12 rounded-full items-center justify-center">
                  <Text className="text-2xl">🔥</Text>
                </View>
              </View>
            </View>
            <Text className="text-white text-4xl font-bold mb-4">{streak} Days</Text>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white/90 text-sm">Level {level}: Learner</Text>
              <Text className="text-white/90 text-sm">{xp} / {xpToNext} XP</Text>
            </View>
            <ProgressBar
              progress={Math.min(xp / xpToNext, 1)}
              height={8}
              color={colors.warning}
              trackColor="rgba(255,255,255,0.2)"
              style={{ marginBottom: 20 }}
            />
            <Link href="/achievements" asChild>
              <TouchableOpacity style={{ backgroundColor: colors.surface }} className="py-3 rounded-full items-center">
                <Text className="text-brand font-bold text-base">View Achievements</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Today's Goal */}
        <View className="px-5 mb-6">
          <View className="bg-white border border-line p-4" style={{ borderRadius: 20 }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink text-base font-semibold">TODAY'S GOAL</Text>
              <Text style={{ color: goalMet ? colors.success : colors.textSecondary }} className="text-sm font-bold">
                {goalMet ? '✓ ' : ''}{todayXp} / {dailyGoalXp} XP
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(todayXp / dailyGoalXp, 1)}
              height={10}
              color={goalMet ? colors.success : colors.primary}
            />
          </View>
        </View>

        {/* Practice */}
        <View className="px-5 mb-6">
          <Text className="text-ink text-base font-semibold mb-3">PRACTICE</Text>
          <View className="flex-row gap-3">
            <Link href="/review" asChild>
              <TouchableOpacity className="bg-white border border-line p-4 flex-1" style={{ borderRadius: 20 }}>
                <Text className="text-2xl mb-2">🧠</Text>
                <Text className="text-ink text-sm font-semibold mb-1">Review</Text>
                <Text style={{ color: dueCount > 0 ? colors.primary : colors.textSecondary }} className="text-xs font-semibold">
                  {dueCount > 0 ? `${dueCount} word${dueCount === 1 ? '' : 's'} due` : 'All caught up'}
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href="/practice-mistakes" asChild>
              <TouchableOpacity className="bg-white border border-line p-4 flex-1" style={{ borderRadius: 20 }}>
                <Text className="text-2xl mb-2">🎯</Text>
                <Text className="text-ink text-sm font-semibold mb-1">Mistakes</Text>
                <Text style={{ color: mistakeCount > 0 ? colors.primary : colors.textSecondary }} className="text-xs font-semibold">
                  {mistakeCount > 0 ? `${mistakeCount} to fix` : 'None to fix'}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Continue Learning */}
        <View className="px-5 mb-6">
          <Text className="text-ink text-base font-semibold mb-3">CONTINUE LEARNING</Text>
          {continueRec ? (
            <Link href={{ pathname: '/lesson', params: { category: continueRec.cat } }} asChild>
              <TouchableOpacity className="bg-white border border-line p-4 flex-row items-center" style={{ borderRadius: 20 }}>
                <View style={{ backgroundColor: CATEGORY_META[continueRec.cat].color }} className="w-20 h-20 rounded-xl items-center justify-center mr-4">
                  <Text className="text-3xl">{CATEGORY_META[continueRec.cat].emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                    {learningGoal ? `Recommended for your ${learningGoal} goal` : 'Keep learning'}
                  </Text>
                  <Text className="text-ink text-sm font-semibold mb-2 capitalize">{continueRec.cat}</Text>
                  <Text style={{ color: colors.warmInk }} className="text-sm font-semibold">{continueRec.learned}/{continueRec.total} words learned</Text>
                </View>
                <Text className="text-brand text-xl">→</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <Link href="/review" asChild>
              <TouchableOpacity className="bg-white border border-line p-4 flex-row items-center" style={{ borderRadius: 20 }}>
                <View className="bg-brand w-20 h-20 rounded-xl items-center justify-center mr-4">
                  <Text className="text-3xl">🧠</Text>
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">All categories complete!</Text>
                  <Text className="text-ink text-sm font-semibold mb-2">Review what you've learned</Text>
                </View>
                <Text className="text-brand text-xl">→</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>

        {/* Daily Challenges */}
        <View className="px-5 mb-6">
          <Text className="text-ink text-base font-semibold mb-3">DAILY CHALLENGES</Text>
          <View className="bg-white border border-line overflow-hidden" style={{ borderRadius: 20 }}>
            {/* Morning Vocab */}
            <Link href="/morning-vocab" asChild>
              <TouchableOpacity className="p-4 flex-row items-center border-b border-line">
                <View style={{ backgroundColor: '#FEE2E2' }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                  <Text className="text-xl">📖</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-sm font-semibold mb-1">Morning Vocab</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">{learningGoal ? '5 terms picked for you' : 'Review 5 new random terms'}</Text>
                </View>
                <Text style={{ color: colors.successDark }} className="text-sm font-bold mr-2">+50 XP</Text>
                <Text className="text-brand">›</Text>
              </TouchableOpacity>
            </Link>

            {/* Echo Practice */}
            <Link href="/echo-practice" asChild>
              <TouchableOpacity className="p-4 flex-row items-center border-b border-line">
                <View style={{ backgroundColor: colors.warmSurface }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                  <Text className="text-xl">🗣️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-sm font-semibold mb-1">Echo Practice</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Listen and repeat 5 phrases</Text>
                </View>
                <Text style={{ color: colors.successDark }} className="text-sm font-bold mr-2">+30 XP</Text>
                <Text className="text-brand">›</Text>
              </TouchableOpacity>
            </Link>

            {/* Journal Prompt */}
            <Link href="/journal" asChild>
              <TouchableOpacity className="p-4 flex-row items-center">
                <View style={{ backgroundColor: '#D1FAE5' }} className="w-12 h-12 rounded-full items-center justify-center mr-4">
                  <Text className="text-xl">📝</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-sm font-semibold mb-1">Journal Prompt</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">Write a sentence in Nepali</Text>
                </View>
                <Text style={{ color: colors.successDark }} className="text-sm font-bold mr-2">+20 XP</Text>
                <Text className="text-brand">›</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View>
        <BottomNav activeTab="home" />
        <View style={{ position: 'absolute', top: -24, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
          <TouchableOpacity onPress={() => setQuickActionsVisible(true)}>
            <View className="bg-brand w-14 h-14 rounded-full items-center justify-center" style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
              <Ionicons name="add" size={28} color={colors.surface} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <QuickActionsModal visible={quickActionsVisible} onClose={() => setQuickActionsVisible(false)} />
    </View>
  );
};

export default Home;
