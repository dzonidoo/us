import crypto from "node:crypto";
import path from "node:path";

/**
 * File name for an exported attachment in data/media/: a hash of its path in
 * the export (so names don't leak, and re-imports land on the same file).
 */
export function mediaFile(uri) {
  const id = crypto.createHash("sha1").update(uri).digest("hex").slice(0, 16);
  return id + path.extname(uri).toLowerCase();
}
