import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'nepali-offline-queue';

export type QueueOperationType =
  | 'LEARN_WORD'
  | 'UNLEARN_WORD'
  | 'ADD_XP'
  | 'UPDATE_STREAK'
  | 'SAVE_CHAT_MESSAGE';

export interface QueuedOperationPayload {
  userId: string;
  wordId?: number;
  xpAmount?: number;
  xpSource?: string;
  chatRole?: 'user' | 'assistant';
  chatContent?: string;
}

export interface QueuedOperation {
  id: string;
  type: QueueOperationType;
  payload: QueuedOperationPayload;
  createdAt: number;
  retryCount: number;
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
  operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'retryCount'>
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...operation,
    id: generateId(),
    createdAt: Date.now(),
    retryCount: 0,
  });
  await saveQueue(queue);
}

export async function dequeue(): Promise<QueuedOperation | null> {
  const queue = await getQueue();
  if (queue.length === 0) return null;
  const [first, ...rest] = queue;
  await saveQueue(rest);
  return first;
}

export async function peekQueue(): Promise<QueuedOperation | null> {
  const queue = await getQueue();
  return queue[0] || null;
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
