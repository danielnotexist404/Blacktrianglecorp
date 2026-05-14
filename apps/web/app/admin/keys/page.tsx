import { createClient } from "@/lib/supabase/server";
import { AdminKeysTable, type AdminKeyRow } from "./keys-table";

export const dynamic = "force-dynamic";

export default async function AdminKeysPage() {
  const supabase = await createClient();

  // Join api_keys → auth.users by user_id to surface the owner email.
  // We can't directly select from auth.users, but the admin_users_overview
  // view already joins it. Two-step lookup:
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, user_id, exchange, mode, label, permissions, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });

  let rows: AdminKeyRow[] = [];
  if (keys && keys.length > 0) {
    const userIds = [...new Set(keys.map((k) => k.user_id as string))];
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    const emailById = new Map<string, string>(
      (users ?? []).map((u) => [u.id as string, (u.email as string) ?? "—"]),
    );

    rows = keys.map((k) => ({
      id: k.id as string,
      user_id: k.user_id as string,
      email: emailById.get(k.user_id as string) ?? "—",
      exchange: (k.exchange as string) ?? "bybit",
      mode: (k.mode as "demo" | "live") ?? "demo",
      label: (k.label as string) ?? "",
      permissions: (k.permissions as string[]) ?? [],
      createdAt: (k.created_at as string) ?? "",
      lastUsedAt: (k.last_used_at as string | null) ?? null,
      revokedAt: (k.revoked_at as string | null) ?? null,
    }));
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] leading-tight tracking-tightish">
          API keys
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Every Bybit API key connected by every user, including revoked ones.
          Secrets are encrypted and never displayed — admins cannot read
          customer secrets, only revoke them.
        </p>
      </div>
      <AdminKeysTable rows={rows} />
    </div>
  );
}
