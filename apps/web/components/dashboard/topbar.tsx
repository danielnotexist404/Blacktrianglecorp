"use client";

import { Bell } from "lucide-react";
import { PriceTicker } from "@/components/dashboard/price-ticker";
import { SymbolPicker } from "@/components/dashboard/symbol-picker";
import { UserMenu } from "@/components/dashboard/user-menu";
import { ModeIndicator } from "@/components/dashboard/mode-indicator";

export function TopBar({ userEmail }: { userEmail: string }) {
  return (
    <header className="sticky top-0 z-20 h-16 px-6 lg:px-8 flex items-center justify-between bg-bg-base/85 backdrop-blur-[6px] border-b border-line-divider">
      <div className="flex items-center gap-3">
        <SymbolPicker />
        <ModeIndicator />
      </div>

      <PriceTicker />

      <div className="flex items-center gap-2">
        <button className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-bg-elevated text-ink-secondary transition-colors relative">
          <Bell size={16} strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
