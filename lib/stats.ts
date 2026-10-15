// Whole-history statistics. Pure and environment-free: the app uses it for
// mock data, and scripts/prepare-data.mjs runs it over the real history at
// build time (hence the explicit .ts import paths, which Node needs).

import { belgradeParts, dayKey, logicalDay, logicalDayOf } from "./day.ts";
import type { MediaKind, Message, Person } from "./types.ts";

// --- Counting ---

// Hearts: every heart emoji in the text, plus heart stickers (`media.heart`).
// Reactions on messages don't count (they're not in the data at all).
//
// Every heart in Unicode, in any color (incl. 🩷🩵🩶 from 2023), heart faces
// and gestures, and the text heart "<3". Same code points on iOS and Android.
// ❤️‍🔥 / ❤️‍🩹 count once (via ❤). 💔 is left out on purpose.
const HEART_RE = /❤️?|♥️?|❣️?|💕|💖|💗|💓|💞|💘|💝|💟|💌|🧡|💛|💚|💙|💜|🩷|🩵|🩶|🤍|🖤|🤎|😍|🥰|😘|😻|🫶|<3/gu;

// Smiling and laughing faces, plus the text smileys common in 2017.
const SMILE_RE = /😂|🤣|😄|😁|😆|😅|😀|😃|😊|🙂|☺️?|😇|🥰|😍|😹|😸|:-?\)|:-?D\b|\b[xX]D\b/gu;

// Runs of letters or digits; emoji and punctuation aren't words.
const WORD_RE = /[\p{L}\p{N}]+/gu;

// "obožavam te", "Obozavam teeee"; not after "ne".
const ADORE_RE = /(?<!\p{L})(?<!(?<!\p{L})ne\s+)obo[zž]a+v+a+m+\s*te+(?!\p{L})/giu;

// "Booty call": sirens, megaphones, bells and the like, plus 🚒 (our own code).
// Not ⏰ (a real alarm) and not 🚑.
const BOOTY_CALL_RE = /🚨|📢|📣|🔊|🔔|🛎|🚓|🚔|🆘|🚒/u;

const count = (re: RegExp, text: string) => text.match(re)?.length ?? 0;

export const countHearts = (text: string) => count(HEART_RE, text);
export const countSmiles = (text: string) => count(SMILE_RE, text);
export const countWords = (text: string) => count(WORD_RE, text);
export const countAdores = (text: string) => count(ADORE_RE, text);
export const isBootyCall = (text: string) => BOOTY_CALL_RE.test(text);

// --- Parts of the day ---

export type DayPart = "jutro" | "dan" | "vece" | "noc";

export const DAY_PARTS: Record<DayPart, { label: string; hours: string }> = {
  jutro: { label: "Jutro", hours: "06–12h" },
  dan: { label: "Dan", hours: "12–17h" },
  vece: { label: "Veče", hours: "17–22h" },
  noc: { label: "Noć", hours: "22–06h" },
};

export function dayPartOf(hour: number): DayPart {
  if (hour < 6) return "noc";
  if (hour < 12) return "jutro";
  if (hour < 17) return "dan";
  if (hour < 22) return "vece";
  return "noc";
}

// --- Stats ---

export type DayCount = { year: number; month: number; day: number; count: number };

export type Stats = {
  total: number;
  totalHearts: number;
  messages: Record<Person, number>;
  hearts: Record<Person, number>;
  words: Record<Person, number>;
  /** Days (06:00 reset) on which each of us sent the first message. */
  firstOfDay: Record<Person, number>;
  dayParts: Record<DayPart, number>;
  busiestPart: { part: DayPart; share: number } | null;
  /** Logical day (06:00 reset) with the most messages. */
  busiestDay: DayCount | null;
  /** Logical day with the most smiling/laughing faces. */
  happiestDay: DayCount | null;
  /** How it started: every message of our first day (06:00 reset). */
  firstDay: Pick<Message, "ts" | "sender" | "text">[];
  /** Messages with 🚨, 📢 or a similar alarm (once per message, however many). */
  bootyCalls: Record<Person, number>;
  /** Every "obožavam te", and the first one. */
  adore: { count: number; first: Pick<Message, "ts" | "sender"> | null };
};

const perPerson = (): Record<Person, number> => ({ on: 0, ona: 0 });

/** One pass over the whole history; input order doesn't matter. */
export function computeStats(all: readonly Message[]): Stats {
  const messages = perPerson();
  const hearts = perPerson();
  const words = perPerson();
  const firstOfDay = perPerson();
  const dayParts: Record<DayPart, number> = { jutro: 0, dan: 0, vece: 0, noc: 0 };
  const perDay = new Map<string, number>();
  const smilesPerDay = new Map<string, number>();
  const bootyCalls = perPerson();
  const adore: Stats["adore"] = { count: 0, first: null };

  const sorted = [...all].sort((a, b) => a.ts - b.ts);
  for (const m of sorted) {
    const parts = belgradeParts(m.ts);
    const d = logicalDayOf(parts);
    const day = `${d.year}-${dayKey(d)}`;

    messages[m.sender]++;
    hearts[m.sender] += countHearts(m.text) + (m.media?.heart ? 1 : 0);
    words[m.sender] += countWords(m.text);
    dayParts[dayPartOf(parts.hour)]++;
    // Messages are in time order, so the first one we see for a day opens it.
    if (!perDay.has(day)) firstOfDay[m.sender]++;
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    const smiles = countSmiles(m.text);
    if (smiles) smilesPerDay.set(day, (smilesPerDay.get(day) ?? 0) + smiles);
    if (isBootyCall(m.text)) bootyCalls[m.sender]++;
    const adores = countAdores(m.text);
    if (adores) {
      adore.count += adores;
      adore.first ??= { ts: m.ts, sender: m.sender };
    }
  }

  const busiest = maxEntry(Object.entries(dayParts) as [DayPart, number][]);
  return {
    total: all.length,
    totalHearts: hearts.on + hearts.ona,
    messages,
    hearts,
    words,
    firstOfDay,
    dayParts,
    firstDay: firstDay(sorted),
    busiestPart: busiest && busiest[1] > 0 ? { part: busiest[0], share: busiest[1] / all.length } : null,
    busiestDay: toDayCount(maxEntry(perDay)),
    happiestDay: toDayCount(maxEntry(smilesPerDay)),
    bootyCalls,
    adore,
  };
}

const ATTACHMENT_EMOJI: Record<MediaKind, string> = { photo: "📷", video: "🎥", gif: "🎞️", audio: "🎙️", sticker: "🏷️" };

/** All messages of the first logical day, attachments as an emoji (time-ordered input). */
function firstDay(sorted: readonly Message[]): Stats["firstDay"] {
  if (!sorted.length) return [];
  const key = (ts: number) => {
    const d = logicalDay(ts);
    return `${d.year}-${dayKey(d)}`;
  };
  const first = key(sorted[0].ts);
  const out: Stats["firstDay"] = [];
  for (const m of sorted) {
    if (key(m.ts) !== first) break;
    out.push({ ts: m.ts, sender: m.sender, text: m.text || ATTACHMENT_EMOJI[m.media?.kind ?? "photo"] });
  }
  return out;
}

/** Entry with the highest value; the earliest one wins a tie. */
function maxEntry<K>(entries: Iterable<[K, number]>): [K, number] | null {
  let best: [K, number] | null = null;
  for (const e of entries) if (!best || e[1] > best[1]) best = e;
  return best;
}

function toDayCount(entry: [string, number] | null): DayCount | null {
  if (!entry) return null;
  const [year, month, day] = entry[0].split("-").map(Number);
  return { year, month, day, count: entry[1] };
}
