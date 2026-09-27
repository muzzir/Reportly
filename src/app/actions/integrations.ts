"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getOrHealUserAgencyId } from "@/lib/supabase/agency-helper";
import { OAUTH_PROVIDERS, encodeOAuthState, getOAuthRedirectUri } from "@/lib/oauth/config";
import { Integration, IntegrationProvider } from "@/types";
import { getAppBaseUrl } from "@/lib/utils/url";

/**
 * Fetches all integrations connected for a specific client.
 * Sanitizes sensitive access and refresh tokens before sending to the client UI.
 */
export async function getClientIntegrationsAction(
  clientId: string
): Promise<{ data?: Integration[]; error?: string }> {
  try {
    const supabase = await createClient();
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
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch client integrations." };
  }
}

/**
 * Fetches all integrations for the active agency across all clients.
 */
export async function getIntegrationsAction(): Promise<{ data?: Integration[]; error?: string }> {
  try {
    const supabase = await createClient();
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
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to fetch integrations." };
  }
}

/**
 * Revokes and deletes an integration credentials record.
 */
export async function disconnectIntegrationAction(
  integrationId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("integrations").delete().eq("id", integrationId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to disconnect integration." };
  }
}

export async function deleteIntegrationAction(
  integrationId: string
): Promise<{ success?: boolean; error?: string }> {
  return disconnectIntegrationAction(integrationId);
}

/**
 * Connect an integration by constructing a real OAuth 2.0 authorization URL and redirecting.
 */
export async function connectIntegrationAction(
  provider: IntegrationProvider,
  externalAccountId?: string,
  clientId?: string
): Promise<{ data?: Integration; error?: string }> {
  try {
    const providerConfig = OAUTH_PROVIDERS[provider];
    if (!providerConfig) {
      return { error: "Invalid integration provider." };
    }

    // Environment variable guard
    const clientIdEnv = process.env[providerConfig.clientIdEnv];
    if (!clientIdEnv) {
      return {
        error: "OAuth Client ID not configured. Please add this to your environment variables.",
      };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Authentication required." };
    }

    const agencyId = await getOrHealUserAgencyId(user.id);
    if (!agencyId) {
      return { error: "No active agency membership found." };
    }

    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("agency_id")
        .eq("id", clientId)
        .single();

      if (!client || client.agency_id !== agencyId) {
        return { error: "Client does not belong to your agency." };
      }
    }

    // Generate CSRF token & state payload
    const csrfToken = crypto.randomBytes(16).toString("hex");
    const statePayload = {
      csrfToken,
      clientId: clientId || "",
      provider,
      timestamp: Date.now(),
    };

    const encodedState = encodeOAuthState(statePayload);
    const callbackUrl = getOAuthRedirectUri(provider);

    const authUrl = new URL(providerConfig.authUrl);
    authUrl.searchParams.set("client_id", clientIdEnv);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", providerConfig.scopes.join(" "));
    authUrl.searchParams.set("state", encodedState);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    const cookieStore = await cookies();
    cookieStore.set("oauth_csrf_token", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    redirect(authUrl.toString());
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      error: err instanceof Error ? err.message : "Failed to initiate OAuth authorization flow.",
    };
  }
}
