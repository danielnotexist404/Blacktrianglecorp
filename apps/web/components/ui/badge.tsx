import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "live" | "paper" | "closed" | "long" | "short" | "info";

const tones: Record<Tone, string> = {
  live: "text-success bg-success/[0.08] border-success/20",
  paper: "text-warning bg-warning/[0.08] border-warning/20",
  closed: "text-ink-tertiary bg-bg-elevated border-line-subtle",
  long: "text-success bg-success/[0.08] border-success/20",
  short: "text-danger bg-danger/[0.08] border-danger/30",
  info: "text-info bg-info/[0.08] border-info/20",
};

export function Badge({
  tone = "info",
  children,
  pulsing = false,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  pulsing?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border " +
          "text-[10.5px] font-semibold uppercase tracking-[0.06em]",
        tones[tone],
        className,
      )}
    >
      {pulsing && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full bg-current animate-pulseDot",
          )}
        />
      )}
      {children}
    </span>
  );
}
