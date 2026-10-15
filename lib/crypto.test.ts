import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decrypt, deriveKey, encrypt, exportKey, importKey, keyFits, makeCheck, randomBytes } from "./crypto.ts";

const salt = randomBytes(16);
const text = (s: string) => new TextEncoder().encode(s);

describe("crypto", async () => {
  // Few iterations keep the tests fast; the format is the same.
  const key = await deriveKey("tajna lozinka", salt, 1000);

  it("round-trips data, with a fresh IV every time", async () => {
    const a = await encrypt(key, text("čćšžđ ❤️"));
    const b = await encrypt(key, text("čćšžđ ❤️"));
    assert.notDeepEqual(a, b);
    assert.equal(new TextDecoder().decode(await decrypt(key, a)), "čćšžđ ❤️");
  });

  it("rejects the wrong password and tampered data", async () => {
    const data = await encrypt(key, text("poruke"));
    const wrong = await deriveKey("pogrešna", salt, 1000);
    await assert.rejects(decrypt(wrong, data));
    data[data.length - 1] ^= 1;
    await assert.rejects(decrypt(key, data));
  });

  it("checks a password against the meta before loading anything", async () => {
    const meta = { salt: "", iterations: 1000, check: await makeCheck(key) };
    assert.equal(await keyFits(key, meta), true);
    assert.equal(await keyFits(await deriveKey("pogrešna", salt, 1000), meta), false);
  });

  it("survives being remembered on the device", async () => {
    const again = await importKey(await exportKey(key));
    const data = await encrypt(key, text("zapamćeno"));
    assert.equal(new TextDecoder().decode(await decrypt(again, data)), "zapamćeno");
  });
});
