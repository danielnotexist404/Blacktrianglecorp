import { createHmac } from "node:crypto";

export type BybitMode = "demo" | "live";

const HOSTS: Record<BybitMode, string> = {
  demo: "https://api-demo.bybit.com",
  live: "https://api.bybit.com",
};

const RECV_WINDOW = "5000";

// A more browser-ish UA helps with some WAFs that block obvious bot strings.
const UA =
  "Mozilla/5.0 (compatible; BTG-Trader/0.1; +https://blacktrianglecorp.vercel.app)";

function signGet(secret: string, params: { timestamp: string; apiKey: string; query: string }) {
  const message = params.timestamp + params.apiKey + RECV_WINDOW + params.query;
  return createHmac("sha256", secret).update(message).digest("hex");
}

export type VerifyResult =
  | { ok: true; permissions: ("read" | "trade")[] }
  | { ok: false; error: string };

/**
 * Probe a public Bybit endpoint to confirm the server can reach Bybit at all.
 * Returns null on success, an error message on failure.
 */
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
        `returns 403. This is a Bybit-side block on our server's IP range, not your key. ` +
        `Likely fixes: (a) move this route to a different Vercel region, (b) route through ` +
        `a dedicated proxy. Body: ${body.slice(0, 160)}`
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

/**
 * Verify a Bybit API key by hitting /v5/user/query-api and inspecting the
 * permission set. Rejects any key with Withdraw enabled.
 *
 * Endpoint host depends on mode:
 *   demo -> api-demo.bybit.com (Bybit Demo Trading)
 *   live -> api.bybit.com      (Bybit mainnet)
 */
export async function verifyBybitKey(
  apiKey: string,
  apiSecret: string,
  mode: BybitMode,
): Promise<VerifyResult> {
  const host = HOSTS[mode];

  // 1. Connectivity probe — distinguishes "Bybit blocks our IP" from
  //    "your key is bad / endpoint rejected auth".
  const reachErr = await probeReachability(host);
  if (reachErr) {
    return { ok: false, error: reachErr };
  }

  // 2. Authed call.
  const timestamp = Date.now().toString();
  const sign = signGet(apiSecret, { timestamp, apiKey, query: "" });

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
      // Probe passed (we wouldn't be here otherwise) but the authed call failed.
      // That means Bybit rejected this specific request based on key/signature,
      // not based on our IP.
      return {
        ok: false,
        error:
          "Bybit returned 403 on the authed call (but our server can reach Bybit fine). " +
          "This usually means: (a) wrong environment — the key was created in your real " +
          "Bybit account, not Demo Trading; try recreating it after toggling Demo Trading " +
          "mode on bybit.com; (b) the key was deleted / expired on Bybit. " +
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
            ? "Bybit rejected the key. The key may have been created on your real Bybit account rather than in Demo Trading mode. Toggle Demo Trading on bybit.com and create a fresh key there."
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
      error:
        "This key has Withdraw permission. Revoke withdraw on Bybit before connecting.",
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
