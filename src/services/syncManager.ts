import { supabase } from './supabase';
import {
  getQueue,
  removeFromQueue,
  incrementRetry,
  QueuedOperation,
} from './offlineQueue';
import { networkManager } from './network';

const MAX_RETRIES = 3;

class SyncManager {
  private isSyncing = false;
  private unsubscribe: (() => void) | null = null;

  init(): void {
    this.unsubscribe = networkManager.addListener((isConnected) => {
      if (isConnected) {
        this.processQueue();
      }
    });

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
          // Streak logic handled by db.ts updateStreak, just re-call it
          // For now, mark success since streak ops are idempotent
          return true;
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
  }
}

export const syncManager = new SyncManager();
