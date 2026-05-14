"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import { SYMBOLS } from "@/lib/mock-data";
import { useSelectedSymbol } from "@/components/dashboard/selected-symbol";
import { cn } from "@/lib/utils";

type Tf = "1" | "5" | "15" | "60" | "240" | "D";

const TFS: { v: Tf; label: string }[] = [
  { v: "1", label: "1m" },
  { v: "5", label: "5m" },
  { v: "15", label: "15m" },
  { v: "60", label: "1H" },
  { v: "240", label: "4H" },
  { v: "D", label: "1D" },
];

function bybitSymbol(s: string): string {
  return s.replace(/\.P$/, "");
}

type BybitKlineResp = {
  retCode: number;
  retMsg: string;
  result: { list: string[][] };
};

async function fetchKlines(symbol: string, tf: Tf): Promise<CandlestickData[]> {
  const url =
    `https://api.bybit.com/v5/market/kline?category=linear` +
    `&symbol=${symbol}&interval=${tf}&limit=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as BybitKlineResp;
  if (data.retCode !== 0) throw new Error(data.retMsg);
  // Bybit returns newest first; chart needs oldest first.
  const rows = [...data.result.list].reverse();
  return rows.map((r) => ({
    time: (Math.floor(parseInt(r[0]) / 1000)) as UTCTimestamp,
    open: parseFloat(r[1]),
    high: parseFloat(r[2]),
    low: parseFloat(r[3]),
    close: parseFloat(r[4]),
  }));
}

type HoverData = {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
} | null;

export function LiveCoinChart() {
  const [selSym] = useSelectedSymbol(SYMBOLS[0].symbol);
  const symbol = bybitSymbol(selSym);
  const meta = SYMBOLS.find((s) => s.symbol === selSym) ?? SYMBOLS[0];

  const [tf, setTf] = useState<Tf>("15");
  const [status, setStatus] = useState<"connecting" | "live" | "reconnecting" | "error">(
    "connecting",
  );
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [firstOpen, setFirstOpen] = useState<number | null>(null);
  const [hover, setHover] = useState<HoverData>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  // Initialise chart once.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0A0A0B" },
        textColor: "#A1A1AA",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#15151A" },
        horzLines: { color: "#15151A" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1F1F24",
      },
      rightPriceScale: { borderColor: "#1F1F24" },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#3F3F46",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1F1F26",
        },
        horzLine: {
          color: "#3F3F46",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1F1F26",
        },
      },
      width: containerRef.current.clientWidth,
      height: 460,
      autoSize: false,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26A69A",
      downColor: "#EF5350",
      borderVisible: false,
      wickUpColor: "#26A69A",
      wickDownColor: "#EF5350",
      priceFormat: { type: "price", precision: meta.decimals, minMove: 10 ** -meta.decimals },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData.has(series)) {
        setHover(null);
        return;
      }
      const c = param.seriesData.get(series) as CandlestickData | undefined;
      if (!c) {
        setHover(null);
        return;
      }
      setHover({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        time: (param.time as number) * 1000,
      });
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply precision when symbol changes.
  useEffect(() => {
    seriesRef.current?.applyOptions({
      priceFormat: { type: "price", precision: meta.decimals, minMove: 10 ** -meta.decimals },
    });
  }, [meta.decimals]);

  // Load historical + open WS when symbol/tf changes.
  useEffect(() => {
    let cancelled = false;
    setStatus("connecting");
    setLastPrice(null);
    setFirstOpen(null);
    setHover(null);

    function clearReconnect() {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    }

    function openWs() {
      const ws = new WebSocket("wss://stream.bybit.com/v5/public/linear");
      wsRef.current = ws;

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: "ping" }));
        }
      }, 20_000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ op: "subscribe", args: [`kline.${tf}.${symbol}`] }));
        if (!cancelled) setStatus("live");
      };
      ws.onerror = () => {
        if (!cancelled) setStatus("reconnecting");
      };
      ws.onclose = () => {
        clearInterval(pingInterval);
        if (cancelled) return;
        setStatus("reconnecting");
        clearReconnect();
        reconnectRef.current = setTimeout(() => {
          if (!cancelled) openWs();
        }, 2_000);
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.op === "pong" || !msg.data || !Array.isArray(msg.data)) return;
          for (const k of msg.data) {
            const candle: CandlestickData = {
              time: Math.floor(parseInt(k.start) / 1000) as UTCTimestamp,
              open: parseFloat(k.open),
              high: parseFloat(k.high),
              low: parseFloat(k.low),
              close: parseFloat(k.close),
            };
            seriesRef.current?.update(candle);
            setLastPrice(candle.close);
          }
        } catch {
          /* ignore parse failures */
        }
      };
    }

    (async () => {
      try {
        const candles = await fetchKlines(symbol, tf);
        if (cancelled || !seriesRef.current) return;
        seriesRef.current.setData(candles);
        if (candles.length) {
          setFirstOpen(candles[0].open);
          setLastPrice(candles[candles.length - 1].close);
          chartRef.current?.timeScale().fitContent();
        }
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }
      if (!cancelled) openWs();
    })();

    return () => {
      cancelled = true;
      clearReconnect();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [symbol, tf]);

  const fmt = (n: number | null | undefined) =>
    n === null || n === undefined
      ? "—"
      : n.toLocaleString("en-US", {
          minimumFractionDigits: meta.decimals,
          maximumFractionDigits: meta.decimals,
        });

  const changePct =
    lastPrice !== null && firstOpen !== null && firstOpen !== 0
      ? ((lastPrice - firstOpen) / firstOpen) * 100
      : null;

  return (
    <div>
      <div className="flex items-start justify-between px-6 pt-5 pb-3 gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-mono text-[14px] text-ink-secondary">{selSym}</span>
          <span className="font-mono text-[28px] font-semibold text-ink-primary tabular-nums">
            {fmt(lastPrice)}
          </span>
          {changePct !== null && (
            <span
              className="font-mono text-[14px] tabular-nums"
              style={{ color: changePct >= 0 ? "#22C55E" : "#DC2626" }}
            >
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </span>
          )}

          {hover && (
            <div className="flex items-center gap-3 ml-2 text-[11.5px] font-mono tabular-nums fade-in">
              <Stat label="O" v={fmt(hover.open)} />
              <Stat label="H" v={fmt(hover.high)} tone="up" />
              <Stat label="L" v={fmt(hover.low)} tone="down" />
              <Stat label="C" v={fmt(hover.close)} />
              <span className="text-ink-tertiary">{formatTime(hover.time)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-bg-input border border-line">
            {TFS.map((t) => (
              <button
                key={t.v}
                onClick={() => setTf(t.v)}
                className={cn(
                  "h-7 px-2.5 rounded text-[11.5px] font-medium uppercase tracking-[0.06em] transition-colors",
                  tf === t.v
                    ? "bg-bg-elevated text-ink-primary"
                    : "text-ink-tertiary hover:text-ink-primary",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <span
            className={cn(
              "text-[11px] uppercase tracking-[0.06em] flex items-center gap-1.5",
              status === "live" && "text-success",
              status === "connecting" && "text-ink-tertiary",
              status === "reconnecting" && "text-warning",
              status === "error" && "text-danger",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                status === "live" && "bg-success animate-pulseDot",
                status === "connecting" && "bg-line-strong",
                status === "reconnecting" && "bg-warning animate-pulseDot",
                status === "error" && "bg-danger",
              )}
            />
            {status === "live" && "Live · Bybit"}
            {status === "connecting" && "Connecting…"}
            {status === "reconnecting" && "Reconnecting…"}
            {status === "error" && "Connection failed"}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-[460px] px-2 pb-3" />
    </div>
  );
}

function Stat({ label, v, tone }: { label: string; v: string; tone?: "up" | "down" }) {
  const color =
    tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-ink-primary";
  return (
    <span className="flex items-center gap-1">
      <span className="text-ink-tertiary uppercase tracking-[0.08em] text-[10.5px]">
        {label}
      </span>
      <span className={cn("tabular-nums", color)}>{v}</span>
    </span>
  );
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

// Suppress unused-import warning for `Time` (kept for future API changes).
export type _Time = Time;
