"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";
import { verifyBybitKey, type BybitMode } from "@/lib/bybit";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function connectKey(formData: FormData): Promise<ActionResult> {
  const apiKey = (formData.get("api_key") as string | null)?.trim() ?? "";
  const apiSecret = (formData.get("api_secret") as string | null)?.trim() ?? "";
  const mode = formData.get("mode") as BybitMode | null;
  const labelInput = (formData.get("label") as string | null)?.trim();

  if (!apiKey || !apiSecret) {
    return { ok: false, message: "API key and secret are required." };
  }
  if (mode !== "demo" && mode !== "live") {
    return { ok: false, message: "Invalid environment." };
  }

  // 1. Verify with Bybit (rejects Withdraw, rejects invalid keys).
  const verification = await verifyBybitKey(apiKey, apiSecret, mode);
  if (!verification.ok) {
    return { ok: false, message: verification.error };
  }

  // 2. Get the signed-in user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  // 3. Encrypt the secret with the server-held key.
  let encrypted: string;
  try {
    encrypted = await encryptSecret(apiSecret);
  } catch (e) {
    return {
      ok: false,
      message:
        e instanceof Error
          ? `Encryption failed: ${e.message}`
          : "Encryption failed.",
    };
  }

  const label = labelInput && labelInput.length > 0
    ? labelInput
    : (mode === "demo" ? "Demo account" : "Main account");

  // 4. Insert (RLS enforces user_id = auth.uid()).
  const { error } = await supabase.from("api_keys").insert({
    user_id: user.id,
    exchange: "bybit",
    mode,
    label,
    api_key: apiKey,
    api_secret_encrypted: encrypted,
    permissions: verification.permissions,
  });

  if (error) {
    return { ok: false, message: `Database error: ${error.message}` };
  }

  revalidatePath("/keys");
  return { ok: true, message: "Key connected." };
}

export async function revokeKey(keyId: string): Promise<ActionResult> {
  if (!keyId) return { ok: false, message: "Missing key id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: `Database error: ${error.message}` };
  }

  revalidatePath("/keys");
  return { ok: true, message: "Key revoked." };
}
