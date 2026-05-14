"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Triangle } from "@/components/ui/triangle";
import { signIn } from "@/app/(auth)/actions";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell><div className="mt-10 h-72" /></LoginShell>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
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
          {children}
        </div>
      </main>
    </div>
  );
}

function LoginForm() {
  const search = useSearchParams();
  const next = search?.get("next") ?? "/dashboard";
  const initialError =
    search?.get("error") === "auth-callback-failed"
      ? "We could not confirm your email. Try signing in or signing up again."
      : null;

  const [error, setError] = useState<string | null>(initialError);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      formData.set("next", next);
      const result = await signIn(formData);
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <LoginShell>
      <form action={handleSubmit} className="mt-10 space-y-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@firm.com"
            className="mt-2 w-full h-11 px-3.5 rounded-md bg-bg-input border border-line text-ink-primary placeholder:text-ink-muted text-[14px] focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-2 w-full h-11 px-3.5 rounded-md bg-bg-input border border-line text-ink-primary placeholder:text-ink-muted text-[14px] focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
          />
        </label>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/[0.06] p-3 text-[12.5px] text-danger flex items-start gap-2 fade-in">
            <AlertCircle size={14} className="shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          <Mail size={16} strokeWidth={1.5} />
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-secondary">
        New to BTG Trader?{" "}
        <Link
          href="/signup"
          className="text-ink-primary underline underline-offset-2 hover:no-underline"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-8 text-center text-[12px] text-ink-tertiary leading-relaxed">
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
    </LoginShell>
  );
}
