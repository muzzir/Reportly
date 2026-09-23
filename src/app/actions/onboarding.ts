"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
 * Completes onboarding for a new agency: updates agency profile, creates first client, and sets onboarding_completed = true.
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

    // Retrieve active agency membership
    const { data: member } = await supabase
      .from("agency_users")
      .select("agency_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let agencyId = member?.agency_id;

    if (!agencyId) {
      const { data: fallback } = await supabase
        .from("agency_members")
        .select("agency_id")
        .eq("user_id", user.id)
        .maybeSingle();

      agencyId = fallback?.agency_id;
    }

    if (!agencyId) {
      // Create new agency if none exists
      const { data: newAgency, error: createError } = await supabase
        .from("agencies")
        .insert({
          name: agencyName.trim(),
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          website: website || null,
          onboarding_completed: true,
        })
        .select()
        .single();

      if (createError || !newAgency) {
        return { success: false, error: "Failed to create agency profile." };
      }

      agencyId = newAgency.id;

      // Associate user
      await supabase.from("agency_users").insert({
        agency_id: agencyId,
        user_id: user.id,
        role: "owner",
      });
    } else {
      // Update existing agency profile
      const { error: updateError } = await supabase
        .from("agencies")
        .update({
          name: agencyName.trim(),
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          website: website || null,
          onboarding_completed: true,
        })
        .eq("id", agencyId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    // Create First Client
    const { error: clientError } = await supabase.from("clients").insert({
      agency_id: agencyId,
      name: clientName.trim(),
      industry: clientIndustry.trim(),
      timezone,
      currency,
    });

    if (clientError) {
      console.error("Client creation during onboarding failed:", clientError);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to complete onboarding.";
    return { success: false, error: message };
  }
}
