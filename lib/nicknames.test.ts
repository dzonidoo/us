import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { belgradeTime } from "./day.ts";
import { nicknameTimeline, parseNicknameNotice } from "./nicknames.ts";

const at = (y: number, mo: number, d: number, h = 12, mi = 0) => belgradeTime(y, mo, d, h, mi);

describe("parseNicknameNotice", () => {
  it("reads who got which nickname", () => {
    assert.deepEqual(parseNicknameNotice("Подесили сте надимак корисника Ana Anić на Zeko."), {
      person: "ona",
      name: "Zeko",
    });
    assert.deepEqual(parseNicknameNotice("Ana је подесио ваш надимак на Medo."), { person: "on", name: "Medo" });
    assert.deepEqual(parseNicknameNotice("Ana је подесила свој надимак на Mačkica."), { person: "ona", name: "Mačkica" });
    assert.deepEqual(parseNicknameNotice("Подесили сте свој надимак на Lav 'kralj džungle'."), { person: "on", name: "Lav 'kralj džungle'" });
  });

  it("ignores removals and other notices", () => {
    assert.equal(parseNicknameNotice("Ana је обрисала ваш надимак."), null);
    assert.equal(parseNicknameNotice("Уклонили сте надимак корисника Ana Anić."), null);
    assert.equal(parseNicknameNotice("Променили сте тему."), null);
  });
});

describe("nicknameTimeline", () => {
  const set = (name: string) => `Подесили сте надимак корисника Ana Anić на ${name}.`;
  const timeline = nicknameTimeline(
    [
      { ts: at(2018, 9, 9, 10), text: set("mala buba") },
      { ts: at(2018, 9, 9, 10, 1), text: set("Mala Buba :P") }, // same nickname, other spelling
      { ts: at(2019, 6, 25, 9), text: set("Ana Anić") }, // real name put back: ignored
      { ts: at(2020, 1, 9), text: set("mala buba") }, // seen before: not repeated
      { ts: at(2019, 6, 22), text: "Ana је подесио ваш надимак на Ježić🌎." },
      { ts: at(2019, 7, 10), text: "Ana је подесио ваш надимак на Ježić🌍." }, // same name, other emoji
      { ts: at(2019, 10, 31), text: "Ana је обрисала ваш надимак." },
      { ts: at(2019, 11, 1), text: "Ana је подесио ваш надимак на 💩." }, // emoji-only still counts
      { ts: at(2019, 11, 1, 12, 5), text: "Ana је подесио ваш надимак на Pile😊." }, // same day, also kept
    ],
    ["Ana Anić", "Marko Marić"],
  );

  it("lists each nickname once, in the year it first appeared", () => {
    assert.deepEqual(timeline, {
      ona: [{ year: 2018, name: "mala buba" }],
      on: [
        { year: 2019, name: "Ježić🌎" },
        { year: 2019, name: "💩" },
        { year: 2019, name: "Pile😊" },
      ],
    });
  });

  it("handles no notices", () => {
    assert.deepEqual(nicknameTimeline([]), { on: [], ona: [] });
  });
});
