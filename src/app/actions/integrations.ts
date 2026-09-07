"use client";

import { createClient } from "@/lib/supabase/client";
import { encryptToken } from "@/lib/security/crypto";
import { Integration, IntegrationProvider } from "@/types";

export async function getIntegrationsAction(): Promise<{ data?: Integration[]; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Never return raw access tokens to client
  const sanitizedIntegrations = (data || []).map((item) => ({
    ...item,
    access_token: item.access_token ? "[ENCRYPTED]" : null,
    refresh_token: item.refresh_token ? "[ENCRYPTED]" : null,
  }));

  return { data: sanitizedIntegrations as Integration[] };
}

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

  // Simulate OAuth token exchange & encrypt credentials at rest before storing
  const rawAccessToken = `oauth_access_token_${provider}_${Date.now()}`;
  const rawRefreshToken = `oauth_refresh_token_${provider}_${Date.now()}`;

  const encryptedAccessToken = encryptToken(rawAccessToken);
  const encryptedRefreshToken = encryptToken(rawRefreshToken);

  const { data, error } = await supabase
    .from("integrations")
    .insert({
      agency_id: agencyId,
      client_id: clientId || null,
      provider,
      external_account_id: externalAccountId,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 30).toISOString(), // 30 days
      metadata: {
        connected_by: user.id,
        connected_at: new Date().toISOString(),
        encryption_status: "AES-256-GCM",
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

export async function deleteIntegrationAction(integrationId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("integrations").delete().eq("id", integrationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
