"use client";

import { useEffect, useRef, useState } from "react";
import { SYMBOLS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Tick = {
  short: string;
  symbol: string;
  decimals: number;
  price: number | null;
  prev: number | null;
  first: number | null;
  flashUntil: number;
};

function bybitSymbol(s: string): string {
  return s.replace(/\.P$/, "");
}

function fmt(n: number | null, decimals: number): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function PriceTicker() {
  const [ticks, setTicks] = useState<Tick[]>(() =>
    SYMBOLS.map((m) => ({
      short: m.short,
      symbol: m.symbol,
      decimals: m.decimals,
      price: null,
      prev: null,
      first: null,
      flashUntil: 0,
    })),
  );
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    const subs = SYMBOLS.map((m) => `tickers.${bybitSymbol(m.symbol)}`);

    function clearReconnect() {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    }

    function open() {
      const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
      wsRef.current = ws;

      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: "ping" }));
      }, 20_000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ op: "subscribe", args: subs }));
      };
      ws.onclose = () => {
        clearInterval(ping);
        if (cancelled) return;
        clearReconnect();
        reconnectRef.current = setTimeout(open, 2_000);
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.op === "pong") return;
          if (!msg.topic || !msg.topic.startsWith("tickers.")) return;
          const sym = msg.topic.slice("tickers.".length);
          const last = msg.data?.lastPrice;
          if (!last) return;
          const price = parseFloat(last);
          const now = Date.now();
          setTicks((prev) =>
            prev.map((t) => {
              if (bybitSymbol(t.symbol) !== sym) return t;
              const first = t.first ?? price;
              const prevPrice = t.price;
              const moved = prevPrice !== null && price !== prevPrice;
              return {
                ...t,
                first,
                prev: prevPrice,
                price,
                flashUntil: moved ? now + 700 : t.flashUntil,
              };
            }),
          );
        } catch {
          /* ignore */
        }
      };
    }
    open();

    return () => {
      cancelled = true;
      clearReconnect();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return (
    <div className="hidden md:flex items-center gap-1 overflow-x-auto">
      {ticks.map((t) => {
        const up = t.prev === null ? true : (t.price ?? 0) >= t.prev;
        const changePct =
          t.first !== null && t.price !== null && t.first !== 0
            ? ((t.price - t.first) / t.first) * 100
            : 0;
        const dir = changePct >= 0;
        const flashing = Date.now() < t.flashUntil;
        return (
          <div
            key={t.symbol}
            className={cn(
              "px-3 py-1.5 rounded-md border border-line-subtle bg-bg-surface " +
                "flex items-center gap-2.5 transition-colors duration-300",
              flashing && (up ? "bg-success/[0.06]" : "bg-danger/[0.06]"),
            )}
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
              {t.short}
            </span>
            <span className="font-mono text-[12.5px] tabular-nums text-ink-primary">
              {fmt(t.price, t.decimals)}
            </span>
            {t.first !== null && t.price !== null && (
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  dir ? "text-success" : "text-danger",
                )}
              >
                {dir ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
