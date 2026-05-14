"use client";

import { useState } from "react";
import { Bell, Lock, ShieldCheck, User, Sliders, Globe } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "risk", label: "Risk", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("risk");
  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] leading-tight tracking-tightish">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Configure how the strategy engine and your account behave.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* tabs */}
        <nav className="space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors text-left",
                tab === t.id
                  ? "bg-bg-elevated text-ink-primary"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated/60",
              )}
            >
              <t.icon size={15} strokeWidth={1.5} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-5 fade-in">
          {tab === "risk" && <RiskPanel />}
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "account" && <AccountPanel />}
          {tab === "security" && <SecurityPanel />}
        </div>
      </div>
    </div>
  );
}

function RiskPanel() {
  const [perTrade, setPerTrade] = useState(1.0);
  const [dailyLoss, setDailyLoss] = useState(5);
  const [maxLev, setMaxLev] = useState(3);
  const [focus, setFocus] = useState<"large_only" | "small_only" | "both">("both");
  return (
    <>
      <Card>
        <CardHeader title="Position risk" />
        <div className="p-6 space-y-6">
          <Slider
            label="Risk per trade"
            value={perTrade}
            min={0.25}
            max={3}
            step={0.25}
            unit="% of equity"
            onChange={setPerTrade}
            hint="Caps the dollar loss on stop-loss hit. 1% is the locked default."
          />
          <Slider
            label="Daily loss cap"
            value={dailyLoss}
            min={1}
            max={10}
            step={0.5}
            unit="% of equity"
            onChange={setDailyLoss}
            hint="Trading halts for the day if cumulative loss exceeds this."
          />
          <Slider
            label="Max leverage"
            value={maxLev}
            min={1}
            max={10}
            step={1}
            unit="×"
            onChange={setMaxLev}
            hint="Hard ceiling enforced even if Bybit account allows higher."
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="LVN focus mode" />
        <div className="p-6 grid sm:grid-cols-3 gap-3">
          <Choice
            label="Large only"
            body="Take only the deepest LVNs. Lower frequency, higher conviction."
            selected={focus === "large_only"}
            onClick={() => setFocus("large_only")}
          />
          <Choice
            label="Both"
            body="Default. Take whichever LVN was tested first in cluster."
            selected={focus === "both"}
            onClick={() => setFocus("both")}
            recommended
          />
          <Choice
            label="Small only"
            body="Filter to small LVNs. Higher frequency, smaller R targets."
            selected={focus === "small_only"}
            onClick={() => setFocus("small_only")}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="md">Cancel</Button>
        <Button variant="primary" size="md">Save changes</Button>
      </div>
    </>
  );
}

function NotificationsPanel() {
  return (
    <>
      <Card>
        <CardHeader title="Channels" />
        <div className="divide-y divide-line-divider">
          <Toggle label="Email" detail="support@secureops.co.il" defaultOn />
          <Toggle label="Telegram" detail="Not linked" />
          <Toggle label="Webhook" detail="https://hook.firm.com/btg" />
          <Toggle label="In-app push" detail="When the dashboard tab is open" defaultOn />
        </div>
      </Card>
      <Card>
        <CardHeader title="Events" />
        <div className="divide-y divide-line-divider">
          <Toggle label="Signal entry filled" defaultOn />
          <Toggle label="Partial take-profit hit" defaultOn />
          <Toggle label="Stop-loss hit" defaultOn />
          <Toggle label="Daily P&L summary" defaultOn />
          <Toggle label="Engine heartbeat lost > 60s" defaultOn />
          <Toggle label="API key health check failed" defaultOn />
        </div>
      </Card>
    </>
  );
}

function AccountPanel() {
  return (
    <Card>
      <CardHeader title="Profile" />
      <div className="p-6 space-y-5">
        <Field label="Email" value="support@secureops.co.il" />
        <Field
          label="Subscription"
          value="Free · pre-MVP"
          badge={<Badge tone="paper">Beta</Badge>}
        />
        <Field label="Locale" value="English (US)" trailing={<Globe size={14} className="text-ink-tertiary" />} />
        <div className="pt-2 flex items-center gap-2">
          <Button variant="secondary" size="sm">Change password</Button>
          <Button variant="danger" size="sm">Delete account</Button>
        </div>
      </div>
    </Card>
  );
}

function SecurityPanel() {
  return (
    <Card>
      <CardHeader title="Security" />
      <div className="p-6 space-y-5 text-[13.5px] text-ink-secondary">
        <Field label="Two-factor (TOTP)" value="Not enabled" badge={<Badge tone="paper">Off</Badge>} />
        <Field label="Encryption" value="AWS KMS envelope" trailing={<Lock size={14} className="text-success" strokeWidth={1.5} />} />
        <p className="text-[12.5px] text-ink-tertiary leading-relaxed">
          Your API keys are crypto-shredded on revoke or account deletion. We
          do not retain secret material after revocation.
        </p>
      </div>
    </Card>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-ink-primary">{label}</span>
        <span className="font-mono text-[14px] text-ink-primary tabular-nums">
          {value} <span className="text-ink-tertiary text-[12px]">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-3 w-full h-1 rounded-full bg-bg-elevated appearance-none accent-accent cursor-pointer"
      />
      <p className="mt-2 text-[11.5px] text-ink-tertiary leading-snug">{hint}</p>
    </div>
  );
}

function Choice({
  label,
  body,
  selected,
  onClick,
  recommended = false,
}: {
  label: string;
  body: string;
  selected: boolean;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-md border transition-colors",
        selected
          ? "border-accent/50 bg-accent/[0.05]"
          : "border-line-subtle bg-bg-base hover:border-line",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-primary">{label}</span>
        {recommended && (
          <span className="text-[10px] text-accent uppercase tracking-[0.08em] font-semibold">
            Default
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] text-ink-secondary leading-snug">{body}</p>
    </button>
  );
}

function Toggle({
  label,
  detail,
  defaultOn = false,
}: {
  label: string;
  detail?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <div className="text-[13.5px] text-ink-primary">{label}</div>
        {detail && <div className="text-[11.5px] text-ink-tertiary mt-0.5">{detail}</div>}
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={cn(
          "w-10 h-6 rounded-full transition-colors relative",
          on ? "bg-accent" : "bg-bg-elevated border border-line",
        )}
        aria-pressed={on}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-[left] duration-200",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  badge,
  trailing,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
        {label}
      </span>
      <span className="flex items-center gap-2.5 text-[14px] text-ink-primary">
        {value}
        {badge}
        {trailing}
      </span>
    </div>
  );
}
