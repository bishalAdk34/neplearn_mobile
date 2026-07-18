import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import SplashScreen from '../src/components/SplashScreen';
import { useVocabStore, GUEST_ID } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { useAuthStore } from '../src/stores/auth';
import { initNotifications, initNotificationLogListener, refreshDailyReminder, refreshWordOfDay } from '../src/services/notifications';
import { networkManager } from '../src/services/network';
import { syncManager } from '../src/services/syncManager';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import './global.css';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const onboardingDone = useVocabStore(s => s.onboardingDone);
  const user = useAuthStore(s => s.user);
  const initializeAuth = useAuthStore(s => s.initialize);
  const syncFromCloud = useVocabStore(s => s.syncFromCloud);

  useEffect(() => {
    if (splashDone) {
      initializeAuth();
    }
  }, [splashDone, initializeAuth]);

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
      if (state === 'active') refreshReminder();
    });

    return () => {
      unsubscribeLog?.();
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    networkManager.init();
    syncManager.init();
    return () => {
      networkManager.destroy();
      syncManager.destroy();
    };
  }, []);

  useEffect(() => {
    if (user && !user.id.startsWith('__guest__')) {
      syncFromCloud(user.id);
      useSrsStore.getState().syncFromCloud(user.id);
    }
  }, [user, syncFromCloud]);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  if (!onboardingDone) {
    return (
      <NetworkProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
        </Stack>
      </NetworkProvider>
    );
  }

  return (
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
      </Stack>
    </NetworkProvider>
  );
}
