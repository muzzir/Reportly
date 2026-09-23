import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enforce Super Admin Security: Must be logged in and email must be in SUPER_ADMIN_EMAILS
  if (!user || !isSuperAdmin(user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Super Admin Top Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              Reportly <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30 uppercase">Super Admin</span>
            </span>
            <span className="text-[10px] text-slate-400">Internal Platform Management</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Logged in as <strong className="text-slate-200 font-semibold">{user.email}</strong>
          </span>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-800 gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Agency Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {children}
      </main>
    </div>
  );
}
