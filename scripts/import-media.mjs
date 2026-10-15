// Copies the photos from our chat (and nothing else) out of the Facebook /
// Messenger exports into data/media/, named by a hash of their original path.
//
//   node scripts/import-media.mjs <fb-export-root>... --e2ee <messenger-export-root>
//
// fb-export-root: a folder containing your_facebook_activity/ (one per zip part).
// messenger-export-root: the unzipped "Download secure storage data" folder.

import fs from "node:fs";
import path from "node:path";
import { mediaFile } from "./media-id.mjs";

const MESSAGES = "data/messages";
const OUT = "data/media";
const PHOTO_EXT = /\.(jpe?g|png|webp)$/i;

const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

const args = process.argv.slice(2);
const e2eeAt = args.indexOf("--e2ee");
const fbRoots = e2eeAt === -1 ? args : args.slice(0, e2eeAt);
const e2eeRoot = e2eeAt === -1 ? null : args[e2eeAt + 1];

function copy(uri, from) {
  const dest = path.join(OUT, mediaFile(uri));
  if (!fs.existsSync(dest)) fs.copyFileSync(from, dest);
}

fs.mkdirSync(OUT, { recursive: true });
let copied = 0;
const missing = [];

// Facebook export: photos referenced by our messages, in whichever zip part has them.
for (const f of fs.readdirSync(MESSAGES).filter((f) => /^message_\d+\.json$/.test(f))) {
  for (const m of JSON.parse(fs.readFileSync(path.join(MESSAGES, f), "utf8")).messages) {
    for (const p of m.photos ?? []) {
      const from = p.uri && fbRoots.map((r) => path.join(r, p.uri)).find(isFile);
      if (from) {
        copy(p.uri, from);
        copied++;
      } else missing.push(p.uri);
    }
  }
}

// Messenger secure storage export: photos attached to our messages.
if (e2eeRoot) {
  const e2ee = JSON.parse(fs.readFileSync(path.join(MESSAGES, "e2ee.json"), "utf8"));
  for (const m of e2ee.messages) {
    for (const { uri } of m.media) {
      if (!PHOTO_EXT.test(uri)) continue;
      const from = path.join(e2eeRoot, uri);
      if (isFile(from)) {
        copy(uri, from);
        copied++;
      } else missing.push(uri);
    }
  }
}

console.log(`copied ${copied} photos to ${OUT}, missing ${missing.length}`);
if (missing.length) console.log("missing sample:", missing.slice(0, 3));
