"use client";

import { createClient } from "@/lib/supabase/client";
import { Integration, IntegrationProvider } from "@/types";

/**
 * Fetches all integrations connected for a specific client.
 * Sanitizes sensitive access and refresh tokens before sending to the client UI.
 */
export async function getClientIntegrationsAction(
  clientId: string
): Promise<{ data?: Integration[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Never return raw access/refresh tokens to browser
  const sanitized = (data || []).map((item) => ({
    ...item,
    access_token: item.access_token ? "[ENCRYPTED]" : null,
    refresh_token: item.refresh_token ? "[ENCRYPTED]" : null,
  }));

  return { data: sanitized as Integration[] };
}

/**
 * Fetches all integrations for the active agency across all clients.
 */
export async function getIntegrationsAction(): Promise<{ data?: Integration[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const sanitized = (data || []).map((item) => ({
    ...item,
    access_token: item.access_token ? "[ENCRYPTED]" : null,
    refresh_token: item.refresh_token ? "[ENCRYPTED]" : null,
  }));

  return { data: sanitized as Integration[] };
}

/**
 * Revokes and deletes an integration credentials record.
 */
export async function disconnectIntegrationAction(
  integrationId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("integrations").delete().eq("id", integrationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteIntegrationAction(
  integrationId: string
): Promise<{ success?: boolean; error?: string }> {
  return disconnectIntegrationAction(integrationId);
}

/**
 * Fallback action to directly connect an integration with encrypted mock credentials.
 */
export async function connectIntegrationAction(
  provider: IntegrationProvider,
  externalAccountId: string,
  clientId?: string
): Promise<{ data?: Integration; error?: string }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Authentication required." };
  }

  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  const agencyId = member?.agency_id;
  if (!agencyId) {
    return { error: "No active agency membership found." };
  }

  // Simulated tokens encrypted with AES-256-GCM via encryption module
  const { encrypt } = await import("@/lib/security/encryption");
  const rawAccessToken = `oauth_access_token_${provider}_${Date.now()}`;
  const rawRefreshToken = `oauth_refresh_token_${provider}_${Date.now()}`;

  const encryptedAccessToken = encrypt(rawAccessToken);
  const encryptedRefreshToken = encrypt(rawRefreshToken);

  const { data, error } = await supabase
    .from("integrations")
    .insert({
      agency_id: agencyId,
      client_id: clientId || null,
      provider,
      external_account_id: externalAccountId,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 30).toISOString(),
      metadata: {
        account_name: `${provider.toUpperCase()} Direct Connection`,
        email: user.email || "agency@reportly.app",
        connected_by: user.id,
        connected_at: new Date().toISOString(),
        encryption_status: "AES-256-GCM",
        status: "active",
      },
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return {
    data: {
      ...data,
      access_token: "[ENCRYPTED]",
      refresh_token: "[ENCRYPTED]",
    } as Integration,
  };
}
