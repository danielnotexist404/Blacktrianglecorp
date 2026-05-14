"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Triangle } from "@/components/ui/triangle";
import { signUp } from "@/app/(auth)/actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result.ok) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
    });
  }

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
              Create your account
            </h1>
            <p className="mt-2 text-[14px] text-ink-secondary">
              Paper-trade first. Live execution unlocks per user after 60 days.
            </p>
          </div>

          {success ? (
            <div className="mt-10 rounded-card border border-success/30 bg-success/[0.06] p-5 flex flex-col items-center text-center fade-in">
              <div className="w-12 h-12 rounded-full bg-success/[0.10] border border-success/30 flex items-center justify-center text-success">
                <MailCheck size={20} strokeWidth={1.5} />
              </div>
              <h2 className="mt-4 text-[15px] font-medium text-ink-primary">
                Check your inbox
              </h2>
              <p className="mt-2 text-[13px] text-ink-secondary leading-relaxed">
                {success}
              </p>
              <Link
                href="/login"
                className="mt-6 text-[13px] text-ink-secondary hover:text-ink-primary underline underline-offset-2"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
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
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="mt-2 w-full h-11 px-3.5 rounded-md bg-bg-input border border-line text-ink-primary placeholder:text-ink-muted text-[14px] focus:border-accent focus:outline-none focus:shadow-ring transition-[border-color,box-shadow] duration-150"
                />
                <span className="mt-1.5 block text-[11.5px] text-ink-tertiary">
                  Minimum 8 characters. Pick something you don&apos;t use elsewhere.
                </span>
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
                {pending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-[13px] text-ink-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-ink-primary underline underline-offset-2 hover:no-underline"
              >
                Sign in
              </Link>
            </p>
          )}

          <p className="mt-8 text-center text-[12px] text-ink-tertiary leading-relaxed">
            By creating an account you agree to the{" "}
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
