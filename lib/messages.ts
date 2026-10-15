import { belgradeParts, dayKey, logicalDay } from "./day";
import { MOCK_MESSAGES } from "./mock-messages";
import type { Message, Person } from "./types";

/** Single entry point for message data. Will decrypt the real export later. */
export async function getAllMessages(): Promise<Message[]> {
  return MOCK_MESSAGES;
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

const HEART_RE = /❤️?|♥️?|💕|💖|💗|💓|💞|💘|💝|🧡|💛|💚|💙|💜|🤍|🖤|🤎|😍|🥰|😘/gu;

export function countHearts(text: string): number {
  return text.match(HEART_RE)?.length ?? 0;
}

// A message after this much silence starts a new conversation.
const CONVERSATION_GAP_MS = 4 * 60 * 60 * 1000;

export type DayPart = "jutro" | "dan" | "vece" | "noc";

export const DAY_PARTS: Record<DayPart, { label: string; hours: string }> = {
  jutro: { label: "Jutro", hours: "06–12h" },
  dan: { label: "Dan", hours: "12–17h" },
  vece: { label: "Veče", hours: "17–22h" },
  noc: { label: "Noć", hours: "22–06h" },
};

function dayPart(hour: number): DayPart {
  if (hour < 6) return "noc";
  if (hour < 12) return "jutro";
  if (hour < 17) return "dan";
  if (hour < 22) return "vece";
  return "noc";
}

export type Stats = {
  total: number;
  totalHearts: number;
  messages: Record<Person, number>;
  hearts: Record<Person, number>;
  conversationsStarted: Record<Person, number>;
  dayParts: Record<DayPart, number>;
  busiestPart: { part: DayPart; share: number } | null;
  busiestDay: { year: number; month: number; day: number; count: number } | null;
};

/** Whole-history stats; they don't depend on the day being viewed. */
export function computeStats(all: Message[]): Stats {
  const messages = { on: 0, ona: 0 };
  const hearts = { on: 0, ona: 0 };
  const conversationsStarted = { on: 0, ona: 0 };
  const parts: Record<DayPart, number> = { jutro: 0, dan: 0, vece: 0, noc: 0 };
  const perDay = new Map<string, number>();

  const sorted = [...all].sort((a, b) => a.ts - b.ts);
  let prevTs = -Infinity;
  for (const m of sorted) {
    messages[m.sender]++;
    hearts[m.sender] += countHearts(m.text);
    parts[dayPart(belgradeParts(m.ts).hour)]++;
    if (m.ts - prevTs >= CONVERSATION_GAP_MS) conversationsStarted[m.sender]++;
    const d = logicalDay(m.ts);
    const key = `${d.year}-${dayKey(d)}`;
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    prevTs = m.ts;
  }

  const [part, count] = (Object.entries(parts) as [DayPart, number][]).reduce((best, e) =>
    e[1] > best[1] ? e : best,
  );
  return {
    total: all.length,
    totalHearts: hearts.on + hearts.ona,
    messages,
    hearts,
    conversationsStarted,
    dayParts: parts,
    busiestPart: count > 0 ? { part, share: count / all.length } : null,
    busiestDay: busiestDay(perDay),
  };
}

function busiestDay(perDay: Map<string, number>): Stats["busiestDay"] {
  let best: [string, number] | null = null;
  for (const e of perDay) if (!best || e[1] > best[1]) best = e;
  if (!best) return null;
  const [year, month, day] = best[0].split("-").map(Number);
  return { year, month, day, count: best[1] };
}
