import { createClient } from "@/lib/supabase/server";
import { KeysClient, type StoredKey } from "./keys-client";

export const dynamic = "force-dynamic";
// Frankfurt is closer to where Bybit is willing to accept server traffic
// than Vercel's default US region. Server actions invoked from this page
// inherit this region.
export const preferredRegion = ["fra1"];

export default async function KeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Middleware should have caught this — return an empty list as fallback.
    return <KeysClient keys={[]} />;
  }

  const { data } = await supabase
    .from("api_keys")
    .select("id, exchange, mode, label, permissions, created_at, last_used_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  const keys: StoredKey[] = (data ?? []).map((r) => ({
    id: r.id as string,
    exchange: (r.exchange as "bybit") ?? "bybit",
    mode: r.mode as "demo" | "live",
    label: r.label as string,
    permissions: (r.permissions as string[]) ?? [],
    createdAt: (r.created_at as string).slice(0, 10),
    lastUsed: r.last_used_at
      ? new Date(r.last_used_at as string).toLocaleString()
      : "never",
  }));

  return <KeysClient keys={keys} />;
}
