"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { setUserTier } from "../actions";

export type AdminUserRow = {
  id: string;
  email: string;
  subscription_tier: "free" | "starter" | "pro" | "max" | "ultra";
  is_admin: boolean;
  active_keys: number;
  created_at: string;
  last_sign_in_at: string | null;
};

const TIERS = ["free", "starter", "pro", "max", "ultra"] as const;

export function UsersTable({ rows }: { rows: AdminUserRow[] }) {
  return (
    <Card>
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-ink-tertiary">
                  No users yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => <UserRow key={r.id} row={r} />)
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function UserRow({ row }: { row: AdminUserRow }) {
  const [tier, setTier] = useState(row.subscription_tier);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTier(nextTier: AdminUserRow["subscription_tier"]) {
    setError(null);
    const prev = tier;
    setTier(nextTier);
    startTransition(async () => {
      const result = await setUserTier(row.id, nextTier);
      if (!result.ok) {
        setError(result.message);
        setTier(prev);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    });
  }

  return (
    <tr className="hover:bg-bg-elevated/40 transition-colors">
      <Td>
        <div className="flex items-center gap-2">
          <span className="text-ink-primary truncate max-w-[280px]">{row.email}</span>
          {row.is_admin && (
            <span className="text-[9.5px] uppercase tracking-[0.1em] text-accent font-semibold border border-accent/30 bg-accent/[0.08] rounded px-1.5 py-0.5">
              Admin
            </span>
          )}
        </div>
      </Td>
      <Td>
        <div className="flex items-center gap-2">
          <select
            value={tier}
            onChange={(e) => handleTier(e.target.value as AdminUserRow["subscription_tier"])}
            disabled={pending}
            className="h-8 px-2 rounded-md bg-bg-input border border-line text-[12px] text-ink-primary focus:border-accent focus:outline-none disabled:opacity-50"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {saved && (
            <span className="text-success flex items-center gap-1 text-[11px] fade-in">
              <Check size={12} strokeWidth={2} />
              Saved
            </span>
          )}
          {error && (
            <span className="text-danger text-[11px]">{error}</span>
          )}
        </div>
      </Td>
      <Td align="right" mono>
        <span className={cn(row.active_keys > 0 ? "text-ink-primary" : "text-ink-muted")}>
          {row.active_keys}
        </span>
      </Td>
      <Td align="right" mono>
        <span className="text-ink-secondary">
          {row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "—"}
        </span>
      </Td>
      <Td align="right" mono>
        <span className="text-ink-tertiary">
          {row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString() : "never"}
        </span>
      </Td>
    </tr>
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
