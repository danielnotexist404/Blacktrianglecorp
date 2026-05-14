"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

export type AdminResult = { ok: boolean; message: string };

const TIERS = ["free", "starter", "pro", "max", "ultra"] as const;
type Tier = (typeof TIERS)[number];

async function requireAdmin(): Promise<AdminResult | null> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { ok: false, message: "Not authorised." };
  return null;
}

export async function setUserTier(userId: string, tier: string): Promise<AdminResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!TIERS.includes(tier as Tier)) {
    return { ok: false, message: "Invalid tier." };
  }
  if (!userId) return { ok: false, message: "Missing user id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", userId);
  if (error) return { ok: false, message: `DB error: ${error.message}` };
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { ok: true, message: "Tier updated." };
}

export async function revokeUserKey(keyId: string): Promise<AdminResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!keyId) return { ok: false, message: "Missing key id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId);
  if (error) return { ok: false, message: `DB error: ${error.message}` };
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/keys");
  return { ok: true, message: "Key revoked." };
}
