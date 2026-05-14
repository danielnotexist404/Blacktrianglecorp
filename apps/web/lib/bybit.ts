import { createHmac } from "node:crypto";

export type BybitMode = "demo" | "live";

const HOSTS: Record<BybitMode, string> = {
  demo: "https://api-demo.bybit.com",
  live: "https://api.bybit.com",
};

const RECV_WINDOW = "5000";

function signGet(secret: string, params: { timestamp: string; apiKey: string; query: string }) {
  const message = params.timestamp + params.apiKey + RECV_WINDOW + params.query;
  return createHmac("sha256", secret).update(message).digest("hex");
}

export type VerifyResult =
  | { ok: true; permissions: ("read" | "trade")[] }
  | { ok: false; error: string };

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
      },
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error
        ? `Could not reach Bybit: ${e.message}`
        : "Could not reach Bybit.",
    };
  }

  if (!res.ok) {
    return { ok: false, error: `Bybit returned HTTP ${res.status}.` };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "Bybit returned a response we could not parse." };
  }
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Bybit returned an unexpected payload." };
  }

  const data = body as {
    retCode?: number;
    retMsg?: string;
    result?: {
      readOnly?: number;
      permissions?: Record<string, string[]>;
    };
  };

  if (data.retCode !== 0) {
    const msg = data.retMsg ?? "Unknown error";
    // 10003/10004 = invalid signature; 33004 = expired; etc. Surface the raw msg.
    if (/sign/i.test(msg) || /api key/i.test(msg)) {
      return {
        ok: false,
        error:
          mode === "demo"
            ? "Bybit rejected the key. Did you create it in Demo Trading mode? (Demo and live keys are not interchangeable.)"
            : "Bybit rejected the key. Check that this is a mainnet key, not a Demo Trading key.",
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
  // ReadOnly = 0 means the key can do non-read things (which subsumes read).
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
