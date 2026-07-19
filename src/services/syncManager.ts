import { AppState, AppStateStatus } from 'react-native';
import { supabase } from './supabase';
import {
  getQueue,
  removeFromQueue,
  incrementRetry,
  QueuedOperation,
} from './offlineQueue';
import { networkManager } from './network';
import { mergeStreaks } from './streak';

const MAX_RETRIES = 3;

class SyncManager {
  private isSyncing = false;
  private unsubscribe: (() => void) | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  init(): void {
    this.unsubscribe = networkManager.addListener((isConnected) => {
      if (isConnected) {
        this.processQueue();
      }
    });

    this.appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active' && networkManager.getIsConnected()) {
          this.processQueue();
        }
      }
    );

    // Initial sync if already online
    if (networkManager.getIsConnected()) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const queue = await getQueue();
      for (const operation of queue) {
        if (!networkManager.getIsConnected()) break;

        const success = await this.processOperation(operation);
        if (success) {
          await removeFromQueue(operation.id);
        } else if (operation.retryCount < MAX_RETRIES) {
          await incrementRetry(operation.id);
        } else {
          // Max retries reached, remove from queue
          console.warn(`Operation ${operation.id} failed after ${MAX_RETRIES} retries, removing`);
          await removeFromQueue(operation.id);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async processOperation(op: QueuedOperation): Promise<boolean> {
    const { type, payload } = op;

    try {
      switch (type) {
        case 'LEARN_WORD': {
          const { error } = await supabase
            .from('user_learned_words')
            .upsert(
              { user_id: payload.userId, word_id: payload.wordId },
              { onConflict: 'user_id,word_id' }
            );
          return !error;
        }

        case 'UNLEARN_WORD': {
          const { error } = await supabase
            .from('user_learned_words')
            .delete()
            .eq('user_id', payload.userId)
            .eq('word_id', payload.wordId);
          return !error;
        }

        case 'ADD_XP': {
          const { error } = await supabase
            .from('user_xp')
            .insert({
              user_id: payload.userId,
              xp_amount: payload.xpAmount,
              source: payload.xpSource,
            });
          return !error;
        }

        case 'UPDATE_STREAK': {
          if (
            payload.streakCurrent === undefined ||
            payload.streakLongest === undefined ||
            !payload.streakLastDate
          ) {
            return true; // Legacy op without state payload — drop it
          }
          const { data: remote } = await supabase
            .from('user_streaks')
            .select('current_streak, longest_streak, last_activity_date')
            .eq('user_id', payload.userId)
            .maybeSingle();

          const merged = mergeStreaks(
            {
              current: payload.streakCurrent ?? 0,
              longest: payload.streakLongest ?? 0,
              lastDate: payload.streakLastDate ?? '',
            },
            remote
          );

          const { error } = await supabase.from('user_streaks').upsert(
            {
              user_id: payload.userId,
              current_streak: merged.current,
              longest_streak: merged.longest,
              last_activity_date: merged.lastDate,
            },
            { onConflict: 'user_id' }
          );
          return !error;
        }

        case 'SAVE_CHAT_MESSAGE': {
          const { error } = await supabase
            .from('ai_chat_history')
            .insert({
              user_id: payload.userId,
              role: payload.chatRole,
              content: payload.chatContent,
            });
          return !error;
        }

        case 'SAVE_JOURNAL': {
          const { error } = await supabase
            .from('journal_entries')
            .insert({
              user_id: payload.userId,
              prompt_nepali: payload.promptNepali,
              prompt_roman: payload.promptRoman,
              prompt_english: payload.promptEnglish,
              response_text: payload.responseText,
              feedback_text: payload.feedbackText ?? null,
            });
          return !error;
        }

        case 'UPSERT_PROFILE': {
          const { error } = await supabase
            .from('profiles')
            .upsert(
              {
                id: payload.userId,
                name: payload.profileName,
                email: payload.profileEmail,
                avatar_url: payload.profileAvatarUrl,
              },
              { onConflict: 'id' }
            );
          return !error;
        }

        case 'UPSERT_SRS': {
          const { error } = await supabase
            .from('user_word_srs')
            .upsert(
              {
                user_id: payload.userId,
                word_id: payload.wordId,
                box: payload.srsBox,
                last_result: payload.srsLastResult,
                last_reviewed_at: payload.srsLastReviewedAt,
                due_at: payload.srsDueAt,
                correct_count: payload.srsCorrectCount,
                incorrect_count: payload.srsIncorrectCount,
              },
              { onConflict: 'user_id,word_id' }
            );
          return !error;
        }

        default:
          console.warn(`Unknown operation type: ${type}`);
          return true; // Remove unknown ops
      }
    } catch (e) {
      console.error('processOperation error:', e);
      return false;
    }
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

export const syncManager = new SyncManager();
