export const YEAR_TINT_COUNT = 10;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small seeded PRNG (mulberry32): same seed, same sequence, on every device. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A fresh color for each year, reshuffled once per day. The day's date is the
 * seed, so the colors stay put all day and both phones see the same ones.
 * Years get distinct colors (up to YEAR_TINT_COUNT of them).
 */
export function dailyYearTints(dateSeed: string, years: number[]): Map<number, number> {
  const order = Array.from({ length: YEAR_TINT_COUNT }, (_, i) => i);
  const rand = random(hash(dateSeed));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return new Map(years.map((year, i) => [year, order[i % YEAR_TINT_COUNT]]));
}
