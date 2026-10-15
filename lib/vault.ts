// The encrypted data in public/data/ (see scripts/encrypt-data.mjs), from the
// browser's side: unlocking it with the password, remembering the key on this
// device, and fetching + decrypting files.

import { asset } from "./base-path";
import { type CryptoMeta, decrypt, deriveKey, exportKey, fromBase64, importKey, keyFits } from "./crypto";

const DATA = "/data";
const REMEMBERED_KEY = "us:key";

let key: CryptoKey | null = null;
let metaPromise: Promise<CryptoMeta | null> | null = null;

/** The data set's meta, or null when there's no encrypted data (then the app runs on mock data). */
export function loadMeta(): Promise<CryptoMeta | null> {
  metaPromise ??= fetch(asset(`${DATA}/meta.json`))
    .then((res) => (res.ok ? (res.json() as Promise<CryptoMeta>) : null))
    .catch(() => null);
  return metaPromise;
}

export const isUnlocked = () => key !== null;

/** Unlock with the key remembered on this device, if there is one and it still fits. */
export async function restore(meta: CryptoMeta): Promise<boolean> {
  try {
    const raw = localStorage.getItem(REMEMBERED_KEY);
    if (!raw) return false;
    const remembered = await importKey(raw);
    if (!(await keyFits(remembered, meta))) return false;
    key = remembered;
    return true;
  } catch {
    return false;
  }
}

/** Unlock with the password; remembers the key on this device. False if it's the wrong password. */
export async function unlock(meta: CryptoMeta, password: string): Promise<boolean> {
  const candidate = await deriveKey(password, fromBase64(meta.salt), meta.iterations);
  if (!(await keyFits(candidate, meta))) return false;
  key = candidate;
  try {
    localStorage.setItem(REMEMBERED_KEY, await exportKey(candidate));
  } catch {
    // Storage unavailable (private mode): it'll just ask again next time.
  }
  return true;
}

/** A decrypted file from public/data/. */
export async function fetchDecrypted(path: string): Promise<Uint8Array> {
  if (!key) throw new Error("locked");
  const res = await fetch(asset(`${DATA}/${path}`));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return decrypt(key, new Uint8Array(await res.arrayBuffer()));
}

export async function fetchDecryptedJson<T>(path: string): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await fetchDecrypted(path))) as T;
}

const photoUrls = new Map<string, Promise<string>>();

/** An object URL for a decrypted photo, made once per photo. */
export function photoUrl(id: string): Promise<string> {
  let url = photoUrls.get(id);
  if (!url) {
    url = fetchDecrypted(`media/${id}.bin`).then((bytes) => URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/jpeg" })));
    photoUrls.set(id, url);
  }
  return url;
}
