import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { belgradeTime } from "./day.ts";
import { computeStats, countAdores, countHearts, countSmiles, countWords, dayPartOf, isBootyCall } from "./stats.ts";
import type { Message, Person } from "./types.ts";

const msg = (sender: Person, text: string, [y, mo, d, h, mi]: number[]): Message => ({
  ts: belgradeTime(y, mo, d, h, mi),
  sender,
  text,
});

describe("counting", () => {
  it("counts words, not emoji or punctuation", () => {
    assert.equal(countWords("Šta radiš večeras?? 😂"), 3);
    assert.equal(countWords("👍"), 0);
    assert.equal(countWords("u 17h kod parka"), 4);
  });

  it("counts hearts, including the text heart", () => {
    assert.equal(countHearts("volim te ❤️❤️"), 2);
    assert.equal(countHearts("<3 💕 😍"), 3);
    assert.equal(countHearts("🩷🩵🩶 🫶🏻 ❣️ 💟 💌 😻"), 8);
    assert.equal(countHearts("❤️‍🔥"), 1);
    assert.equal(countHearts("💔"), 0);
    assert.equal(countHearts("ok"), 0);
  });

  it("counts smiling faces and text smileys", () => {
    assert.equal(countSmiles("hahaha 😂😂 🤣"), 3);
    assert.equal(countSmiles("super :) :D xD"), 3);
    assert.equal(countSmiles("ok :( 😢"), 0);
  });

  it("counts 'obožavam te' in any spelling, but not negated", () => {
    assert.equal(countAdores("Obozavam teeeee"), 1);
    assert.equal(countAdores("jaoo obožavam te, obozavam tee"), 2);
    for (const no of ["ne obožavam te", "obožavam tebe", "obožavam testeninu"]) assert.equal(countAdores(no), 0, no);
  });

  it("spots booty calls", () => {
    assert.ok(isBootyCall("🚨🚨🚨🚨🚨"));
    assert.ok(isBootyCall("📢"));
    assert.ok(isBootyCall("🔔🔔"));
    assert.ok(isBootyCall("dolazim 🚒🚒🚒"));
    assert.ok(!isBootyCall("⏰ ustaj"));
    assert.ok(!isBootyCall("hitno 🚑"));
  });

  it("splits the day into parts", () => {
    assert.deepEqual([5, 6, 11, 12, 16, 17, 21, 22].map(dayPartOf), ["noc", "jutro", "jutro", "dan", "dan", "vece", "vece", "noc"]);
  });
});

describe("computeStats", () => {
  const history: Message[] = [
    msg("ona", "Dobro jutro 😊", [2020, 5, 1, 8, 0]),
    msg("on", "Jutro! Obožavam te ❤️", [2020, 5, 1, 8, 5]),
    msg("ona", "I ja tebe ❤️❤️ :D", [2020, 5, 1, 8, 6]),
    { ...msg("ona", "", [2020, 5, 1, 8, 7]), media: { kind: "sticker", heart: true } },
    { ...msg("on", "", [2020, 5, 1, 8, 8]), media: { kind: "sticker" } },
    // Past midnight: still 1 May, so it doesn't open a new day.
    msg("on", "Laku noć 😂😂", [2020, 5, 2, 1, 0]),
    msg("ona", "obozavam teee", [2020, 5, 3, 20, 0]),
    msg("on", "🚨🚨🚨", [2020, 5, 3, 21, 0]),
  ];
  const stats = computeStats([...history].reverse()); // input order must not matter

  it("counts per person", () => {
    assert.equal(stats.total, 8);
    assert.deepEqual(stats.messages, { on: 4, ona: 4 });
    assert.deepEqual(stats.hearts, { on: 1, ona: 3 }); // incl. the heart sticker
    assert.equal(stats.totalHearts, 4);
  });

  it("gives each day to whoever wrote first after 06:00", () => {
    // 1 May: she wrote first (later chats that day don't count); 3 May: her again.
    assert.deepEqual(stats.firstOfDay, { on: 0, ona: 2 });
  });

  it("uses logical days for records", () => {
    assert.deepEqual(stats.busiestDay, { year: 2020, month: 5, day: 1, count: 6 });
    assert.deepEqual(stats.happiestDay, { year: 2020, month: 5, day: 1, count: 4 });
  });

  it("counts 'obožavam te' and finds the first one", () => {
    assert.equal(stats.adore.count, 2);
    assert.equal(stats.adore.first?.sender, "on");
    assert.equal(stats.adore.first?.ts, history[1].ts);
  });

  it("finds the busiest part of the day", () => {
    assert.deepEqual(stats.dayParts, { jutro: 5, dan: 0, vece: 2, noc: 1 });
    assert.deepEqual(stats.busiestPart, { part: "jutro", share: 5 / 8 });
  });

  it("counts booty calls once per message", () => {
    assert.deepEqual(stats.bootyCalls, { on: 1, ona: 0 });
  });

  it("keeps the whole first day, past midnight included", () => {
    const first = stats.firstDay;
    assert.equal(first.length, 6); // 1 May 08:00 … 2 May 01:00
    assert.deepEqual([first[0].sender, first[0].text], ["ona", "Dobro jutro 😊"]);
    assert.equal(first[3].text, "🏷️"); // the sticker, as an emoji
    assert.equal(first[5].text, "Laku noć 😂😂");
  });

  it("handles an empty history", () => {
    const empty = computeStats([]);
    assert.equal(empty.total, 0);
    assert.equal(empty.busiestPart, null);
    assert.equal(empty.busiestDay, null);
    assert.deepEqual(empty.adore, { count: 0, first: null });
    assert.deepEqual(empty.bootyCalls, { on: 0, ona: 0 });
    assert.deepEqual(empty.firstDay, []);
  });
});
