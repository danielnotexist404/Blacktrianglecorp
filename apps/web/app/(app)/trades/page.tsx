"use client";

import Link from "next/link";
import { Download, History, KeyRound } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trades } from "@/lib/mock-data";

export default function TradesPage() {
  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight tracking-tightish">
            Trades
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Complete fill history will appear here as the engine closes positions.
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled={trades.length === 0}>
          <Download size={14} strokeWidth={1.5} />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader title="History" />
        <div className="px-6 py-20 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-line-subtle bg-bg-base flex items-center justify-center text-ink-tertiary">
            <History size={22} strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-[15px] font-medium text-ink-primary">
            No trades yet
          </h3>
          <p className="mt-2 text-[13px] text-ink-secondary max-w-md">
            Your trade history is empty. Once the strategy engine closes a
            position in demo or live mode, every fill, partial, and stop-loss
            event lands here with R-multiples and duration.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Link href="/keys">
              <Button variant="primary" size="sm">
                <KeyRound size={14} strokeWidth={1.5} />
                Connect Bybit
              </Button>
            </Link>
            <Link href="/strategy">
              <Button variant="secondary" size="sm">View strategy</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
