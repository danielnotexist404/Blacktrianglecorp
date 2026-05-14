import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function getKey(): Buffer {
  const raw = process.env.BTG_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "BTG_ENCRYPTION_KEY is not set. Generate a 32-byte key (base64) and " +
        "add it as an environment variable in Vercel + .env.local.",
    );
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "BTG_ENCRYPTION_KEY must decode to exactly 32 bytes from base64.",
    );
  }
  return buf;
}

/**
 * Encrypt a UTF-8 string with AES-256-GCM. Output format:
 *   <iv b64>.<ciphertext b64>.<auth tag b64>
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), ct.toString("base64"), tag.toString("base64")].join(".");
}

/**
 * Decrypt the output of encryptSecret. Throws on tamper / wrong key.
 */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Encrypted payload is malformed.");
  }
  const [ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  if (iv.length !== IV_LEN) throw new Error("Bad IV length.");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}
