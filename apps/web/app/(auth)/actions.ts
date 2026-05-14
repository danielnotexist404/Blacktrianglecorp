"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  ok: boolean;
  message: string;
};

function safeNext(value: string | null): string {
  if (!value) return "/dashboard";
  // Only allow same-origin relative paths to prevent open redirects.
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;
  const next = safeNext(formData.get("next") as string | null);

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns "Invalid login credentials" for bad email/password.
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        ok: false,
        message:
          "Please confirm your email first. Check your inbox for the confirmation link.",
      };
    }
    return { ok: false, message: "Invalid email or password." };
  }

  redirect(next);
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  const origin = await originFromHeaders();
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return {
        ok: false,
        message: "An account with this email already exists. Try signing in.",
      };
    }
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message:
      "Account created. Check your email — we sent a confirmation link to activate it.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
