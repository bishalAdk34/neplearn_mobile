const cache = new Map<string, string | null>();
const MAX_SIMPLIFY_DEPTH = 3;

export async function getWordImage(english: string, depth = 0): Promise<string | null> {
  if (cache.has(english)) return cache.get(english) ?? null;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(english)}`,
      { headers: { 'User-Agent': 'NepLearn/1.0' } }
    );
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    const url = data?.thumbnail?.source || data?.originalimage?.source || null;
    cache.set(english, url);
    return url;
  } catch {
    // Try simplified term for compound words, bounded to avoid runaway recursion
    if (depth < MAX_SIMPLIFY_DEPTH) {
      const simple = english.replace(/[?.!]/g, '').split(' ')[0];
      if (simple && simple !== english) {
        const result = await getWordImage(simple, depth + 1);
        cache.set(english, result);
        return result;
      }
    }
    cache.set(english, null);
    return null;
  }
}
