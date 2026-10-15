// Our messages and stats for the app: decrypted from public/data/ once
// unlocked, or mock data when there's no encrypted data (e.g. a fresh clone).

import { dayKey, logicalDay } from "./day";
import { MOCK_MESSAGES } from "./mock-messages";
import { computeStats, type Stats } from "./stats";
import type { MediaKind, Message } from "./types";
import { fetchDecryptedJson, isUnlocked } from "./vault";

/** The decrypted file, or the mock fallback when the data isn't unlocked. */
async function load<T>(path: string, fallback: () => T): Promise<T> {
  return isUnlocked() ? fetchDecryptedJson<T>(path) : fallback();
}

let statsPromise: Promise<Stats> | null = null;

/** Whole-history stats, computed at build time. */
export function loadStats(): Promise<Stats> {
  statsPromise ??= load("stats.bin", () => computeStats(MOCK_MESSAGES));
  return statsPromise;
}

/** Compact form written by scripts/prepare-data.mjs: [ts, sender, text, [kind, id?]?]. */
type RawMessage = [number, 0 | 1, string, [MediaKind, (string | null)?]?];

const dayCache = new Map<string, Promise<Map<number, Message[]>>>();

/**
 * Our messages on an "MM-DD" day, by year (newest first). Falls back to mock
 * data when the real data isn't unlocked.
 */
export function loadDay(key: string): Promise<Map<number, Message[]>> {
  let day = dayCache.get(key);
  if (!day) {
    day = load<Record<string, RawMessage[]> | null>(`days/${key}.bin`, () => null).then((byYear) => {
      if (!byYear) return messagesForDay(MOCK_MESSAGES, key);
      const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
      return new Map(years.map((y) => [y, byYear[y].map(toMessage)]));
    });
    dayCache.set(key, day);
  }
  return day;
}

function toMessage([ts, sender, text, media]: RawMessage): Message {
  const msg: Message = { ts, sender: sender === 0 ? "on" : "ona", text };
  if (media) {
    const [kind, id] = media;
    msg.media = { kind, id: kind === "photo" ? (id ?? null) : null };
  }
  return msg;
}

/** Messages on the given "MM-DD" day, grouped by year (newest year first). */
export function messagesForDay(all: Message[], key: string): Map<number, Message[]> {
  const byYear = new Map<number, Message[]>();
  for (const m of all) {
    const d = logicalDay(m.ts);
    if (dayKey(d) !== key) continue;
    const list = byYear.get(d.year) ?? [];
    list.push(m);
    byYear.set(d.year, list);
  }
  for (const list of byYear.values()) list.sort((a, b) => a.ts - b.ts);
  return new Map([...byYear.entries()].sort(([a], [b]) => b - a));
}
