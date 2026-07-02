import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import SplashScreen from '../src/components/SplashScreen';
import { useVocabStore } from '../src/data/vocab';
import { useAuthStore } from '../src/stores/auth';
import { initNotifications } from '../src/services/notifications';
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
    initNotifications();
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
      </Stack>
    </NetworkProvider>
  );
}
