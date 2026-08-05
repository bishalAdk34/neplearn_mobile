import React, { useState, useEffect } from 'react';
import { AppState, InteractionManager } from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVocabStore, GUEST_ID } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { useAuthStore } from '../src/stores/auth';
import {
  initNotifications,
  initNotificationLogListener,
  refreshDailyReminder,
  refreshWordOfDay,
  getPrefs,
  savePrefs,
  requestPermissions,
  scheduleDailyReminder,
} from '../src/services/notifications';
import NotificationPromptSheet from '../src/components/NotificationPromptSheet';
import { networkManager } from '../src/services/network';
import { syncManager } from '../src/services/syncManager';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import NotificationPromptModal from '../src/components/NotificationPromptModal';
import { maybeShowNotifPrompt } from '../src/stores/notifPrompt';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { getMissingConfigKeys } from '../src/config';
import './global.css';

export default function RootLayout() {
  const [splashDone] = useState(true);
  const onboardingDone = useVocabStore(s => s.onboardingDone);
  const user = useAuthStore(s => s.user);
  const initializeAuth = useAuthStore(s => s.initialize);
  const syncFromCloud = useVocabStore(s => s.syncFromCloud);

  useEffect(() => {
    if (!__DEV__) return;
    const resetOnboarding = () => useVocabStore.setState({ onboardingDone: false });
    if (useVocabStore.persist.hasHydrated()) {
      resetOnboarding();
    } else {
      return useVocabStore.persist.onFinishHydration(resetOnboarding);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    initNotifications().catch(() => {});

    let unsubscribeLog: (() => void) | undefined;
    initNotificationLogListener().then(unsub => {
      unsubscribeLog = unsub;
    }).catch(() => {});

    // Keep the daily reminder copy streak-aware: refresh whenever the app foregrounds.
    const refreshReminder = () => {
      const uid = useAuthStore.getState().user?.id || GUEST_ID;
      const streak = useVocabStore.getState().getLocalStreak(uid).current;
      refreshDailyReminder(streak).catch(() => {});
      refreshWordOfDay().catch(() => {});
    };
    refreshReminder();
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshReminder();
        if (__DEV__) useVocabStore.setState({ onboardingDone: false });
      }
    });

    return () => {
      unsubscribeLog?.();
      appStateSub.remove();
    };
  }, []);

  // Notification permission prompt — custom bottom sheet on 3rd app open
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    const checkPrompt = async () => {
      const prefs = await getPrefs();
      if (prefs.enabled) {
        await savePrefs({ ...prefs, enabled: false, wordOfDayEnabled: false });
      }

      const KEY = 'nepali-notification-prompt-state';
      await AsyncStorage.setItem(KEY, JSON.stringify({ opens: 2, asked: 0, lastDenyTime: null, completedAtDeny: null }));
      setShowNotificationPrompt(true);
    };

    checkPrompt().catch(() => {});
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestPermissions();
    if (granted) {
      const uid = useAuthStore.getState().user?.id || GUEST_ID;
      const streak = useVocabStore.getState().getLocalStreak(uid).current;
      const prefs = await getPrefs();
      await scheduleDailyReminder(prefs.reminderHour, prefs.reminderMinute, streak);
      await savePrefs({ ...prefs, enabled: true });
    }

    const KEY = 'nepali-notification-prompt-state';
    const raw = await AsyncStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : {};
    state.asked = 99;
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    setShowNotificationPrompt(false);
  };

  const handleNotNowNotifications = async () => {
    const uid = useAuthStore.getState().user?.id || GUEST_ID;
    const completedLessons = useVocabStore.getState().getCompletedLessons(uid);

    const KEY = 'nepali-notification-prompt-state';
    const raw = await AsyncStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : {};
    state.lastDenyTime = Date.now();
    state.completedAtDeny = completedLessons;
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    setShowNotificationPrompt(false);
  };

  useEffect(() => {
    networkManager.init();
    syncManager.init();
    return () => {
      networkManager.destroy();
      syncManager.destroy();
    };
  }, []);

  useEffect(() => {
    const missing = getMissingConfigKeys();
    if (missing.length > 0) {
      console.warn(`[config] Missing required env vars: ${missing.join(', ')}. Check .env.`);
    }
  }, []);

  useEffect(() => {
    if (!onboardingDone) return;
    const timer = setTimeout(() => maybeShowNotifPrompt(), 150000);
    return () => clearTimeout(timer);
  }, [onboardingDone]);

  useEffect(() => {
    if (user && !user.id.startsWith('__guest__')) {
      const handle = InteractionManager.runAfterInteractions(() => {
        syncFromCloud(user.id);
        useSrsStore.getState().syncFromCloud(user.id);
      });
      return () => handle.cancel();
    }
  }, [user, syncFromCloud]);

  if (!onboardingDone) {
    return (
      <ErrorBoundary>
        <NetworkProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="signin" options={{ headerShown: false }} />
          </Stack>
        </NetworkProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NetworkProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="learn" options={{ headerShown: false }} />
          <Stack.Screen name="ai-tutor" options={{ headerShown: false }} />
          <Stack.Screen name="lesson" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="flashcards/[category]" options={{ headerShown: false }} />
          <Stack.Screen name="quiz/[category]" options={{ headerShown: false }} />
          <Stack.Screen name="progress" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="morning-vocab" options={{ headerShown: false }} />
          <Stack.Screen name="echo-practice" options={{ headerShown: false }} />
          <Stack.Screen name="journal" options={{ headerShown: false }} />
          <Stack.Screen name="practice-phrases" options={{ headerShown: false }} />
          <Stack.Screen name="story" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="achievements" options={{ headerShown: false }} />
          <Stack.Screen name="review" options={{ headerShown: false }} />
          <Stack.Screen name="practice-mistakes" options={{ headerShown: false }} />
          <Stack.Screen name="grammar" options={{ headerShown: false }} />
          <Stack.Screen name="sentence-builder" options={{ headerShown: false }} />
          <Stack.Screen name="listening" options={{ headerShown: false }} />
          <Stack.Screen name="heatmap" options={{ headerShown: false }} />
          <Stack.Screen name="culture" options={{ headerShown: false }} />
          <Stack.Screen name="roleplay" options={{ headerShown: false }} />
          <Stack.Screen name="photo-vocab" options={{ headerShown: false }} />
          <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
        </Stack>
        <NotificationPromptModal />
      </NetworkProvider>
    </ErrorBoundary>
  );
}
