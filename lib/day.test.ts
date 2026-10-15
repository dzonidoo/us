import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { belgradeTime, dayKey, formatDayKey, logicalDay, parseDayKey, todayKey } from "./day.ts";

describe("logicalDay (day starts at 06:00 Belgrade time)", () => {
  it("keeps late-night messages on the evening before", () => {
    assert.deepEqual(logicalDay(belgradeTime(2021, 10, 16, 2, 30)), { year: 2021, month: 10, day: 15 });
    assert.deepEqual(logicalDay(belgradeTime(2021, 10, 16, 5, 59)), { year: 2021, month: 10, day: 15 });
  });

  it("starts the new day at 06:00", () => {
    assert.deepEqual(logicalDay(belgradeTime(2021, 10, 16, 6, 0)), { year: 2021, month: 10, day: 16 });
  });

  it("steps back across month and year boundaries", () => {
    assert.deepEqual(logicalDay(belgradeTime(2024, 3, 1, 1, 0)), { year: 2024, month: 2, day: 29 });
    assert.deepEqual(logicalDay(belgradeTime(2025, 1, 1, 3, 0)), { year: 2024, month: 12, day: 31 });
  });

  it("is not shifted by the DST change", () => {
    // Clocks go back 03:00 -> 02:00 on 26 Oct 2025.
    assert.equal(todayKey(belgradeTime(2025, 10, 26, 4, 0)), "10-25");
    assert.equal(todayKey(belgradeTime(2025, 10, 26, 7, 0)), "10-26");
  });
});

describe("day keys", () => {
  it("round-trips", () => {
    assert.equal(dayKey({ month: 2, day: 9 }), "02-09");
    assert.deepEqual(parseDayKey("02-09"), { month: 2, day: 9 });
  });

  it("rejects malformed keys", () => {
    for (const bad of ["2-9", "13-01", "00-10", "10-32", "abc"]) assert.equal(parseDayKey(bad), null, bad);
  });

  it("formats in Serbian", () => {
    assert.equal(formatDayKey("10-15"), "15. oktobar");
    assert.equal(formatDayKey("10-15", 2018), "15. oktobar 2018.");
  });
});
