"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export interface OnboardingData {
  agencyName: string;
  logoUrl?: string;
  primaryColor?: string;
  website?: string;
  clientName: string;
  clientIndustry?: string;
  timezone?: string;
  currency?: string;
}

/**
 * Completes onboarding for a new agency: updates agency profile, creates owner relationships, and inserts first client.
 */
export async function completeOnboardingAction(
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      agencyName,
      logoUrl,
      primaryColor = "#0F172A",
      website,
      clientName,
      clientIndustry = "General Marketing",
      timezone = "UTC",
      currency = "USD",
    } = data;

    if (!agencyName?.trim()) {
      return { success: false, error: "Agency name is required." };
    }

    if (!clientName?.trim()) {
      return { success: false, error: "First client name is required." };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required." };
    }

    // Use Admin Client to bypass bootstrapping RLS deadlocks for new agency creation
    const adminClient = createAdminClient();

    // 1. Retrieve or create Agency
    const { data: member } = await adminClient
      .from("agency_users")
      .select("agency_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let agencyId = member?.agency_id;

    if (!agencyId) {
      const { data: fallback } = await adminClient
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", user.id)
        .maybeSingle();

      agencyId = fallback?.agency_id;
    }

    if (!agencyId) {
      // Create new agency
      const { data: newAgency, error: createAgencyError } = await adminClient
        .from("agencies")
        .insert({
          name: agencyName.trim(),
          logo_url: logoUrl?.trim() || null,
          primary_color: primaryColor,
          website: website?.trim() || null,
          onboarding_completed: true,
        })
        .select("id")
        .single();

      if (createAgencyError || !newAgency) {
        console.error("Onboarding agency creation error:", createAgencyError);
        await logger.error("onboarding", `Agency creation failed: ${createAgencyError?.message}`);
        return { success: false, error: `Agency creation failed: ${createAgencyError?.message || "Unknown error"}` };
      }

      agencyId = newAgency.id;
    } else {
      // Update existing agency
      const { error: updateAgencyError } = await adminClient
        .from("agencies")
        .update({
          name: agencyName.trim(),
          logo_url: logoUrl?.trim() || null,
          primary_color: primaryColor,
          website: website?.trim() || null,
          onboarding_completed: true,
        })
        .eq("id", agencyId);

      if (updateAgencyError) {
        console.error("Onboarding agency update error:", updateAgencyError);
        await logger.error("onboarding", `Agency update failed: ${updateAgencyError.message}`);
        return { success: false, error: `Agency update failed: ${updateAgencyError.message}` };
      }
    }

    // 2. Ensure owner relationships in agency_users and agency_members
    const { error: userRelError } = await adminClient
      .from("agency_users")
      .upsert({
        agency_id: agencyId,
        user_id: user.id,
        role: "owner",
      }, { onConflict: "agency_id,user_id" });

    if (userRelError) {
      console.error("Onboarding agency_users upsert error:", userRelError);
    }

    const { error: memberRelError } = await adminClient
      .from("agency_members")
      .upsert({
        agency_id: agencyId,
        user_id: user.id,
        role: "owner",
      }, { onConflict: "agency_id,user_id" });

    if (memberRelError) {
      console.error("Onboarding agency_members upsert error:", memberRelError);
    }

    // 3. Create First Client
    const { error: clientError } = await adminClient.from("clients").insert({
      agency_id: agencyId,
      name: clientName.trim(),
      industry: clientIndustry.trim(),
      timezone,
      currency,
    });

    if (clientError) {
      console.error("Onboarding client creation error:", clientError);
      await logger.error("onboarding", `Client creation failed: ${clientError.message}`);
      return { success: false, error: `First client creation failed: ${clientError.message}` };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete onboarding.";
    console.error("Onboarding unhandled exception:", message);
    return { success: false, error: message };
  }
}
