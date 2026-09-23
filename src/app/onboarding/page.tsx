import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  let agencyName = user.user_metadata?.agency_name || "";

  if (activeAgencyId) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("name, onboarding_completed")
      .eq("id", activeAgencyId)
      .single();

    if (agency?.onboarding_completed) {
      redirect("/dashboard");
    }

    if (agency?.name) {
      agencyName = agency.name;
    }
  }

  return <OnboardingWizard defaultAgencyName={agencyName} />;
}
