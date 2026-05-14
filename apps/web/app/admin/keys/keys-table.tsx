"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revokeUserKey } from "../actions";

export type AdminKeyRow = {
  id: string;
  user_id: string;
  email: string;
  exchange: string;
  mode: "demo" | "live";
  label: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function AdminKeysTable({ rows }: { rows: AdminKeyRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <div className="px-6 py-12 text-center text-[13px] text-ink-tertiary">
          No API keys connected by any user yet.
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr>
              <Th>Owner</Th>
              <Th>Label</Th>
              <Th>Mode</Th>
              <Th>Permissions</Th>
              <Th align="right">Created</Th>
              <Th align="right">Last used</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <KeyRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function KeyRow({ row }: { row: AdminKeyRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const revoked = Boolean(row.revokedAt);

  function handleRevoke() {
    if (!confirm(`Revoke key '${row.label}' for ${row.email}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeUserKey(row.id);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <tr className="hover:bg-bg-elevated/40 transition-colors">
      <Td>
        <span className="text-ink-primary truncate max-w-[240px] block">{row.email}</span>
      </Td>
      <Td>
        <span className="text-ink-secondary">{row.label}</span>
      </Td>
      <Td>
        <Badge tone={row.mode === "demo" ? "paper" : "live"}>
          {row.mode === "demo" ? "Demo" : "Live"}
        </Badge>
      </Td>
      <Td>
        <span className="text-[11px] text-ink-secondary">
          {row.permissions.join(" · ") || "—"}
        </span>
      </Td>
      <Td align="right" mono>
        <span className="text-ink-secondary">
          {row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : "—"}
        </span>
      </Td>
      <Td align="right" mono>
        <span className="text-ink-tertiary">
          {row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString() : "never"}
        </span>
      </Td>
      <Td>
        {revoked ? (
          <Badge tone="closed">Revoked</Badge>
        ) : (
          <Badge tone="live" pulsing>Active</Badge>
        )}
      </Td>
      <Td align="right">
        {revoked ? (
          <span className="text-[11px] text-ink-tertiary">—</span>
        ) : (
          <div className="flex items-center justify-end gap-2">
            {error && <span className="text-[11px] text-danger">{error}</span>}
            <Button variant="danger" size="sm" onClick={handleRevoke} disabled={pending}>
              <Trash2 size={13} strokeWidth={1.5} />
              {pending ? "Revoking…" : "Revoke"}
            </Button>
          </div>
        )}
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
