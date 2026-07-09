import { supabase } from './supabase';
import { networkManager } from './network';
import { enqueue } from './offlineQueue';
import { useVocabStore, GUEST_ID } from '../data/vocab';

export interface StreakState {
  current: number;
  longest: number;
  lastDate: string;
  freezeWeek?: string;
}

/**
 * Merge local streak state with remote row. Later lastDate wins for
 * current streak; longest is the max of both. Freeze consumption is
 * sticky: the later ISO week string wins so a used freeze never reverts.
 */
export function mergeStreaks(
  local: StreakState,
  remote: { current_streak: number; longest_streak: number; last_activity_date: string; freeze_week?: string | null } | null
): StreakState {
  if (!remote || !remote.last_activity_date) return local;
  const longest = Math.max(local.longest, remote.longest_streak || 0);
  const weeks = [local.freezeWeek, remote.freeze_week || undefined].filter((w): w is string => !!w);
  const freezeWeek = weeks.length ? weeks.sort()[weeks.length - 1] : undefined;
  if (remote.last_activity_date > local.lastDate) {
    return { current: remote.current_streak, longest, lastDate: remote.last_activity_date, freezeWeek };
  }
  return { ...local, longest, freezeWeek };
}

/**
 * Push local streak state to Supabase (merge with remote). Enqueues an
 * UPDATE_STREAK op on failure/offline so state is never lost.
 */
export async function pushStreak(userId: string, state: StreakState): Promise<void> {
  if (userId === GUEST_ID || userId.startsWith('__guest__')) return;

  if (networkManager.getIsConnected()) {
    try {
      const { data: remote } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, last_activity_date, freeze_week')
        .eq('user_id', userId)
        .maybeSingle();

      const merged = mergeStreaks(state, remote);

      const { error } = await supabase.from('user_streaks').upsert(
        {
          user_id: userId,
          current_streak: merged.current,
          longest_streak: merged.longest,
          last_activity_date: merged.lastDate,
          freeze_week: merged.freezeWeek ?? null,
        },
        { onConflict: 'user_id' }
      );
      if (!error) return;
    } catch (e) {
      console.warn('pushStreak failed, queueing:', e);
    }
  }

  await enqueue(
    {
      type: 'UPDATE_STREAK',
      payload: {
        userId,
        streakCurrent: state.current,
        streakLongest: state.longest,
        streakLastDate: state.lastDate,
        streakFreezeWeek: state.freezeWeek,
      },
    },
    `streak-${userId}`
  );
}

/**
 * Record daily activity: advances the local streak (source of truth for
 * all users) and pushes state to Supabase for signed-in users.
 */
export async function recordActivity(userId: string): Promise<void> {
  const store = useVocabStore.getState();
  store.addLocalStreak(userId);

  if (userId === GUEST_ID || userId.startsWith('__guest__')) return;

  const local = store.localStreak[userId];
  if (!local) return;

  await pushStreak(userId, {
    current: local.current,
    longest: local.longest,
    lastDate: local.lastDate,
    freezeWeek: local.freezeWeek,
  });
}
