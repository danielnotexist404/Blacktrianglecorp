import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-line-subtle rounded-card",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  right,
  className,
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 pt-5 pb-4 border-b border-line-divider",
        className,
      )}
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
        {title}
      </h2>
      {right}
    </div>
  );
}

export function CardBody({ className, ...rest }: CardProps) {
  return <div className={cn("p-6", className)} {...rest} />;
}
