// Turns the raw exports in data/ into what the app loads, in public/private/
// (git-ignored until the data is encrypted):
//
//   public/private/days/MM-DD.json   our messages on that day, by year
//   public/private/stats.json        whole-history stats
//   public/private/media/<id>.jpg    our photos, sized for phones
//
//   npm run data
//
// Inputs: data/senders.json ({ "<name in export>": "on" | "ona" }),
// data/messages/message_*.json (Facebook export, up to Dec 2023),
// data/messages/e2ee.json (Messenger secure storage, Dec 2023 on), and
// data/media/ (filled by `npm run data:media`).

import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { dayKey, logicalDay } from "../lib/day.ts";
import { computeStats } from "../lib/stats.ts";
import { isHeartSticker } from "./heart-stickers.mjs";
import { mediaFile } from "./media-id.mjs";

const MESSAGES = "data/messages";
const MEDIA_IN = "data/media";
const OUT = "public/private";

/** Last day (logical, 06:00 reset) that counts; later messages are dropped. */
const LAST_DAY = "2026-10-07";

const PHOTO_MAX_PX = 1080;

/** The Facebook export stores UTF-8 text as Latin-1 escapes ("Ä\u008d" for "č"). */
const fixMojibake = (s) => Buffer.from(s, "latin1").toString("utf8");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// Export display name -> "on" | "ona". Kept in data/ so our names stay out of git.
const SENDERS = readJson("data/senders.json");

// --- Normalize both exports into { ts, sender, text, media? } ---
// media: { kind, file?, heart? }; `heart` marks a sticker that shows a heart.

/** A photo we have a file for keeps its file name; otherwise it's a placeholder. */
function photo(uri) {
  const file = uri && mediaFile(uri);
  return { kind: "photo", file: file && fs.existsSync(path.join(MEDIA_IN, file)) ? file : null };
}

function attachment(uri) {
  // Stickers come through as .webp images; heart ones count as hearts.
  if (isHeartSticker(uri)) return { ...photo(uri), heart: true };
  if (/\.(jpe?g|png|webp)$/i.test(uri)) return photo(uri);
  if (/\.mp4$/i.test(uri)) return { kind: "video" };
  if (/\.gif$/i.test(uri)) return { kind: "gif" };
  if (/\.(ogg|aac|m4a)$/i.test(uri)) return { kind: "audio" };
  return { kind: "photo", file: null }; // "Failed to download media"
}

/** One message per attachment, the text going with the first. */
function* expand(ts, senderName, text, attachments) {
  const sender = SENDERS[senderName];
  if (!sender || (!text && !attachments.length)) return;
  if (!attachments.length) yield { ts, sender, text };
  for (const [i, media] of attachments.entries()) yield { ts: ts + i, sender, text: i ? "" : text, media };
}

function* facebookExport() {
  for (const f of fs.readdirSync(MESSAGES).filter((f) => /^message_\d+\.json$/.test(f))) {
    for (const m of readJson(path.join(MESSAGES, f)).messages) {
      if (m.is_unsent || m.call_duration !== undefined) continue;
      let text = m.content ? fixMojibake(m.content) : "";
      // System notices (calls, themes, nicknames, "sent an attachment") are
      // written in Cyrillic by Facebook; we write in Latin.
      if (/[Ѐ-ӿ]/.test(text)) continue;
      if (m.share && !text) text = m.share.link ?? "";
      const attachments = [
        ...(m.photos ?? []).map((p) => photo(p.uri)),
        ...(m.videos ?? []).map(() => ({ kind: "video" })),
        ...(m.gifs ?? []).map(() => ({ kind: "gif" })),
        ...(m.audio_files ?? []).map(() => ({ kind: "audio" })),
        ...(m.sticker ? [{ kind: "sticker", heart: isHeartSticker(m.sticker.uri) }] : []),
      ];
      yield* expand(m.timestamp_ms, fixMojibake(m.sender_name), text, attachments);
    }
  }
}

function* secureStorageExport() {
  for (const m of readJson(path.join(MESSAGES, "e2ee.json")).messages) {
    if (m.isUnsent || m.type === "placeholder") continue;
    yield* expand(m.timestamp, m.senderName, m.text ?? "", m.media.map(({ uri }) => attachment(uri)));
  }
}

const messages = [...facebookExport(), ...secureStorageExport()]
  .filter((m) => {
    const d = logicalDay(m.ts);
    return `${d.year}-${dayKey(d)}` <= LAST_DAY;
  })
  .sort((a, b) => a.ts - b.ts);

// --- Day files: compact [ts, sender, text, [kind, id?]?] ---

function toRaw({ ts, sender, text, media }) {
  const raw = [ts, sender === "on" ? 0 : 1, text];
  if (media) raw.push(media.kind === "photo" ? ["photo", media.file?.replace(/\.\w+$/, "") ?? null] : [media.kind]);
  return raw;
}

const days = new Map(); // "MM-DD" -> { [year]: raw[] }
for (const m of messages) {
  const d = logicalDay(m.ts);
  const byYear = days.get(dayKey(d)) ?? {};
  (byYear[d.year] ??= []).push(toRaw(m));
  days.set(dayKey(d), byYear);
}

fs.rmSync(path.join(OUT, "days"), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "days"), { recursive: true });
for (const [key, byYear] of days) fs.writeFileSync(path.join(OUT, "days", `${key}.json`), JSON.stringify(byYear));
console.log(`messages: ${messages.length} in ${days.size} day files`);

// --- Stats (same code the app uses) ---

fs.writeFileSync(path.join(OUT, "stats.json"), JSON.stringify(computeStats(messages)));
console.log("stats: written");

// --- Photos: resize new ones, keeping the original when it's already smaller ---

const photos = [...new Set(messages.map((m) => m.media?.file).filter(Boolean))];
const outFile = (f) => path.join(OUT, "media", f.replace(/\.\w+$/, ".jpg"));
const run = promisify(execFile);
fs.mkdirSync(path.join(OUT, "media"), { recursive: true });

const todo = photos.filter((f) => !fs.existsSync(outFile(f)));
const processed = todo.length;
async function resizeNext() {
  for (let f = todo.pop(); f; f = todo.pop()) {
    const src = path.join(MEDIA_IN, f);
    const dest = outFile(f);
    await run("sips", ["-Z", String(PHOTO_MAX_PX), "-s", "format", "jpeg", "-s", "formatOptions", "72", src, "--out", dest]);
    // Messenger already compresses photos; re-encoding can make a JPEG bigger.
    if (/\.jpe?g$/i.test(f) && fs.statSync(src).size < fs.statSync(dest).size) fs.copyFileSync(src, dest);
  }
}
await Promise.all(Array.from({ length: os.availableParallelism() }, resizeNext));
console.log(`photos: ${photos.length} referenced, ${processed} processed now`);
