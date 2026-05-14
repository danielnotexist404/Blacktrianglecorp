"use client";

import { useMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

export function ModeIndicator() {
  const [mode, setMode] = useMode();
  return (
    <button
      onClick={() => setMode(mode === "demo" ? "live" : "demo")}
      title={mode === "demo" ? "Switch to live trading" : "Switch to demo (Bybit testnet)"}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border " +
          "text-[10.5px] font-semibold uppercase tracking-[0.06em] " +
          "transition-colors duration-150",
        mode === "demo"
          ? "text-warning bg-warning/[0.08] border-warning/30 hover:bg-warning/[0.14]"
          : "text-accent bg-accent/[0.08] border-accent/30 hover:bg-accent/[0.14]",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulseDot",
          mode === "demo" ? "bg-warning" : "bg-accent",
        )}
      />
      {mode === "demo" ? "Demo · Testnet" : "Live · Mainnet"}
    </button>
  );
}
