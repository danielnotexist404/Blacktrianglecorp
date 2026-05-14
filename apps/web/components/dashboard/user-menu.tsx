"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, User, KeyRound, Settings, LogOut, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMode } from "@/lib/mode";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useMode();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    router.push("/login");
  }

  const email = "support@secureops.co.il";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 h-9 pl-2 pr-3 rounded-md transition-colors",
          open ? "bg-bg-elevated" : "hover:bg-bg-elevated",
        )}
      >
        <div className="w-7 h-7 rounded-full bg-bg-elevated border border-line-subtle flex items-center justify-center text-[11px] uppercase tracking-wider text-ink-secondary">
          {initials}
        </div>
        <div className="hidden xl:flex flex-col leading-tight text-left">
          <span className="text-[12.5px] text-ink-primary">{email}</span>
          <span className="text-[10.5px] text-ink-tertiary uppercase tracking-[0.06em]">
            {mode === "demo" ? "Demo mode" : "Live mode"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-ink-tertiary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-64 bg-bg-overlay border border-line-subtle rounded-card shadow-2xl shadow-black/60 overflow-hidden fade-in">
          {/* Identity block */}
          <div className="px-4 py-3.5 border-b border-line-divider">
            <div className="text-[13.5px] font-medium text-ink-primary truncate">{email}</div>
            <div className="text-[11.5px] text-ink-tertiary mt-0.5 uppercase tracking-[0.06em]">
              Signed in
            </div>
          </div>

          {/* Mode picker */}
          <div className="px-3 py-3 border-b border-line-divider">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary mb-2 px-1">
              Trading mode
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <ModePill
                label="Demo"
                hint="Bybit testnet"
                active={mode === "demo"}
                onClick={() => setMode("demo")}
              />
              <ModePill
                label="Live"
                hint="Bybit mainnet"
                active={mode === "live"}
                onClick={() => setMode("live")}
                accent
              />
            </div>
          </div>

          {/* Links */}
          <div className="py-1.5">
            <MenuItem icon={<User size={14} strokeWidth={1.5} />} href="/settings" onClick={() => setOpen(false)}>
              Profile
            </MenuItem>
            <MenuItem icon={<KeyRound size={14} strokeWidth={1.5} />} href="/keys" onClick={() => setOpen(false)}>
              API keys
            </MenuItem>
            <MenuItem icon={<Settings size={14} strokeWidth={1.5} />} href="/settings" onClick={() => setOpen(false)}>
              Settings
            </MenuItem>
          </div>

          <div className="border-t border-line-divider py-1.5">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors text-left"
            >
              <LogOut size={14} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModePill({
  label,
  hint,
  active,
  onClick,
  accent = false,
}: {
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-2 text-left border transition-colors",
        active
          ? accent
            ? "border-accent/50 bg-accent/[0.08]"
            : "border-success/40 bg-success/[0.08]"
          : "border-line-subtle bg-bg-base hover:bg-bg-elevated",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[12.5px] font-semibold",
            active && accent && "text-accent",
            active && !accent && "text-success",
            !active && "text-ink-primary",
          )}
        >
          {label}
        </span>
        {active && (
          <Check
            size={12}
            strokeWidth={2}
            className={cn(accent ? "text-accent" : "text-success")}
          />
        )}
      </div>
      <div className="text-[10.5px] text-ink-tertiary mt-0.5">{hint}</div>
    </button>
  );
}

function MenuItem({
  icon,
  children,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-[13px] text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
