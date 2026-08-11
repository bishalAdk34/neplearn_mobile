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

type OpResult = { success: true } | { success: false; permanent: boolean };

/**
 * Classify a Supabase/PostgREST error as permanent (retrying won't help — bad
 * data, constraint violation, RLS denial) vs transient (network blip, drop the
 * connection mid-request, etc). Postgres error codes: 22xxx = invalid input,
 * 23xxx = integrity constraint violation, 42xxx = syntax/access rule violation
 * (includes 42501 = insufficient_privilege / RLS denial).
 */
function classify(error: { code?: string } | null): OpResult {
  if (!error) return { success: true };
  const permanent = /^(22|23|42)/.test(error.code || '');
  return { success: false, permanent };
}

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

        const result = await this.processOperation(operation);
        if (result.success) {
          await removeFromQueue(operation.id);
        } else if (result.permanent) {
          console.warn(`Operation ${operation.id} (${operation.type}) failed permanently, dropping without retry`);
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

  private async processOperation(op: QueuedOperation): Promise<OpResult> {
    const { type, payload } = op;

    if (!supabase) return { success: true };

    try {
      switch (type) {
        case 'LEARN_WORD': {
          const { error } = await supabase
            .from('user_learned_words')
            .upsert(
              { user_id: payload.userId, word_id: payload.wordId },
              { onConflict: 'user_id,word_id' }
            );
          return classify(error);
        }

        case 'UNLEARN_WORD': {
          const { error } = await supabase
            .from('user_learned_words')
            .delete()
            .eq('user_id', payload.userId)
            .eq('word_id', payload.wordId);
          return classify(error);
        }

        case 'ADD_XP': {
          const { error } = await supabase
            .from('user_xp')
            .insert({
              user_id: payload.userId,
              xp_amount: payload.xpAmount,
              source: payload.xpSource,
            });
          return classify(error);
        }

        case 'UPDATE_STREAK': {
          if (
            payload.streakCurrent === undefined ||
            payload.streakLongest === undefined ||
            !payload.streakLastDate
          ) {
            return { success: true }; // Legacy op without state payload — drop it
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
          return classify(error);
        }

        case 'SAVE_CHAT_MESSAGE': {
          const { error } = await supabase
            .from('ai_chat_history')
            .insert({
              user_id: payload.userId,
              role: payload.chatRole,
              content: payload.chatContent,
              conversation_id: payload.conversationId,
            });
          return classify(error);
        }

        case 'CREATE_CONVERSATION': {
          const { error } = await supabase
            .from('ai_conversations')
            .upsert(
              {
                id: payload.conversationId,
                user_id: payload.userId,
                title: payload.conversationTitle ?? 'New chat',
              },
              { onConflict: 'id' }
            );
          return classify(error);
        }

        case 'RENAME_CONVERSATION': {
          const { error } = await supabase
            .from('ai_conversations')
            .update({ title: payload.conversationTitle, updated_at: new Date().toISOString() })
            .eq('id', payload.conversationId)
            .eq('user_id', payload.userId);
          return classify(error);
        }

        case 'DELETE_CONVERSATION': {
          const { error } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('id', payload.conversationId)
            .eq('user_id', payload.userId);
          return classify(error);
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
          return classify(error);
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
          return classify(error);
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
          return classify(error);
        }

        default:
          console.warn(`Unknown operation type: ${type}`);
          return { success: true }; // Remove unknown ops
      }
    } catch (e) {
      console.error('processOperation error:', e);
      return { success: false, permanent: false };
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
