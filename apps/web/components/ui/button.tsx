import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium font-sans " +
  "transition-[background-color,border-color,box-shadow,transform] duration-150 " +
  "rounded-md tracking-[0.01em] active:scale-[0.98] disabled:opacity-50 " +
  "disabled:cursor-not-allowed select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover hover:shadow-glow",
  secondary:
    "bg-transparent text-ink-primary border border-line hover:bg-bg-elevated hover:border-line-strong",
  ghost:
    "bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated",
  danger:
    "bg-transparent text-danger border border-danger/30 hover:bg-danger/[0.08] hover:border-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
