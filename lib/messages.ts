// Loading the prepared data (see scripts/prepare-data.mjs) in the app, with
// mock data as the fallback wherever the real data isn't available.

import { dayKey, logicalDay } from "./day";
import { MOCK_MESSAGES } from "./mock-messages";
import { computeStats, type Stats } from "./stats";
import type { MediaKind, Message } from "./types";

const DATA_URL = "/private";

/** Fetch prepared JSON, or the fallback when it's missing (e.g. not deployed yet). */
async function fetchJson<T>(path: string, fallback: () => T): Promise<T> {
  try {
    const res = await fetch(`${DATA_URL}/${path}`);
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

let statsPromise: Promise<Stats> | null = null;

/** Whole-history stats, computed at build time. */
export function loadStats(): Promise<Stats> {
  statsPromise ??= fetchJson("stats.json", () => computeStats(MOCK_MESSAGES));
  return statsPromise;
}

/** Compact form written by scripts/prepare-data.mjs: [ts, sender, text, [kind, id?]?]. */
type RawMessage = [number, 0 | 1, string, [MediaKind, (string | null)?]?];

const dayCache = new Map<string, Promise<Map<number, Message[]>>>();

/**
 * Our messages on an "MM-DD" day, by year (newest first), from the prepared
 * day file. Falls back to mock data where the real data isn't available.
 */
export function loadDay(key: string): Promise<Map<number, Message[]>> {
  let day = dayCache.get(key);
  if (!day) {
    day = fetchJson<Record<string, RawMessage[]> | null>(`days/${key}.json`, () => null).then((byYear) => {
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
    msg.media = { kind, src: kind === "photo" && id ? `${DATA_URL}/media/${id}.jpg` : null };
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
