"use client";

import { useEffect, useState } from "react";

export type Mode = "demo" | "live";

const KEY = "btg.mode";
const EVT = "btg-mode-change";

export function readMode(): Mode {
  if (typeof window === "undefined") return "demo";
  const v = window.localStorage.getItem(KEY);
  return v === "live" ? "live" : "demo";
}

export function writeMode(m: Mode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, m);
  window.dispatchEvent(new CustomEvent<Mode>(EVT, { detail: m }));
}

export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>("demo");

  useEffect(() => {
    setMode(readMode());
    const onCustom = (e: Event) => {
      const m = (e as CustomEvent<Mode>).detail;
      if (m === "demo" || m === "live") setMode(m);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "demo" || e.newValue === "live")) {
        setMode(e.newValue);
      }
    };
    window.addEventListener(EVT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const set = (m: Mode) => {
    writeMode(m);
    setMode(m);
  };
  return [mode, set];
}
