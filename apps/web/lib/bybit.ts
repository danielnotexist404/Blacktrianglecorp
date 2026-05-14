// Bybit V5 API helpers using Web Crypto (works on Node + Edge runtimes).

export type BybitMode = "demo" | "live";

const HOSTS: Record<BybitMode, string> = {
  demo: "https://api-demo.bybit.com",
  live: "https://api.bybit.com",
};

const RECV_WINDOW = "5000";

// More browser-like UA — defeats some WAFs that block obvious bot strings.
const UA =
  "Mozilla/5.0 (compatible; BTG-Trader/0.1; +https://blacktrianglecorp.vercel.app)";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export type VerifyResult =
  | { ok: true; permissions: ("read" | "trade")[] }
  | { ok: false; error: string };

async function probeReachability(host: string): Promise<string | null> {
  try {
    const r = await fetch(`${host}/v5/market/time`, {
      method: "GET",
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    if (r.status === 403) {
      const body = await r.text().catch(() => "");
      return (
        `Cannot reach Bybit from our server — even a public endpoint (${host}/v5/market/time) ` +
        `returns 403. Bybit's CloudFront is blocking our outbound region. ` +
        `Body: ${body.slice(0, 240)}`
      );
    }
    if (!r.ok) {
      return `Bybit basic probe returned HTTP ${r.status}. Service may be degraded.`;
    }
    return null;
  } catch (e) {
    return e instanceof Error ? `Could not reach Bybit: ${e.message}` : "Could not reach Bybit.";
  }
}

export async function verifyBybitKey(
  apiKey: string,
  apiSecret: string,
  mode: BybitMode,
): Promise<VerifyResult> {
  const host = HOSTS[mode];

  const reachErr = await probeReachability(host);
  if (reachErr) return { ok: false, error: reachErr };

  const timestamp = Date.now().toString();
  const sign = await hmacSha256Hex(
    apiSecret,
    timestamp + apiKey + RECV_WINDOW,
  );

  let res: Response;
  try {
    res = await fetch(`${host}/v5/user/query-api`, {
      method: "GET",
      headers: {
        "X-BAPI-API-KEY": apiKey,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": RECV_WINDOW,
        "X-BAPI-SIGN": sign,
        "X-BAPI-SIGN-TYPE": "2",
        "User-Agent": UA,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error
        ? `Could not reach Bybit auth endpoint: ${e.message}`
        : "Could not reach Bybit auth endpoint.",
    };
  }

  if (!res.ok) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 240);
    } catch {
      /* ignore */
    }
    if (res.status === 403) {
      return {
        ok: false,
        error:
          "Bybit returned 403 on the authed call (our server can reach Bybit fine). " +
          "Almost always means the key was created on your real Bybit account, not " +
          "in Demo Trading mode. Toggle Demo Trading on bybit.com, create a fresh key " +
          "there, and try again. " +
          (body ? `Bybit response: ${body}` : ""),
      };
    }
    return {
      ok: false,
      error: `Bybit returned HTTP ${res.status}${body ? `: ${body}` : ""}.`,
    };
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return { ok: false, error: "Bybit returned a response we could not parse." };
  }
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, error: "Bybit returned an unexpected payload." };
  }

  const data = payload as {
    retCode?: number;
    retMsg?: string;
    result?: {
      readOnly?: number;
      permissions?: Record<string, string[]>;
    };
  };

  if (data.retCode !== 0) {
    const msg = data.retMsg ?? "Unknown error";
    if (/sign/i.test(msg) || /api key/i.test(msg)) {
      return {
        ok: false,
        error:
          mode === "demo"
            ? "Bybit rejected the key. Most likely it was created on your real Bybit account, not in Demo Trading mode. Toggle Demo Trading on bybit.com and recreate the key there."
            : "Bybit rejected the key. Make sure this is a mainnet key, not a Demo Trading key.",
      };
    }
    return { ok: false, error: `Bybit: ${msg}` };
  }

  const perms = data.result?.permissions ?? {};
  const withdraw = perms.Withdraw ?? [];
  if (withdraw.length > 0) {
    return {
      ok: false,
      error: "This key has Withdraw permission. Revoke withdraw on Bybit before connecting.",
    };
  }

  const collected: ("read" | "trade")[] = [];
  if ((perms.ContractTrade ?? []).length > 0) collected.push("trade");
  if (data.result?.readOnly === 0 || (perms.ContractTrade ?? []).length > 0) {
    collected.push("read");
  }
  if (collected.length === 0) {
    return {
      ok: false,
      error: "This key has no Contract Trade permission. Enable it on Bybit.",
    };
  }

  return { ok: true, permissions: Array.from(new Set(collected)) };
}
