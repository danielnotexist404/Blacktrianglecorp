"use client";

import { useState, useTransition } from "react";
import { Check, AlertTriangle, KeyRound, Plus, X, Trash2, ExternalLink } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMode, type Mode } from "@/lib/mode";
import { connectKey, revokeKey } from "./actions";

export type StoredKey = {
  id: string;
  exchange: "bybit";
  mode: Mode;
  label: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
};

export function KeysClient({ keys }: { keys: StoredKey[] }) {
  const [globalMode] = useMode();
  const [showForm, setShowForm] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [_, startTransition] = useTransition();

  function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? You can re-add it later.")) return;
    setRevokingId(id);
    startTransition(async () => {
      await revokeKey(id);
      setRevokingId(null);
    });
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tightish">
            API keys
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Connect your Bybit account. Secrets are AES-256-GCM-encrypted with
            a server-held key before being stored.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} strokeWidth={2} />
          Connect new key
        </Button>
      </div>

      {/* Security explainer */}
      <Card>
        <div className="p-6">
          <h2 className="text-[14.5px] font-semibold text-ink-primary">
            What we accept · what we reject
          </h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <Pillar
              tone="ok"
              icon={<Check size={16} strokeWidth={2} />}
              title="Read + Trade only"
              body="Bot needs to read balances and submit orders. Nothing more."
            />
            <Pillar
              tone="err"
              icon={<X size={16} strokeWidth={2} />}
              title="Withdraw permission · rejected"
              body="Keys carrying Withdraw are rejected at verify time and never stored. Server-side enforcement, not a client check."
            />
            <Pillar
              tone="ok"
              icon={<Check size={16} strokeWidth={2} />}
              title="HMAC system keys"
              body="System-generated keys (HMAC) — the standard pairing for SaaS execution. RSA keys not supported."
            />
            <Pillar
              tone="ok"
              icon={<Check size={16} strokeWidth={2} />}
              title="At-rest encryption"
              body="Secrets encrypted with AES-256-GCM under a server-only key, stored ciphertext-only in Supabase."
            />
          </div>
        </div>
      </Card>

      {/* Connected keys */}
      <Card>
        <CardHeader
          title="Connected"
          right={
            <span className="text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
              {keys.length} {keys.length === 1 ? "key" : "keys"}
            </span>
          }
        />
        {keys.length === 0 ? (
          <div className="px-6 py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border border-line-subtle bg-bg-base flex items-center justify-center text-ink-tertiary">
              <KeyRound size={20} strokeWidth={1.5} />
            </div>
            <h3 className="mt-4 text-[15px] font-medium text-ink-primary">
              No keys connected
            </h3>
            <p className="mt-2 text-[13px] text-ink-secondary max-w-md">
              {globalMode === "demo"
                ? "Generate a Demo Trading key on Bybit (in Demo Trading mode, top-right toggle) with Contract Trade enabled. Demo uses virtual funds."
                : "Generate a Bybit mainnet API key with Read + Contract Trade permissions (never Withdraw)."}
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} strokeWidth={2} />
                Connect key
              </Button>
              <a
                href="https://www.bybit.com/app/user/api-management"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm">
                  Open Bybit
                  <ExternalLink size={13} strokeWidth={1.5} />
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-line-divider">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between px-6 py-5 hover:bg-bg-elevated/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-bg-elevated border border-line-subtle flex items-center justify-center text-ink-secondary">
                    <KeyRound size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[14px] font-medium text-ink-primary">
                        {k.label}
                      </span>
                      <span className="text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
                        {k.exchange}
                      </span>
                      <Badge tone={k.mode === "demo" ? "paper" : "live"} pulsing>
                        {k.mode === "demo" ? "Demo" : "Live"}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[12px] text-ink-tertiary flex-wrap">
                      <span>Created {k.createdAt}</span>
                      <span className="w-1 h-1 rounded-full bg-line-strong" />
                      <span>Last used {k.lastUsed}</span>
                      <span className="w-1 h-1 rounded-full bg-line-strong" />
                      <span className="flex items-center gap-1.5">
                        {k.permissions.map((p) => (
                          <span key={p} className="text-ink-secondary capitalize">
                            {p}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRevoke(k.id)}
                    disabled={revokingId === k.id}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                    {revokingId === k.id ? "Revoking…" : "Revoke"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && (
        <ConnectKeyModal
          defaultMode={globalMode}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function Pillar({
  tone,
  icon,
  title,
  body,
}: {
  tone: "ok" | "err";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-line-subtle bg-bg-base p-4 flex items-start gap-3">
      <div
        className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center shrink-0 border",
          tone === "ok" && "bg-success/[0.08] border-success/30 text-success",
          tone === "err" && "bg-danger/[0.08] border-danger/30 text-danger",
        )}
      >
        {icon}
      </div>
      <div>
        <div className="text-[13.5px] font-medium text-ink-primary">{title}</div>
        <div className="mt-1 text-[12.5px] text-ink-secondary leading-snug">{body}</div>
      </div>
    </div>
  );
}

function ConnectKeyModal({
  defaultMode,
  onClose,
}: {
  defaultMode: Mode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("mode", mode);
    startTransition(async () => {
      const result = await connectKey(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm fade-in"
      onClick={onClose}
    >
      <form
        action={handleSubmit}
        className="w-full max-w-[560px] bg-bg-overlay border border-line-subtle rounded-card shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-divider">
          <h2 className="font-display text-[20px]">Connect Bybit</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-bg-elevated text-ink-secondary flex items-center justify-center"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-2">
              Environment
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ModeOption
                label="Demo"
                hint="Bybit Demo Trading"
                active={mode === "demo"}
                accent={false}
                onClick={() => setMode("demo")}
              />
              <ModeOption
                label="Live"
                hint="Bybit mainnet"
                active={mode === "live"}
                accent
                onClick={() => setMode("live")}
              />
            </div>
          </div>

          <div className="rounded-md border border-warning/30 bg-warning/[0.06] p-3.5 flex items-start gap-3 text-[12.5px] text-ink-secondary">
            <AlertTriangle
              size={14}
              className="text-warning shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <p>
              Create the key on Bybit with{" "}
              <strong className="text-ink-primary">Read</strong> and{" "}
              <strong className="text-ink-primary">Contract Trade</strong> only.
              We verify with Bybit before storing and reject keys carrying
              Withdraw.
            </p>
          </div>

          <Field label="Label (optional)">
            <input
              name="label"
              type="text"
              placeholder={mode === "demo" ? "Demo account" : "Main account"}
              className="w-full h-10 px-3 rounded-md bg-bg-input border border-line text-[13.5px] text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
            />
          </Field>

          <Field label="API key">
            <input
              name="api_key"
              type="text"
              required
              autoComplete="off"
              placeholder="BYBIT-XXXXXXXX"
              className="w-full h-10 px-3 rounded-md bg-bg-input border border-line text-[13.5px] font-mono text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
            />
          </Field>

          <Field label="API secret">
            <input
              name="api_secret"
              type="password"
              required
              autoComplete="off"
              placeholder="••••••••••••••••"
              className="w-full h-10 px-3 rounded-md bg-bg-input border border-line text-[13.5px] font-mono text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/[0.06] p-3 text-[12.5px] text-danger fade-in">
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line-divider bg-bg-base/40">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Verifying with Bybit…" : "Verify & connect"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ModeOption({
  label,
  hint,
  active,
  accent,
  onClick,
}: {
  label: string;
  hint: string;
  active: boolean;
  accent: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md p-3 text-left border transition-colors",
        active
          ? accent
            ? "border-accent/50 bg-accent/[0.06]"
            : "border-warning/40 bg-warning/[0.06]"
          : "border-line-subtle bg-bg-base hover:border-line",
      )}
    >
      <div
        className={cn(
          "text-[13px] font-semibold",
          active && accent && "text-accent",
          active && !accent && "text-warning",
          !active && "text-ink-primary",
        )}
      >
        {label}
      </div>
      <div className="text-[11px] text-ink-tertiary mt-0.5">{hint}</div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
