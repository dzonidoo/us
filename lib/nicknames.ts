// Nicknames we gave each other, read from the Facebook export's system notices
// (written in Serbian Cyrillic, from the point of view of "on", whose export it is):
//
//   "Подесили сте надимак корисника <ona> на X."   on set ona's nickname
//   "Подесили сте свој надимак на X."              on set his own
//   "<ona> је подесио/ла ваш надимак на X."        ona set on's nickname
//   "<ona> је подесила свој надимак на X."         ona set her own
//
// Removals ("обрисала", "Уклонили") don't add anything to the timeline.

import { belgradeParts } from "./day.ts";
import type { Person } from "./types.ts";

export type NicknameEvent = { ts: number; text: string };
export type Nickname = { year: number; name: string };
export type Nicknames = Record<Person, Nickname[]>;

const RULES: { re: RegExp; person: Person }[] = [
  { re: /^Подесили сте надимак корисника .+? на (.+)\.$/u, person: "ona" },
  { re: /^Подесили сте свој надимак на (.+)\.$/u, person: "on" },
  { re: /^.+? је подеси\S* ваш надимак на (.+)\.$/u, person: "on" },
  { re: /^.+? је подеси\S* свој надимак на (.+)\.$/u, person: "ona" },
];

/** Which nickname a notice sets, if any. */
export function parseNicknameNotice(text: string): { person: Person; name: string } | null {
  for (const { re, person } of RULES) {
    const m = re.exec(text.trim());
    if (m) return { person, name: m[1].trim() };
  }
  return null;
}

/** "Ježić🌎" / "Ježić🌍" and "mala buba" / "Mala Buba :P" are the same nickname. */
const normalize = (name: string) =>
  name
    .toLocaleLowerCase("sr")
    .replace(/[:;=]-?[\p{L}()[\]]/gu, "") // text smileys like ":P"
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Every nickname ever set, once each, in the year it first appeared (oldest
 * first). `ignore` drops names that are just our real names being put back.
 */
export function nicknameTimeline(events: readonly NicknameEvent[], ignore: readonly string[] = []): Nicknames {
  const ignored = new Set(ignore.map(normalize));
  const timeline: Nicknames = { on: [], ona: [] };
  const seen = { on: new Set<string>(), ona: new Set<string>() };

  for (const e of [...events].sort((a, b) => a.ts - b.ts)) {
    const set = parseNicknameNotice(e.text);
    if (!set) continue;
    // An emoji-only nickname (💩) has nothing left after normalizing: compare it as is.
    const key = normalize(set.name) || set.name;
    if (ignored.has(key) || seen[set.person].has(key)) continue;
    seen[set.person].add(key);
    timeline[set.person].push({ year: belgradeParts(e.ts).year, name: set.name });
  }
  return timeline;
}
