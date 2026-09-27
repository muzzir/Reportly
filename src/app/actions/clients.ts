"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrHealUserAgencyId } from "@/lib/supabase/agency-helper";
import { clientSchema, updateClientSchema, ClientInput, UpdateClientInput } from "@/lib/validations/client";
import { Client } from "@/types";

export async function getClientsAction(): Promise<{ data?: Client[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data as Client[] };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch clients." };
  }
}

export async function createClientAction(input: Partial<ClientInput>): Promise<{ data?: Client; error?: string }> {
  try {
    const supabase = await createClient();

    // Get authenticated user session on server
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Authentication required." };
    }

    // Resolve or auto-heal active agency membership
    const agencyId = await getOrHealUserAgencyId(user.id);

    if (!agencyId) {
      return { error: "No active agency membership found." };
    }

    const parseResult = clientSchema.safeParse({ ...input, agency_id: agencyId });
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return { error: `${issue.path.join(".")}: ${issue.message}` };
    }

    // Enforce Plan Tier limits (Normal plan: up to 3 clients; Pro plan: unlimited)
    const { data: agency } = await supabase
      .from("agencies")
      .select("plan_tier, plan_status")
      .eq("id", agencyId)
      .maybeSingle();

    const isPro = agency?.plan_tier === "pro";

    if (!isPro) {
      const { count, error: countError } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      if (!countError && (count || 0) >= 3) {
        return {
          error:
            "Normal Plan Limit Reached: You can add up to 3 clients. Please upgrade to Pro to add unlimited clients.",
        };
      }
    }

    const { data, error } = await supabase
      .from("clients")
      .insert(parseResult.data)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Client };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create client." };
  }
}

export async function updateClientAction(
  clientId: string,
  input: UpdateClientInput
): Promise<{ data?: Client; error?: string }> {
  try {
    const supabase = await createClient();

    const parseResult = updateClientSchema.safeParse(input);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return { error: `${issue.path.join(".")}: ${issue.message}` };
    }

    const { data, error } = await supabase
      .from("clients")
      .update(parseResult.data)
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Client };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update client." };
  }
}

export async function deleteClientAction(clientId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete client." };
  }
}

export async function updateClientAutomationAction(
  clientId: string,
  auto_report_enabled: boolean,
  auto_report_emails: string[]
): Promise<{ data?: Client; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clients")
      .update({
        auto_report_enabled,
        auto_report_emails,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Client };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update automation settings." };
  }
}

export async function updateClientShareStatusAction(
  clientId: string,
  is_public_sharing_enabled: boolean
): Promise<{ data?: Client; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clients")
      .update({
        is_public_sharing_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Client };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update share status." };
  }
}

export async function regeneratePublicTokenAction(
  clientId: string
): Promise<{ data?: Client; error?: string }> {
  try {
    const supabase = await createClient();
    const newPublicToken = crypto.randomUUID();

    const { data, error } = await supabase
      .from("clients")
      .update({
        public_token: newPublicToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Client };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to regenerate public token." };
  }
}
