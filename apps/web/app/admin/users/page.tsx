import { createClient } from "@/lib/supabase/server";
import { UsersTable, type AdminUserRow } from "./users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admin_users_overview")
    .select("id, email, subscription_tier, is_admin, active_keys, created_at, last_sign_in_at")
    .order("created_at", { ascending: false });

  const rows: AdminUserRow[] = (data ?? []).map((r) => ({
    id: r.id as string,
    email: (r.email as string) ?? "—",
    subscription_tier: ((r.subscription_tier as string) ?? "free") as AdminUserRow["subscription_tier"],
    is_admin: Boolean(r.is_admin),
    active_keys: (r.active_keys as number) ?? 0,
    created_at: (r.created_at as string) ?? "",
    last_sign_in_at: (r.last_sign_in_at as string | null) ?? null,
  }));

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] leading-tight tracking-tightish">
          Users
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          {rows.length} {rows.length === 1 ? "account" : "accounts"}.
          Change subscription tier inline. Admin status is controlled by the{" "}
          <code className="font-mono text-ink-secondary">admin_emails</code>{" "}
          table — edit it directly in Supabase to promote / demote.
          {error && (
            <span className="text-danger ml-2">
              · DB error: {error.message}
            </span>
          )}
        </p>
      </div>

      <UsersTable rows={rows} />
    </div>
  );
}
