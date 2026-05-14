import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Triangle } from "@/components/ui/triangle";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="px-6 lg:px-12 h-16 flex items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-ink-secondary hover:text-ink-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 -mt-16">
        <div className="w-full max-w-[400px]">
          <div className="flex flex-col items-center text-center">
            <Triangle size={56} className="text-ink-primary" />
            <h1 className="mt-6 font-display text-[28px] leading-tight">
              Sign in to BTG Trader
            </h1>
            <p className="mt-2 text-[14px] text-ink-secondary">
              Your keys never leave your control.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <Button variant="secondary" size="lg" className="w-full">
              <GoogleGlyph />
              Continue with Google
            </Button>

            <div className="relative py-2">
              <div className="h-px bg-line-divider" />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.1em] text-ink-tertiary">
                <span className="px-3 bg-bg-base">or</span>
              </span>
            </div>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                Email
              </span>
              <input
                type="email"
                placeholder="you@firm.com"
                className="mt-2 w-full h-11 px-3.5 rounded-md bg-bg-input border border-line text-ink-primary placeholder:text-ink-muted text-[14px] focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
              />
            </label>

            <Button variant="primary" size="lg" className="w-full">
              <Mail size={16} strokeWidth={1.5} />
              Send sign-in link
            </Button>
          </div>

          <p className="mt-10 text-center text-[12px] text-ink-tertiary leading-relaxed">
            By signing in you agree to the{" "}
            <Link href="/terms" className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/risk-disclosure" className="text-ink-secondary hover:text-ink-primary underline underline-offset-2">
              Risk Disclosure
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.93h5.5c-.24 1.46-1.7 4.28-5.5 4.28a6.41 6.41 0 0 1 0-12.82c2.03 0 3.39.86 4.17 1.6l2.84-2.74C17.18 2.78 14.84 1.8 12 1.8a10.2 10.2 0 1 0 0 20.4c5.89 0 9.78-4.13 9.78-9.95 0-.67-.07-1.18-.15-1.65H12z"
      />
    </svg>
  );
}
