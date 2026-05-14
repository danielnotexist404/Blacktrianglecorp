import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(n: number, fractionDigits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPct(n: number, fractionDigits = 2): string {
  const s = n.toFixed(fractionDigits);
  return n >= 0 ? `+${s}%` : `${s}%`;
}

export function formatSigned(n: number, fractionDigits = 2): string {
  const s = n.toFixed(fractionDigits);
  return n >= 0 ? `+${s}` : s;
}
