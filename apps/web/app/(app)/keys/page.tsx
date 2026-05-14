"use client";

import { useState } from "react";
import { Check, AlertTriangle, KeyRound, Plus, X, Trash2, ExternalLink } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMode, type Mode } from "@/lib/mode";

type ConnectedKey = {
  id: string;
  exchange: "Bybit";
  label: string;
  mode: Mode;
  permissions: ("read" | "trade")[];
  createdAt: string;
  lastUsed: string;
};

export default function KeysPage() {
  const [globalMode] = useMode();
  const [keys, setKeys] = useState<ConnectedKey[]>([]);
  const [showForm, setShowForm] = useState(false);

  function handleConnected(k: ConnectedKey) {
    setKeys((prev) => [...prev, k]);
    setShowForm(false);
  }
  function handleRevoke(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tightish">
            API keys
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Connect your Bybit account. Keys are encrypted with AWS KMS
            envelope encryption and never logged.
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
              body="If your key has withdraw enabled, the connection is refused. Revoke withdraw on Bybit before retrying."
            />
            <Pillar
              tone="ok"
              icon={<Check size={16} strokeWidth={2} />}
              title="IP allowlist supported"
              body="Lock the key to our static IP for an additional layer of defense."
            />
            <Pillar
              tone="ok"
              icon={<Check size={16} strokeWidth={2} />}
              title="KMS envelope encryption"
              body="Decrypted per-request, in-memory. Never logged. Crypto-shredded on revoke."
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
                ? "Generate a testnet key at testnet.bybit.com. Demo mode uses the same flow as live but no funds are at risk."
                : "Generate a Bybit API key with Read + Trade permissions (never Withdraw). You can switch back to demo at any time."}
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} strokeWidth={2} />
                Connect key
              </Button>
              <a
                href={
                  globalMode === "demo"
                    ? "https://testnet.bybit.com/app/user/api-management"
                    : "https://www.bybit.com/app/user/api-management"
                }
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
                    <div className="mt-1.5 flex items-center gap-3 text-[12px] text-ink-tertiary">
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
                  <Button variant="secondary" size="sm">
                    Rotate
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleRevoke(k.id)}>
                    <Trash2 size={14} strokeWidth={1.5} />
                    Revoke
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
          onConnected={handleConnected}
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
  onConnected,
}: {
  defaultMode: Mode;
  onClose: () => void;
  onConnected: (k: ConnectedKey) => void;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setError(null);
    setVerifying(true);
    // Simulated client-side validation. Real verification will hit Bybit's
    // /v5/user/query-api endpoint server-side and reject if withdraw=1.
    await new Promise((r) => setTimeout(r, 700));
    if (!apiKey || apiKey.length < 8) {
      setError("API key looks too short.");
      setVerifying(false);
      return;
    }
    if (!apiSecret || apiSecret.length < 8) {
      setError("API secret looks too short.");
      setVerifying(false);
      return;
    }
    setVerifying(false);
    setVerified(true);
  }

  function save() {
    onConnected({
      id: `k-${Math.random().toString(36).slice(2, 8)}`,
      exchange: "Bybit",
      label: label || (mode === "demo" ? "Demo account" : "Main account"),
      mode,
      permissions: ["read", "trade"],
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: "just now",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-bg-overlay border border-line-subtle rounded-card shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-divider">
          <h2 className="font-display text-[20px]">Connect Bybit</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-bg-elevated text-ink-secondary flex items-center justify-center"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Mode picker */}
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-secondary mb-2">
              Environment
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ModeOption
                label="Demo"
                hint="testnet.bybit.com"
                active={mode === "demo"}
                accent={false}
                onClick={() => setMode("demo")}
              />
              <ModeOption
                label="Live"
                hint="bybit.com mainnet"
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
              Create the key on Bybit with <strong className="text-ink-primary">Read</strong>{" "}
              and <strong className="text-ink-primary">Trade</strong> permissions only. Do
              not enable Withdraw.
            </p>
          </div>

          <Field label="Label (optional)">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={mode === "demo" ? "Demo account" : "Main account"}
              className="w-full h-10 px-3 rounded-md bg-bg-input border border-line text-[13.5px] text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
            />
          </Field>

          <Field label="API key">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setVerified(false);
              }}
              placeholder="BYBIT-XXXXXXXX"
              className="w-full h-10 px-3 rounded-md bg-bg-input border border-line text-[13.5px] font-mono text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
            />
          </Field>

          <Field label="API secret">
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => {
                setApiSecret(e.target.value);
                setVerified(false);
              }}
              placeholder="••••••••••••••••"
              className="w-full h-10 px-3 rounded-md bg-bg-input border border-line text-[13.5px] font-mono text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/[0.06] p-3 text-[12.5px] text-danger fade-in">
              {error}
            </div>
          )}

          {verified && (
            <div className="rounded-md border border-success/30 bg-success/[0.06] p-3.5 flex items-start gap-3 text-[12.5px] text-ink-secondary fade-in">
              <Check size={14} className="text-success shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-ink-primary">
                  Verified · Read + Trade detected · no Withdraw.
                </p>
                <p className="mt-0.5 text-ink-tertiary">
                  {mode === "demo"
                    ? "Testnet endpoint confirmed."
                    : "Mainnet endpoint confirmed."}{" "}
                  Ready to encrypt and store.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line-divider bg-bg-base/40">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {verified ? (
            <Button variant="primary" size="sm" onClick={save}>
              Encrypt &amp; save
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={verify}
              disabled={!apiKey || !apiSecret || verifying}
            >
              {verifying ? "Verifying…" : "Verify permissions"}
            </Button>
          )}
        </div>
      </div>
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
