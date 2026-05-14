"use client";

import Link from "next/link";
import { ArrowRight, KeyRound, Inbox, Check, CircleDashed } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LiveCoinChart } from "@/components/dashboard/live-coin-chart";
import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [mode] = useMode();
  // No persistent state yet — the engine isn't wired. Treat every visit as
  // pre-onboarding until the user connects a key + we have something to show.
  const apiKeyConnected = false;
  const engineRunning = false;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tightish">
            Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            {mode === "demo"
              ? "Demo mode — Bybit testnet. No real funds at risk."
              : "Live mode — Bybit mainnet. Real orders, real funds."}
          </p>
        </div>
      </div>

      {!apiKeyConnected && <OnboardingChecklist mode={mode} />}

      <Card className="fade-in">
        <CardHeader
          title="Market"
          right={
            <span className="text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
              Selected symbol
            </span>
          }
        />
        <LiveCoinChart />
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 fade-in">
        <Card>
          <CardHeader title="Active positions" />
          <EmptyState
            icon={<Inbox size={24} strokeWidth={1.5} />}
            title="No active positions"
            body={
              apiKeyConnected
                ? "The engine will open positions here once a setup confirms."
                : "Connect a Bybit API key to begin paper trading."
            }
            action={
              !apiKeyConnected ? (
                <Link href="/keys">
                  <Button variant="secondary" size="sm">
                    <KeyRound size={14} strokeWidth={1.5} />
                    Connect API key
                  </Button>
                </Link>
              ) : null
            }
          />
        </Card>

        <Card>
          <CardHeader
            title="Signal feed"
            right={
              <span
                className={cn(
                  "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em]",
                  engineRunning ? "text-success" : "text-ink-tertiary",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    engineRunning ? "bg-success animate-pulseDot" : "bg-line-strong",
                  )}
                />
                {engineRunning ? "Streaming" : "Offline"}
              </span>
            }
          />
          <EmptyState
            icon={<CircleDashed size={24} strokeWidth={1.5} />}
            title="Waiting for signals"
            body="The strategy engine emits a signal each time a candle wicks into an LVN and closes outside it."
          />
        </Card>
      </div>

      <p className="text-[11.5px] text-ink-muted text-center pt-2">
        Strategy engine is not yet attached to this account. Past performance
        is not indicative of future results.
      </p>
    </div>
  );
}

function OnboardingChecklist({ mode }: { mode: "demo" | "live" }) {
  const steps = [
    { id: 1, done: true, label: "Account created", hint: "Welcome." },
    {
      id: 2,
      done: false,
      label: "Connect Bybit API key",
      hint:
        mode === "demo"
          ? "Use a testnet key — generate one at testnet.bybit.com."
          : "Use a mainnet key with Read + Trade permissions only.",
      cta: { href: "/keys", label: "Connect key" },
    },
    {
      id: 3,
      done: false,
      label: "Start paper engine",
      hint: "Engine runs the H.D.L.X rules against live market data without placing orders.",
      cta: { href: "/strategy", label: "View strategy" },
    },
  ];

  return (
    <Card className="fade-in">
      <div className="px-6 py-5 border-b border-line-divider">
        <h2 className="font-display text-[20px] leading-tight">Welcome</h2>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Three steps before the engine begins evaluating signals on your account.
        </p>
      </div>
      <ol className="divide-y divide-line-divider">
        {steps.map((s) => (
          <li
            key={s.id}
            className="flex items-start gap-4 px-6 py-4 hover:bg-bg-elevated/40 transition-colors"
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-semibold",
                s.done
                  ? "bg-success/[0.10] border-success/40 text-success"
                  : "bg-bg-base border-line text-ink-tertiary",
              )}
            >
              {s.done ? <Check size={14} strokeWidth={2} /> : s.id}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-ink-primary">
                {s.label}
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-secondary">{s.hint}</div>
            </div>
            {s.cta && !s.done && (
              <Link href={s.cta.href}>
                <Button variant="secondary" size="sm">
                  {s.cta.label}
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Button>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-14 flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full border border-line-subtle bg-bg-base flex items-center justify-center text-ink-tertiary">
        {icon}
      </div>
      <h3 className="mt-4 text-[14.5px] font-medium text-ink-primary">{title}</h3>
      <p className="mt-1.5 text-[13px] text-ink-secondary max-w-sm">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
