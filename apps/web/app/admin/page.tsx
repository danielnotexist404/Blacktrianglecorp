import Link from "next/link";
import { Users, KeyRound, Activity, TrendingUp } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: userCount }, { count: keyCount }, { count: signalCount24h }, { count: tradeCount }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("api_keys").select("id", { count: "exact", head: true }).is("revoked_at", null),
      supabase
        .from("signals")
        .select("id", { count: "exact", head: true })
        .gte("ts", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("trades").select("id", { count: "exact", head: true }),
    ]);

  const { data: recentUsers } = await supabase
    .from("admin_users_overview")
    .select("id, email, subscription_tier, is_admin, active_keys, created_at, last_sign_in_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tightish">
            Overview
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Aggregate state across all BTG Trader accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Users" value={userCount ?? 0} icon={<Users size={16} strokeWidth={1.5} />} />
        <Stat label="Active keys" value={keyCount ?? 0} icon={<KeyRound size={16} strokeWidth={1.5} />} />
        <Stat label="Signals 24h" value={signalCount24h ?? 0} icon={<Activity size={16} strokeWidth={1.5} />} />
        <Stat label="Total trades" value={tradeCount ?? 0} icon={<TrendingUp size={16} strokeWidth={1.5} />} />
      </div>

      <Card>
        <div className="px-6 py-4 flex items-center justify-between border-b border-line-divider">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
            Newest users
          </h2>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr>
                <Th>Email</Th>
                <Th>Tier</Th>
                <Th align="right">Active keys</Th>
                <Th align="right">Joined</Th>
                <Th align="right">Last sign-in</Th>
              </tr>
            </thead>
            <tbody>
              {(recentUsers ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-ink-tertiary">
                    No users yet.
                  </td>
                </tr>
              ) : (
                (recentUsers ?? []).map((u) => (
                  <tr key={u.id as string} className="hover:bg-bg-elevated/40 transition-colors">
                    <Td>
                      <span className="text-ink-primary">{u.email as string}</span>
                      {u.is_admin && (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.08em] text-accent font-semibold">
                          Admin
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="text-[10.5px] uppercase tracking-[0.08em] text-ink-secondary font-semibold">
                        {(u.subscription_tier as string) ?? "free"}
                      </span>
                    </Td>
                    <Td align="right" mono>{(u.active_keys as number) ?? 0}</Td>
                    <Td align="right" mono>
                      <span className="text-ink-secondary">
                        {new Date(u.created_at as string).toISOString().slice(0, 10)}
                      </span>
                    </Td>
                    <Td align="right" mono>
                      <span className="text-ink-tertiary">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at as string).toLocaleString()
                          : "never"}
                      </span>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-line-subtle rounded-card px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
          {label}
        </span>
        <span className="text-ink-tertiary">{icon}</span>
      </div>
      <div className="mt-3 font-mono text-[24px] tabular-nums text-ink-primary leading-none">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={
        "px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] " +
        "text-ink-tertiary border-b border-line-divider " +
        (align === "right" ? "text-right" : "text-left")
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  mono = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}) {
  return (
    <td
      className={
        "px-6 py-3.5 border-b border-line-divider " +
        (align === "right" ? "text-right" : "text-left") +
        (mono ? " font-mono" : "")
      }
    >
      {children}
    </td>
  );
}
