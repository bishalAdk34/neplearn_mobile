import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'nepali-offline-queue';

export type QueueOperationType =
  | 'LEARN_WORD'
  | 'UNLEARN_WORD'
  | 'ADD_XP'
  | 'UPDATE_STREAK'
  | 'SAVE_CHAT_MESSAGE'
  | 'SAVE_JOURNAL'
  | 'UPSERT_PROFILE'
  | 'UPSERT_SRS';

export interface QueuedOperationPayload {
  userId: string;
  wordId?: number;
  xpAmount?: number;
  xpSource?: string;
  chatRole?: 'user' | 'assistant';
  chatContent?: string;
  // UPDATE_STREAK (state push)
  streakCurrent?: number;
  streakLongest?: number;
  streakLastDate?: string;
  // SAVE_JOURNAL
  promptNepali?: string;
  promptRoman?: string;
  promptEnglish?: string;
  responseText?: string;
  // UPSERT_PROFILE
  profileName?: string;
  profileEmail?: string;
  profileAvatarUrl?: string;
  // UPSERT_SRS
  srsBox?: number;
  srsLastResult?: boolean;
  srsLastReviewedAt?: string;
  srsDueAt?: string;
  srsCorrectCount?: number;
  srsIncorrectCount?: number;
}

export interface QueuedOperation {
  id: string;
  type: QueueOperationType;
  payload: QueuedOperationPayload;
  createdAt: number;
  retryCount: number;
  dedupeKey?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function getQueue(): Promise<QueuedOperation[]> {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as QueuedOperation[];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedOperation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(
  operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'retryCount'>,
  dedupeKey?: string
): Promise<void> {
  let queue = await getQueue();
  if (dedupeKey) {
    // Latest state replaces any older queued op with the same key
    queue = queue.filter((op) => op.dedupeKey !== dedupeKey);
  }
  queue.push({
    ...operation,
    id: generateId(),
    createdAt: Date.now(),
    retryCount: 0,
    dedupeKey,
  });
  await saveQueue(queue);
}

export async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const idx = queue.findIndex((op) => op.id === id);
  if (idx !== -1) {
    queue[idx].retryCount += 1;
    await saveQueue(queue);
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((op) => op.id !== id);
  await saveQueue(filtered);
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
