"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Activity,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Triangle } from "@/components/ui/triangle";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "API keys", icon: KeyRound, href: "/admin/keys" },
  { label: "Activity", icon: Activity, href: "/admin/activity" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex bg-bg-base">
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-line-divider bg-bg-base">
        <Link
          href="/dashboard"
          className="h-16 px-5 flex items-center gap-2.5 border-b border-line-divider hover:bg-bg-elevated/40 transition-colors"
        >
          <Triangle size={22} className="text-accent" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[14px] tracking-[-0.01em]">
              Black Triangle
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-accent">
              Admin
            </span>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-5 space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] " +
                    "transition-colors duration-150",
                  active
                    ? "bg-accent/[0.10] text-ink-primary border border-accent/30"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated/60",
                )}
              >
                <item.icon size={16} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-line-divider">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 h-9 rounded-md text-[13px] text-ink-tertiary hover:text-ink-primary hover:bg-bg-elevated/60 transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span>Back to app</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 px-6 lg:px-8 flex items-center justify-between bg-bg-base/85 backdrop-blur-[6px] border-b border-line-divider">
          <div className="flex items-center gap-3">
            <Badge tone="short" pulsing>
              <ShieldAlert size={11} strokeWidth={2} />
              Admin mode
            </Badge>
            <span className="text-[12.5px] text-ink-tertiary">
              You are viewing privileged data. Act with care.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
            <span className="font-mono">{email}</span>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-8 py-8 fade-in">{children}</main>
      </div>
    </div>
  );
}
