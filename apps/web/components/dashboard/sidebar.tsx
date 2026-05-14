"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  KeyRound,
  LifeBuoy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Triangle } from "@/components/ui/triangle";
import { useMode } from "@/lib/mode";

const navMain = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Strategy", icon: TrendingUp, href: "/strategy" },
  { label: "Trades", icon: History, href: "/trades" },
  { label: "API keys", icon: KeyRound, href: "/keys" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar({ hasApiKey }: { hasApiKey: boolean }) {
  const pathname = usePathname();
  const [mode] = useMode();
  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-line-divider bg-bg-base">
      <Link
        href="/"
        className="h-16 px-5 flex items-center gap-2.5 border-b border-line-divider hover:bg-bg-elevated/40 transition-colors"
      >
        <Triangle size={22} className="text-ink-primary" />
        <span className="font-display text-[15px] tracking-[-0.01em]">
          Black Triangle
        </span>
      </Link>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navMain.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] " +
                  "transition-colors duration-150",
                active
                  ? "bg-bg-elevated text-ink-primary"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated/60",
              )}
            >
              <item.icon size={16} strokeWidth={1.5} />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full bg-accent animate-pulseDot" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-line-divider space-y-3">
        <Status
          label="Bybit"
          tone={hasApiKey ? "ok" : "warn"}
          detail={hasApiKey ? "Connected" : "Not connected"}
        />
        <Status
          label="Engine"
          tone="warn"
          detail={hasApiKey ? "Idle" : "Awaiting key"}
        />
        <Status
          label="Mode"
          tone={mode === "demo" ? "paper" : "live"}
          detail={mode === "demo" ? "Demo · Testnet" : "Live · Mainnet"}
        />
      </div>

      <div className="px-3 py-4 border-t border-line-divider">
        <Link
          href="#"
          className="flex items-center gap-3 px-3 h-9 rounded-md text-[13px] text-ink-tertiary hover:text-ink-primary hover:bg-bg-elevated/60 transition-colors"
        >
          <LifeBuoy size={16} strokeWidth={1.5} />
          <span>Help & docs</span>
        </Link>
      </div>
    </aside>
  );
}

function Status({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "ok" | "paper" | "live" | "warn" | "err";
}) {
  const dotColor =
    tone === "ok"
      ? "bg-success"
      : tone === "paper"
      ? "bg-warning"
      : tone === "live"
      ? "bg-accent"
      : tone === "warn"
      ? "bg-warning"
      : "bg-danger";
  return (
    <div className="flex items-center justify-between text-[11.5px]">
      <span className="text-ink-tertiary uppercase tracking-[0.06em]">{label}</span>
      <span className="flex items-center gap-1.5 text-ink-secondary">
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulseDot", dotColor)} />
        {detail}
      </span>
    </div>
  );
}
