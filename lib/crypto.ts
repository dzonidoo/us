// Password-based encryption for our data, shared by the build script (Node)
// and the app (browser); both use Web Crypto, so the formats match exactly.
//
//   key:   PBKDF2-SHA256(password, salt, ITERATIONS) -> AES-256-GCM
//   file:  12-byte random IV, then the AES-GCM ciphertext (+ auth tag)
//   meta:  { salt, iterations, check }, where `check` is CHECK_TEXT encrypted
//          with the key, so a wrong password is caught before any data loads.

export const ITERATIONS = 310_000;
const IV_BYTES = 12;
const CHECK_TEXT = "us";

export type CryptoMeta = { salt: string; iterations: number; check: string };

const subtle = () => globalThis.crypto.subtle;

export const toBase64 = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

export const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const randomBytes = (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n));

/** The AES key for a password. Extractable, so the app can remember it on the device. */
export async function deriveKey(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<CryptoKey> {
  const material = await subtle().importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(key: CryptoKey, plain: Uint8Array): Promise<Uint8Array> {
  const iv = randomBytes(IV_BYTES);
  const cipher = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, plain as BufferSource));
  const out = new Uint8Array(IV_BYTES + cipher.length);
  out.set(iv);
  out.set(cipher, IV_BYTES);
  return out;
}

/** Throws if the key is wrong or the data was tampered with (AES-GCM checks both). */
export async function decrypt(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = data.subarray(0, IV_BYTES);
  const plain = await subtle().decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data.subarray(IV_BYTES) as BufferSource);
  return new Uint8Array(plain);
}

export async function makeCheck(key: CryptoKey): Promise<string> {
  return toBase64(await encrypt(key, new TextEncoder().encode(CHECK_TEXT)));
}

/** Whether a key opens this data set. */
export async function keyFits(key: CryptoKey, meta: CryptoMeta): Promise<boolean> {
  try {
    return new TextDecoder().decode(await decrypt(key, fromBase64(meta.check))) === CHECK_TEXT;
  } catch {
    return false;
  }
}

export async function exportKey(key: CryptoKey): Promise<string> {
  return toBase64(new Uint8Array(await subtle().exportKey("raw", key)));
}

export async function importKey(raw: string): Promise<CryptoKey> {
  return subtle().importKey("raw", fromBase64(raw) as BufferSource, "AES-GCM", true, ["encrypt", "decrypt"]);
}
