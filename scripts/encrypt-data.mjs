// Encrypts the prepared data (public/private/, git-ignored) into public/data/,
// which is committed and deployed. Without the password it's unreadable.
//
//   US_PASSWORD='…' npm run encrypt     (or put the password in data/password.txt)
//
//   public/data/meta.json          salt, iterations and a password check
//   public/data/days/MM-DD.bin     a day's messages
//   public/data/stats.bin          the stats
//   public/data/media/<id>.bin     a photo
//
// The salt is kept across runs and unchanged files aren't re-encrypted, so a
// re-run only touches what changed. `--new-password` re-keys everything.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { deriveKey, encrypt, fromBase64, ITERATIONS, keyFits, makeCheck, randomBytes, toBase64 } from "../lib/crypto.ts";

const IN = "public/private";
const OUT = "public/data";
const CACHE = "data/encrypt-cache.json"; // plaintext hashes of what's already encrypted (git-ignored)

const password = process.env.US_PASSWORD ?? (fs.existsSync("data/password.txt") ? fs.readFileSync("data/password.txt", "utf8").trim() : "");
if (!password) {
  console.error("No password: set US_PASSWORD or write it to data/password.txt");
  process.exit(1);
}

// --- Key: keep the existing salt unless re-keying ---

const metaPath = path.join(OUT, "meta.json");
const rekey = process.argv.includes("--new-password") || !fs.existsSync(metaPath);
const old = rekey ? null : JSON.parse(fs.readFileSync(metaPath, "utf8"));
const salt = old ? fromBase64(old.salt) : randomBytes(16);
const key = await deriveKey(password, salt, old?.iterations ?? ITERATIONS);

if (old && !(await keyFits(key, old))) {
  console.error("This isn't the password the data was encrypted with. Use --new-password to re-key everything.");
  process.exit(1);
}
const meta = old ?? { salt: toBase64(salt), iterations: ITERATIONS, check: await makeCheck(key) };

// --- Files to encrypt: source -> target ---

const jobs = [
  [path.join(IN, "stats.json"), path.join(OUT, "stats.bin")],
  ...fs.readdirSync(path.join(IN, "days")).map((f) => [path.join(IN, "days", f), path.join(OUT, "days", f.replace(/\.json$/, ".bin"))]),
  ...fs.readdirSync(path.join(IN, "media")).map((f) => [path.join(IN, "media", f), path.join(OUT, "media", f.replace(/\.\w+$/, ".bin"))]),
];

const cache = !rekey && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};
const nextCache = {};
let written = 0;

for (const dir of ["days", "media"]) fs.mkdirSync(path.join(OUT, dir), { recursive: true });

const queue = [...jobs];
async function worker() {
  for (let job = queue.pop(); job; job = queue.pop()) {
    const [src, dest] = job;
    const plain = fs.readFileSync(src);
    const hash = crypto.createHash("sha256").update(plain).digest("hex");
    nextCache[dest] = hash;
    if (cache[dest] === hash && fs.existsSync(dest)) continue;
    fs.writeFileSync(dest, await encrypt(key, new Uint8Array(plain)));
    written++;
  }
}
await Promise.all(Array.from({ length: os.availableParallelism() }, worker));

// --- Drop encrypted files whose source is gone ---

const wanted = new Set(jobs.map(([, dest]) => dest));
let removed = 0;
for (const dir of ["days", "media"]) {
  for (const f of fs.readdirSync(path.join(OUT, dir))) {
    const p = path.join(OUT, dir, f);
    if (!wanted.has(p)) {
      fs.rmSync(p);
      removed++;
    }
  }
}

fs.writeFileSync(metaPath, JSON.stringify(meta));
fs.writeFileSync(CACHE, JSON.stringify(nextCache));
console.log(`encrypted: ${written} written, ${jobs.length - written} unchanged, ${removed} removed`);
