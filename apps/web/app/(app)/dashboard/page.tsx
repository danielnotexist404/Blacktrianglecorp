import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let apiKeyCount = 0;
  if (user) {
    const { count } = await supabase
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("revoked_at", null);
    apiKeyCount = count ?? 0;
  }

  return <DashboardView hasApiKey={apiKeyCount > 0} />;
}
