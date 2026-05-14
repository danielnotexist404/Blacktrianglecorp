import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/dashboard");

  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
