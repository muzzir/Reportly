"use client";

import { createClient } from "@/lib/supabase/client";
import { clientSchema, updateClientSchema, ClientInput, UpdateClientInput } from "@/lib/validations/client";
import { Client } from "@/types";

export async function getClientsAction(): Promise<{ data?: Client[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data as Client[] };
}

export async function createClientAction(input: Partial<ClientInput>): Promise<{ data?: Client; error?: string }> {
  const supabase = createClient();

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Authentication required." };
  }

  // Get user agency membership
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  const agencyId = member?.agency_id;
  if (!agencyId) {
    return { error: "No active agency membership found." };
  }

  const parseResult = clientSchema.safeParse({ ...input, agency_id: agencyId });
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return { error: `${issue.path.join(".")}: ${issue.message}` };
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
}

export async function updateClientAction(
  clientId: string,
  input: UpdateClientInput
): Promise<{ data?: Client; error?: string }> {
  const supabase = createClient();

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
}

export async function deleteClientAction(clientId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
