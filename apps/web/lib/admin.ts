import { createClient } from "@/lib/supabase/server";

/**
 * Returns true if the currently authenticated user's email is in the
 * Supabase admin_emails whitelist. Source of truth lives in the database;
 * editing that table promotes/demotes admins without a redeploy.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}
