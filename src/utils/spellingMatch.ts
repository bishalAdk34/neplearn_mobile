/** Case-insensitive, whitespace-normalized spelling comparison with small-typo tolerance. */

export function normalizeSpelling(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    prev = curr;
  }
  return prev[n];
}

/**
 * True if `input` is close enough to `target` to count as correct.
 * Allows roughly one typo per 4 characters (min 1 char tolerance for any non-empty target).
 */
export function isSpellingMatch(input: string, target: string, maxDistanceRatio = 0.25): boolean {
  const a = normalizeSpelling(input);
  const b = normalizeSpelling(target);
  if (a.length === 0) return false;
  if (a === b) return true;

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const maxAllowed = Math.max(1, Math.floor(maxLen * maxDistanceRatio));
  return distance <= maxAllowed;
}
