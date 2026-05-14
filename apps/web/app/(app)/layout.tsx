import { redirect } from "next/navigation";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-bg-base">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar userEmail={user.email ?? ""} />
        <main className="flex-1 px-6 lg:px-8 py-8 fade-in">{children}</main>
      </div>
    </div>
  );
}
