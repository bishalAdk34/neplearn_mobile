import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueue,
  getQueue,
  getQueueSize,
  incrementRetry,
  removeFromQueue,
  clearQueue,
} from '../src/services/offlineQueue';

const QUEUE_KEY = 'nepali-offline-queue';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('offlineQueue', () => {
  it('starts empty', async () => {
    expect(await getQueue()).toEqual([]);
    expect(await getQueueSize()).toBe(0);
  });

  it('enqueues operations FIFO with id/createdAt/retryCount', async () => {
    await enqueue({ type: 'LEARN_WORD', payload: { userId: 'u1', wordId: 1 } });
    await enqueue({ type: 'ADD_XP', payload: { userId: 'u1', xpAmount: 20 } });

    const queue = await getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('LEARN_WORD');
    expect(queue[1].type).toBe('ADD_XP');
    expect(queue[0].id).toBeTruthy();
    expect(queue[0].retryCount).toBe(0);
    expect(typeof queue[0].createdAt).toBe('number');
  });

  it('replaces older op with same dedupeKey', async () => {
    await enqueue(
      { type: 'UPDATE_STREAK', payload: { userId: 'u1', streakCurrent: 1 } },
      'streak-u1'
    );
    await enqueue(
      { type: 'UPDATE_STREAK', payload: { userId: 'u1', streakCurrent: 2 } },
      'streak-u1'
    );

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.streakCurrent).toBe(2);
  });

  it('keeps ops with different dedupeKeys', async () => {
    await enqueue({ type: 'UPSERT_SRS', payload: { userId: 'u1', wordId: 1 } }, 'srs-u1-1');
    await enqueue({ type: 'UPSERT_SRS', payload: { userId: 'u1', wordId: 2 } }, 'srs-u1-2');
    expect(await getQueueSize()).toBe(2);
  });

  it('increments retry count for a specific op', async () => {
    await enqueue({ type: 'LEARN_WORD', payload: { userId: 'u1', wordId: 1 } });
    const [op] = await getQueue();
    await incrementRetry(op.id);
    await incrementRetry(op.id);
    const [updated] = await getQueue();
    expect(updated.retryCount).toBe(2);
  });

  it('removes a specific op', async () => {
    await enqueue({ type: 'LEARN_WORD', payload: { userId: 'u1', wordId: 1 } });
    await enqueue({ type: 'UNLEARN_WORD', payload: { userId: 'u1', wordId: 2 } });
    const queue = await getQueue();
    await removeFromQueue(queue[0].id);
    const remaining = await getQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].type).toBe('UNLEARN_WORD');
  });

  it('clears the whole queue', async () => {
    await enqueue({ type: 'LEARN_WORD', payload: { userId: 'u1', wordId: 1 } });
    await clearQueue();
    expect(await getQueueSize()).toBe(0);
  });

  it('returns empty array on corrupted storage', async () => {
    await AsyncStorage.setItem(QUEUE_KEY, 'not-json{');
    expect(await getQueue()).toEqual([]);
  });
});
