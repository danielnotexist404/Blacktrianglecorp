import Link from "next/link";
import { ArrowUpRight, KeyRound, LineChart, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Triangle } from "@/components/ui/triangle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-ink-primary">
      {/* Top nav */}
      <header className="sticky top-0 z-30 backdrop-blur-[6px] bg-bg-base/70 border-b border-line-divider">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Triangle size={22} className="text-ink-primary" />
            <span className="font-display text-[17px] tracking-[-0.01em]">
              Black Triangle
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] text-ink-secondary">
            <a href="#strategy" className="hover:text-ink-primary transition-colors">Strategy</a>
            <a href="#security" className="hover:text-ink-primary transition-colors">Security</a>
            <a href="#pricing" className="hover:text-ink-primary transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Get started
                <ArrowUpRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 pt-28 pb-24 lg:pt-36 lg:pb-32">
          <div className="max-w-[820px]">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-line-subtle bg-bg-surface text-[11px] uppercase tracking-[0.08em] text-ink-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulseDot" />
              Pre-MVP · Paper trading first
            </span>
            <h1 className="mt-6 font-display text-[44px] lg:text-[64px] leading-[1.05] tracking-tight2 font-bold">
              Volume-profile execution
              <br />
              on Bybit perpetuals.
            </h1>
            <p className="mt-7 text-ink-secondary text-[17px] lg:text-[18px] leading-[1.55] max-w-[680px]">
              A mean-reversion strategy that trades rejections at low-volume
              nodes. Non-custodial — your API keys, your funds. Paper-traded
              for sixty days before a single live order is sent.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  Create account
                  <ArrowUpRight size={16} />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-ink-tertiary uppercase tracking-[0.08em]">
              <span>Bybit · Read + Trade only</span>
              <span className="w-1 h-1 rounded-full bg-line-strong" />
              <span>AWS KMS envelope encryption</span>
              <span className="w-1 h-1 rounded-full bg-line-strong" />
              <span>No withdraw permission, ever</span>
            </div>
          </div>
        </div>

        {/* Decorative triangle in negative space */}
        <Triangle
          size={420}
          withArrow={false}
          className="hidden lg:block absolute right-[-40px] bottom-[-60px] text-bg-elevated opacity-50 pointer-events-none"
        />
      </section>

      {/* Strategy section */}
      <section id="strategy" className="border-t border-line-divider">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-24">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">Section 01</p>
              <h2 className="mt-4 font-display text-[34px] leading-tight">
                One auction map.
                <br />One rule set. No noise.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 text-[15px] leading-[1.6] text-ink-secondary">
              <Feature
                title="Volume profile, 5,000 H1 bars"
                body="A rolling seven-month auction map of where price actually transacted. Low-volume nodes (LVNs) are the inefficiencies the strategy hunts."
              />
              <Feature
                title="Wick test + close confirmation"
                body="Entry requires a single H1 candle to wick into the LVN and close cleanly outside. Closes inside the box invalidate the setup with no order placed."
              />
              <Feature
                title="Distance-weighted partials"
                body="Take-profits cascade from the closest LVN through VAH, POC, VAL, to the far-side runner — sizing proportional to R-distance. Naturally back-loaded."
              />
              <Feature
                title="Tight invalidation, no martingale"
                body="Stop just outside the LVN edge plus half an ATR, with a 0.15% price floor. No averaging down. No re-entries beyond two per LVN before it goes dormant."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-line-divider bg-bg-surface/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-24">
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">Section 02</p>
          <h2 className="mt-4 font-display text-[34px] leading-tight max-w-[720px]">
            Non-custodial. Keys never leave KMS unencrypted.
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <PillarCard
              icon={<KeyRound size={18} className="text-accent" strokeWidth={1.5} />}
              title="Read + Trade only"
              body="API key onboarding rejects any key that holds withdraw permission. Verified before storage."
            />
            <PillarCard
              icon={<ShieldCheck size={18} className="text-accent" strokeWidth={1.5} />}
              title="AWS KMS envelope"
              body="Keys encrypted client-side with a server public key, then re-wrapped server-side with a KMS data key. Decrypted per-request, in-memory, never logged."
            />
            <PillarCard
              icon={<LineChart size={18} className="text-accent" strokeWidth={1.5} />}
              title="Heartbeat fail-safe"
              body="Execution workers refuse new signals if the strategy engine misses a heartbeat for sixty seconds. Fail-safe over fail-active."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-line-divider">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-24">
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">Section 03</p>
          <h2 className="mt-4 font-display text-[34px] leading-tight">Pricing</h2>
          <p className="mt-4 text-ink-secondary max-w-[640px]">
            Capability tiers, not trade counters. Paper trading on every plan.
            Live trading unlocks per user after sixty consecutive paper days.
          </p>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PriceTier
              name="Starter"
              price="29"
              tag="BTC + ETH"
              points={["25 trades / mo", "1 strategy (HDLX)", "Email alerts"]}
            />
            <PriceTier
              name="Pro"
              price="79"
              tag="Top 5 symbols"
              featured
              points={["75 trades / mo", "Telegram alerts", "Custom risk caps"]}
            />
            <PriceTier
              name="Max"
              price="199"
              tag="Top 10 symbols"
              points={["200 trades / mo", "Priority signal feed", "Multi-account"]}
            />
            <PriceTier
              name="Ultra"
              price="499"
              tag="All symbols"
              points={["Unlimited trades", "API access", "Dedicated support"]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line-divider">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Triangle size={16} withArrow={false} className="text-ink-tertiary" />
            <span className="text-[12.5px] text-ink-tertiary tracking-[0.04em]">
              Black Triangle Group · Software tool, not investment advice.
            </span>
          </div>
          <div className="flex items-center gap-6 text-[12.5px] text-ink-tertiary">
            <Link href="/terms" className="hover:text-ink-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-ink-primary transition-colors">Privacy</Link>
            <Link href="/risk-disclosure" className="hover:text-ink-primary transition-colors">Risk disclosure</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-ink-primary text-[15px] font-semibold">{title}</h3>
      <p className="mt-2">{body}</p>
    </div>
  );
}

function PillarCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card bg-bg-surface border border-line-subtle p-6">
      <div className="w-9 h-9 rounded-[6px] bg-bg-elevated border border-line-subtle flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-5 text-ink-primary text-[15px] font-semibold">{title}</h3>
      <p className="mt-2 text-[14px] leading-[1.55] text-ink-secondary">{body}</p>
    </div>
  );
}

function PriceTier({
  name,
  price,
  tag,
  points,
  featured = false,
}: {
  name: string;
  price: string;
  tag: string;
  points: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={
        "rounded-card border p-6 flex flex-col " +
        (featured
          ? "border-accent/40 bg-accent/[0.04]"
          : "border-line-subtle bg-bg-surface")
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
          {name}
        </span>
        {featured && (
          <span className="text-[10px] text-accent uppercase tracking-[0.08em] font-semibold">
            Most chosen
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-mono text-[34px] leading-none font-semibold tracking-tightish">
          ${price}
        </span>
        <span className="text-[12px] text-ink-tertiary">/ mo</span>
      </div>
      <div className="mt-1 text-[12px] text-ink-tertiary uppercase tracking-[0.05em]">
        {tag}
      </div>
      <ul className="mt-6 space-y-2.5 text-[13.5px] text-ink-secondary flex-1">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span className="mt-[7px] w-1 h-1 rounded-full bg-line-strong" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={featured ? "primary" : "secondary"}
        size="md"
        className="mt-7 w-full"
      >
        Choose {name}
      </Button>
    </div>
  );
}
