// AES-256-GCM helpers using the Web Crypto API (works on both Node + Edge
// runtimes). Output format: `<iv b64>.<ct+tag b64>` — Web Crypto AES-GCM
// emits ciphertext with auth tag appended, so we store the two parts.

const IV_LEN = 12;

async function getCryptoKey(): Promise<CryptoKey> {
  const raw = process.env.BTG_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "BTG_ENCRYPTION_KEY is not set. Generate a 32-byte key (base64) and " +
        "add it as an environment variable in Vercel + .env.local.",
    );
  }
  const buf = b64ToBytes(raw);
  if (buf.length !== 32) {
    throw new Error(
      "BTG_ENCRYPTION_KEY must decode to exactly 32 bytes from base64.",
    );
  }
  return crypto.subtle.importKey(
    "raw",
    buf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

/** Returns Uint8Array<ArrayBuffer> so it satisfies BufferSource. */
function b64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  // Construct via the (length) overload, which yields Uint8Array<ArrayBuffer>.
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = new Uint8Array(IV_LEN);
  crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${bytesToB64(iv)}.${bytesToB64(ct)}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const key = await getCryptoKey();
  const parts = payload.split(".");
  if (parts.length !== 2) {
    throw new Error("Encrypted payload is malformed.");
  }
  const iv = b64ToBytes(parts[0]);
  const ct = b64ToBytes(parts[1]);
  if (iv.length !== IV_LEN) throw new Error("Bad IV length.");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
