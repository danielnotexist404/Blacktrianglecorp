import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SYMBOLS } from "@/lib/mock-data";
import { Lock, Sliders } from "lucide-react";

const params = [
  { label: "Timeframe", value: "H1", hint: "1-hour bars, both directions" },
  { label: "VP lookback", value: "5,000 bars", hint: "~7 months rolling auction map" },
  { label: "Row count", value: "100", hint: "Profile granularity" },
  { label: "Neighbor pct", value: "0.07", hint: "Seed window (HDLX_VP vgNoN)" },
  { label: "Extend threshold", value: "0.30", hint: "Extension <70% of local mean" },
  { label: "ATR multiplier", value: "1.5×", hint: "max LVN height" },
  { label: "SL buffer", value: "0.5× ATR + 0.15%", hint: "Stop just outside LVN edge" },
  { label: "Focus mode", value: "Both", hint: "large + small LVNs" },
  { label: "Confirmation", value: "Single-bar", hint: "Wick + close in same H1" },
  { label: "Re-entry cap", value: "2 per LVN", hint: "Dormant after second SL" },
];

const ruleCards = [
  {
    title: "1 · Entry trigger",
    body: "A single H1 candle wicks into the LVN box (wick ≥ box edge) and the same candle closes outside the box. Entry order fires at the next bar's open.",
  },
  {
    title: "2 · Invalidation",
    body: "If the trigger candle closes back inside the LVN box, the setup is voided. The evaluator immediately moves to the next LVN in the queue — no cooldown.",
  },
  {
    title: "3 · Stop loss",
    body: "Placed at the far LVN edge ± 0.5 × ATR(14), with a 0.15% price-distance floor. After each partial fill, SL trails to the previous partial's level.",
  },
  {
    title: "4 · Take-profit cascade",
    body: "Targets line up from the closest LVN through VAH, POC, VAL, intermediate LVNs, to the far-side runner. Sizes are R-distance weighted — the runner gets the biggest tranche.",
  },
];

export default function StrategyPage() {
  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tightish">
            Strategy
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            H.D.L.X — Hidden Distribution Level Execution · Bybit Perpetual Futures
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Sliders size={14} strokeWidth={1.5} />
            Backtest
          </Button>
          <Button variant="primary" size="sm">Run forward test</Button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="live" pulsing>Engine online</Badge>
        <Badge tone="paper">Paper trading</Badge>
        <Badge tone="info">
          <Lock size={11} strokeWidth={2} />
          Rule set locked
        </Badge>
      </div>

      {/* Symbols card */}
      <Card>
        <CardHeader title="Subscribed symbols" right={
          <Button variant="ghost" size="sm">Manage</Button>
        } />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-6">
          {SYMBOLS.map((s) => (
            <div
              key={s.symbol}
              className="rounded-md border border-line-subtle bg-bg-base hover:bg-bg-elevated/60 transition-colors px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12.5px] text-ink-primary">{s.symbol}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulseDot" />
              </div>
              <div className="mt-1 text-[10.5px] text-ink-tertiary uppercase tracking-[0.06em]">
                {s.short} perpetual
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Parameters grid */}
      <Card>
        <CardHeader title="Locked parameters" right={
          <span className="text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
            Editable in v2
          </span>
        } />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-line-divider rounded-b-card overflow-hidden">
          {params.map((p) => (
            <div key={p.label} className="bg-bg-surface p-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                {p.label}
              </div>
              <div className="mt-2 font-mono text-[16px] text-ink-primary">{p.value}</div>
              <div className="mt-1 text-[11px] text-ink-tertiary leading-snug">
                {p.hint}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rule recap */}
      <div>
        <h2 className="font-display text-[20px] mb-4">Rule set</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ruleCards.map((r) => (
            <Card key={r.title} className="p-6">
              <h3 className="text-[14.5px] font-semibold text-ink-primary">{r.title}</h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-secondary">
                {r.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
