import { cn } from "@/lib/utils";

type TriangleProps = {
  size?: number;
  withArrow?: boolean;
  className?: string;
};

export function Triangle({ size = 32, withArrow = true, className }: TriangleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-hidden
    >
      <path d="M32 6 L60 56 L4 56 Z" fill="currentColor" />
      {withArrow && (
        <path
          d="M32 22 L42 42 L36 42 L36 50 L28 50 L28 42 L22 42 Z"
          fill="#DC2626"
        />
      )}
    </svg>
  );
}

export function TriangleOutline({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-hidden
    >
      <path
        d="M32 6 L60 56 L4 56 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
