import { createClient } from "@/lib/supabase/server";
import { AgencySettingsForm } from "@/components/settings/AgencySettingsForm";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let agency = null;
  let errorMessage: string | null = null;

  if (!user) {
    errorMessage = "Authentication required to view settings.";
  } else {
    // Get user agency membership
    const { data: member } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    if (member?.agency_id) {
      const { data: agencyData } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", member.agency_id)
        .single();

      agency = agencyData;
    } else {
      errorMessage = "No active agency membership found.";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Agency Settings & Branding
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize your agency profile, upload your logo, and select brand colors for dynamic white-labeled reports.
        </p>
      </div>

      {errorMessage || !agency ? (
        <Card className="border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20 max-w-2xl">
          <CardContent className="flex items-center gap-3 p-0 text-red-900 dark:text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
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
