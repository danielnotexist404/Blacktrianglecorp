import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";

import { Triangle } from "@/components/ui/triangle";

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base text-ink-primary">
      {/* Top nav */}
      <header className="sticky top-0 z-30 backdrop-blur-[6px] bg-bg-base/70 border-b border-line-divider">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Triangle size={22} className="text-ink-primary" />
            <span className="font-display text-[17px] tracking-[-0.01em]">
              Black Triangle
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] text-ink-secondary hover:text-ink-primary transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to site
          </Link>
        </div>
      </header>

      <main className="max-w-[820px] mx-auto px-6 lg:px-10 py-14 lg:py-20">
        <div className="text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">
          Legal
        </div>
        <h1 className="mt-3 font-display text-[40px] lg:text-[48px] leading-[1.1] tracking-tight2 font-bold">
          {title}
        </h1>
        <p className="mt-4 text-[13px] text-ink-tertiary">
          Last updated · {lastUpdated}
        </p>

        {/* Draft notice */}
        <div className="mt-8 rounded-card border border-warning/30 bg-warning/[0.06] p-4 flex items-start gap-3">
          <FileWarning size={16} className="text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="text-[12.5px] leading-relaxed text-ink-secondary">
            <p className="text-ink-primary font-medium">Pre-launch draft.</p>
            <p className="mt-1">
              This document is a working draft pending legal review. Final
              terms will be finalised by counsel before public beta. Until
              then, BTG Trader operates in paper-trading mode only, with no
              live execution and no paid subscriptions.
            </p>
          </div>
        </div>

        <article className="prose-legal mt-10">{children}</article>

        {/* Bottom links */}
        <div className="mt-16 pt-10 border-t border-line-divider flex flex-wrap items-center justify-between gap-4 text-[13px]">
          <div className="flex items-center gap-2.5 text-ink-tertiary">
            <Triangle size={14} withArrow={false} className="text-ink-tertiary" />
            <span>Black Triangle Group</span>
          </div>
          <div className="flex items-center gap-6 text-ink-tertiary">
            <Link href="/terms" className="hover:text-ink-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-ink-primary transition-colors">Privacy</Link>
            <Link href="/risk-disclosure" className="hover:text-ink-primary transition-colors">Risk disclosure</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0 scroll-mt-24" id={`s-${number}`}>
      <h2 className="font-display text-[24px] leading-tight tracking-tight">
        <span className="text-ink-tertiary font-mono text-[16px] mr-3">{number}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[14.5px] leading-[1.7] text-ink-secondary">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-[10px] w-1 h-1 rounded-full bg-line-strong shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
