"use client";

import { useEffect, useState } from "react";
import { Bell, Lock, ShieldCheck, User, Globe } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("notifications");
  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] leading-tight tracking-tightish">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Manage how the platform talks to you. Strategy parameters and risk
          caps are set centrally by Black Triangle staff.
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
          {tab === "notifications" && <NotificationsPanel />}
          {tab === "account" && <AccountPanel />}
          {tab === "security" && <SecurityPanel />}
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  return (
    <>
      <Card>
        <CardHeader title="Channels" />
        <div className="divide-y divide-line-divider">
          <Toggle label="Email" detail="Your account email" defaultOn />
          <Toggle label="Telegram" detail="Not linked" />
          <Toggle label="Webhook" detail="Coming soon" />
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
  const [email, setEmail] = useState("—");
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);
  return (
    <Card>
      <CardHeader title="Profile" />
      <div className="p-6 space-y-5">
        <Field label="Email" value={email} />
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
        <Field label="Encryption" value="AES-256-GCM (server-held key)" trailing={<Lock size={14} className="text-success" strokeWidth={1.5} />} />
        <p className="text-[12.5px] text-ink-tertiary leading-relaxed">
          Your API keys are encrypted at rest with a server-only key and
          crypto-shredded on revoke or account deletion. We do not retain
          secret material after revocation.
        </p>
      </div>
    </Card>
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
