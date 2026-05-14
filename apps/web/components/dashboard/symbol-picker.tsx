"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SYMBOLS } from "@/lib/mock-data";
import { useSelectedSymbol } from "@/components/dashboard/selected-symbol";
import { cn } from "@/lib/utils";

export function SymbolPicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useSelectedSymbol(SYMBOLS[0].symbol);
  const current = SYMBOLS.find((s) => s.symbol === selected) ?? SYMBOLS[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-line-subtle bg-bg-surface hover:bg-bg-elevated transition-colors"
      >
        <span className="font-mono text-[13px]">{current.symbol}</span>
        <ChevronDown
          size={14}
          className={cn(
            "text-ink-tertiary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 left-0 top-11 w-56 bg-bg-overlay border border-line-subtle rounded-card shadow-2xl shadow-black/50 overflow-hidden fade-in">
            {SYMBOLS.map((s) => {
              const isSel = s.symbol === selected;
              return (
                <button
                  key={s.symbol}
                  onClick={() => {
                    setSelected(s.symbol);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] hover:bg-bg-elevated transition-colors text-left",
                    isSel && "bg-bg-elevated/60",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-ink-primary">{s.symbol}</span>
                    <span className="text-[11px] text-ink-tertiary uppercase tracking-[0.06em]">
                      {s.short} perpetual
                    </span>
                  </div>
                  {isSel && <Check size={14} className="text-accent" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
