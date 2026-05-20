const cache = new Map<string, string | null>();

export async function getWordImage(english: string): Promise<string | null> {
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
    // Try simplified term for compound words
    const simple = english.replace(/[?.!]/g, '').split(' ')[0];
    if (simple !== english) return getWordImage(simple);
    cache.set(english, null);
    return null;
  }
}
