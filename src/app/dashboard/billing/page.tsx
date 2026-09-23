import { createClient } from "@/lib/supabase/server";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ShieldAlert } from "lucide-react";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let agency = null;
  let userRole: string | null = null;
  let errorMessage: string | null = null;

  if (!user) {
    errorMessage = "Authentication required to view billing details.";
  } else {
    // Check agency_users first
    const { data: member } = await supabase
      .from("agency_users")
      .select("agency_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    let activeAgencyId = member?.agency_id;
    userRole = member?.role || null;

    if (!activeAgencyId) {
      const { data: fallback } = await supabase
        .from("agency_members")
        .select("agency_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      activeAgencyId = fallback?.agency_id;
      userRole = fallback?.role || null;
    }

    if (activeAgencyId) {
      const { data: agencyData } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", activeAgencyId)
        .single();

      agency = agencyData;
    } else {
      errorMessage = "No active agency membership found.";
    }
  }

  const isMember = userRole === "member";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Billing & Subscription Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your agency subscription tier, invoices, credit cards, and client scale limits.
        </p>
      </div>

      {errorMessage || !agency ? (
        <Card className="border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20 max-w-2xl">
          <CardContent className="flex items-center gap-3 p-0 text-red-900 dark:text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium">
              {errorMessage || "Failed to load agency billing details."}
            </p>
          </CardContent>
        </Card>
      ) : isMember ? (
        <Card className="border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20 max-w-2xl">
          <CardContent className="flex items-center gap-3 p-0 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm">Access Restricted</h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                You currently have the <strong className="capitalize">{userRole}</strong> role. Only agency Owners and Admins can view or manage subscription plans and billing settings.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <BillingDashboard agency={agency} />
      )}
    </div>
  );
}
