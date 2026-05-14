"use client";

import { useEffect, useState } from "react";

const KEY = "btg.symbol";
const EVT = "btg-symbol-change";

export function readSymbol(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(KEY) ?? fallback;
}

export function writeSymbol(s: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, s);
  window.dispatchEvent(new CustomEvent<string>(EVT, { detail: s }));
}

export function useSelectedSymbol(fallback: string): [string, (s: string) => void] {
  const [sym, setSym] = useState<string>(fallback);
  useEffect(() => {
    setSym(readSymbol(fallback));
    const onCustom = (e: Event) => setSym((e as CustomEvent<string>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setSym(e.newValue);
    };
    window.addEventListener(EVT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [fallback]);

  const set = (s: string) => {
    writeSymbol(s);
    setSym(s);
  };
  return [sym, set];
}
