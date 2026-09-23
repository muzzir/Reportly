import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Retrieve user's agency membership and onboarding status
    const { data: member } = await supabase
      .from("agency_users")
      .select("agency_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let activeAgencyId = member?.agency_id;

    if (!activeAgencyId) {
      const { data: fallback } = await supabase
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", user.id)
        .maybeSingle();

      activeAgencyId = fallback?.agency_id;
    }

    if (activeAgencyId) {
      const { data: agency } = await supabase
        .from("agencies")
        .select("onboarding_completed")
        .eq("id", activeAgencyId)
        .single();

      if (agency && agency.onboarding_completed === false) {
        redirect("/onboarding");
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
