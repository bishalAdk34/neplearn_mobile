import React, { useState, useEffect } from 'react';
import { AppState, InteractionManager, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { useVocabStore, GUEST_ID } from '../src/data/vocab';
import { useSrsStore } from '../src/stores/srs';
import { useAuthStore } from '../src/stores/auth';

import {
  initNotifications,
  initNotificationLogListener,
  refreshDailyReminder,
  refreshWordOfDay,
} from '../src/services/notifications';

import { networkManager } from '../src/services/network';
import { syncManager } from '../src/services/syncManager';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import NotificationPromptModal from '../src/components/NotificationPromptModal';
import { maybeShowNotifPrompt } from '../src/stores/notifPrompt';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { getMissingConfigKeys } from '../src/config';

import './global.css';

export default function RootLayout() {
  // onboardingDone is persisted in AsyncStorage, which hydrates async.
  // Until it does, the store reports the default (false), so rendering
  // routes early makes the wrong screen flash before the real one.
  const [hydrated, setHydrated] = useState(() =>
    useVocabStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;

    const unsub = useVocabStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );

    if (useVocabStore.persist.hasHydrated()) setHydrated(true);

    return unsub;
  }, [hydrated]);

  const onboardingDone = useVocabStore(
    (s) => s.onboardingDone
  );

  const user = useAuthStore((s) => s.user);
  const initializeAuth = useAuthStore((s) => s.initialize);

  const syncFromCloud = useVocabStore(
    (s) => s.syncFromCloud
  );

  // --------------------------------------------------
  // Authentication initialization
  // --------------------------------------------------

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // --------------------------------------------------
  // Notifications
  // --------------------------------------------------

  useEffect(() => {
    initNotifications().catch(() => {});

    let unsubscribeLog:
      | (() => void)
      | undefined;

    initNotificationLogListener()
      .then((unsub) => {
        unsubscribeLog = unsub;
      })
      .catch(() => {});

    const refreshReminder = () => {
      const uid =
        useAuthStore.getState().user?.id ||
        GUEST_ID;

      const streak =
        useVocabStore
          .getState()
          .getLocalStreak(uid)
          .current;

      refreshDailyReminder(streak).catch(() => {});
      refreshWordOfDay().catch(() => {});
    };

    // Initial refresh
    refreshReminder();

    // Refresh when app comes back to foreground
    const appStateSub = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          refreshReminder();
        }
      }
    );

    return () => {
      unsubscribeLog?.();
      appStateSub.remove();
    };
  }, []);

  // --------------------------------------------------
  // Network + Sync initialization
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await networkManager.init();

      if (cancelled) return;

      syncManager.init();
    })();

    return () => {
      cancelled = true;

      networkManager.destroy();
      syncManager.destroy();
    };
  }, []);

  // --------------------------------------------------
  // Environment config check
  // --------------------------------------------------

  useEffect(() => {
    const missing = getMissingConfigKeys();

    if (missing.length > 0) {
      console.warn(
        `[config] Missing required env vars: ${missing.join(
          ', '
        )}. Check .env.`
      );
    }
  }, []);

  // --------------------------------------------------
  // Notification prompt
  // --------------------------------------------------

  useEffect(() => {
    if (!onboardingDone) return;

    const timer = setTimeout(
      () => maybeShowNotifPrompt(),
      150000
    );

    return () => clearTimeout(timer);
  }, [onboardingDone]);

  // --------------------------------------------------
  // Cloud sync
  // --------------------------------------------------

  useEffect(() => {
    if (
      user &&
      !user.id.startsWith('__guest__')
    ) {
      const handle =
        InteractionManager.runAfterInteractions(() => {
          syncFromCloud(user.id);

          useSrsStore
            .getState()
            .syncFromCloud(user.id);
        });

      return () => handle.cancel();
    }
  }, [user, syncFromCloud]);

  // --------------------------------------------------
  // Wait for persisted state (matches native splash bg)
  // --------------------------------------------------

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF9F4' }} />
    );
  }

  // --------------------------------------------------
  // ROUTES
  // --------------------------------------------------

  // One Stack for both states: Stack.Protected sends the user to the
  // first allowed screen, so "/" never renders before onboarding is done.
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NetworkProvider>

          {/*
            IMPORTANT:
            This is what fixes the Android status bar
            and bottom gesture/navigation area overlap.
            Onboarding has no BottomNav, so it also
            needs the bottom inset.
          */}
          <SafeAreaView
            style={{ flex: 1 }}
            edges={onboardingDone ? ['top'] : ['top', 'bottom']}
          >
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Protected guard={onboardingDone}>
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="learn"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="ai-tutor"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="lesson"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="profile"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="flashcards/[category]"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="quiz/[category]"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="progress"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="settings"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="morning-vocab"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="echo-practice"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="journal"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="practice-phrases"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="story"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="about"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="notifications"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="achievements"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="review"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="practice-mistakes"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="grammar"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="sentence-builder"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="listening"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="match-pairs"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="skill-tree"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="listen-type"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="speak-check"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="heatmap"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="culture"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="roleplay"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="photo-vocab"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="leaderboard"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="help"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="support"
                options={{
                  headerShown: false,
                }}
              />
              </Stack.Protected>

              <Stack.Protected guard={!onboardingDone}>
                <Stack.Screen
                  name="onboarding"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack.Protected>

              <Stack.Screen
                name="signin"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="privacy"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </SafeAreaView>

          <NotificationPromptModal />

        </NetworkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}