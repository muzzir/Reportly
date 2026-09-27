import { createClient } from "@/lib/supabase/server";
import { getOrHealUserAgencyId } from "@/lib/supabase/agency-helper";
import { AgencySettingsForm } from "@/components/settings/AgencySettingsForm";
import { SettingsNavTabs } from "@/components/settings/SettingsNavTabs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let agency = null;
  let userRole: string | null = "owner";
  let errorMessage: string | null = null;

  if (!user) {
    errorMessage = "Authentication required to view settings.";
  } else {
    const activeAgencyId = await getOrHealUserAgencyId(user.id);

    if (activeAgencyId) {
      const { data: agencyData } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", activeAgencyId)
        .maybeSingle();

      agency = agencyData;

      const { data: userRoleData } = await supabase
        .from("agency_users")
        .select("role")
        .eq("agency_id", activeAgencyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRoleData?.role) {
        userRole = userRoleData.role;
      }
    } else {
      errorMessage = "No active agency membership found.";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Agency Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize your agency profile, upload your logo, and select brand colors for dynamic white-labeled reports.
        </p>
      </div>

      <SettingsNavTabs userRole={userRole} />

      {errorMessage || !agency ? (
        <Card className="border-destructive/30 bg-destructive/10 p-6 max-w-2xl">
          <CardContent className="flex items-center gap-3 p-0 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {errorMessage || "Failed to load agency settings."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <AgencySettingsForm agency={agency} />
      )}
    </div>
  );
}
