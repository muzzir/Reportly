import { createClient } from "@/lib/supabase/server";
import { decrypt, encrypt } from "@/lib/security/encryption";
import { OAUTH_PROVIDERS } from "@/lib/oauth/config";
import { IntegrationProvider } from "@/types";

export interface ValidTokenResult {
  accessToken?: string;
  provider?: IntegrationProvider;
  externalAccountId?: string;
  error?: string;
}

/**
 * Retrieves a valid, decrypted access token for an integration.
 * Automatically handles token expiration checks and refreshes expired tokens.
 */
export async function getValidAccessToken(
  integrationId: string
): Promise<ValidTokenResult> {
  const supabase = await createClient();

  // 1. Fetch integration from Supabase
  const { data: integration, error: fetchError } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (fetchError || !integration) {
    return { error: `Integration not found: ${fetchError?.message || "Invalid ID"}` };
  }

  // 2. Decrypt access and refresh tokens
  const rawAccessToken = decrypt(integration.access_token || "");
  const rawRefreshToken = decrypt(integration.refresh_token || "");

  if (!rawAccessToken && !rawRefreshToken) {
    return { error: `Failed to decrypt OAuth tokens for integration ${integrationId}` };
  }

  // 3. Check token expiration (with 1-minute buffer)
  const isExpired = integration.expires_at
    ? new Date(integration.expires_at).getTime() < Date.now() + 60 * 1000
    : false;

  if (!isExpired && rawAccessToken) {
    return {
      accessToken: rawAccessToken,
      provider: integration.provider,
      externalAccountId: integration.external_account_id || undefined,
    };
  }

  // 4. Token is expired — Refresh access token
  console.log(`OAuth token for integration ${integrationId} (${integration.provider}) is expired. Refreshing...`);

  let newRawAccessToken = "";
  let newRawRefreshToken = rawRefreshToken;
  let expiresInSeconds = 3600 * 24 * 30; // 30 days default

  if (process.env.MOCK_OAUTH === "true" || process.env.MOCK_EXTERNAL_APIS !== "false") {
    // Developer Mock Mode token refresh
    newRawAccessToken = `mock_refreshed_access_token_${integration.provider}_${Date.now()}`;
    newRawRefreshToken = rawRefreshToken || `mock_refreshed_refresh_token_${integration.provider}_${Date.now()}`;
  } else {
    // Live OAuth Token Refresh
    const providerConfig = OAUTH_PROVIDERS[integration.provider];
    if (!providerConfig) {
      return { error: `Unsupported provider: ${integration.provider}` };
    }

    const clientIdEnv = process.env[providerConfig.clientIdEnv] || "";
    const clientSecretEnv = process.env[providerConfig.clientSecretEnv] || "";

    if (!rawRefreshToken) {
      return { error: "No refresh token available to refresh expired access token." };
    }

    try {
      const refreshResponse = await fetch(providerConfig.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientIdEnv,
          client_secret: clientSecretEnv,
          refresh_token: rawRefreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        const errText = await refreshResponse.text();
        console.error(`Token refresh failed for ${integration.provider}:`, errText);
        return { error: `Token refresh failed: ${errText}` };
      }

      const tokenData = await refreshResponse.json();
      newRawAccessToken = tokenData.access_token || "";
      if (tokenData.refresh_token) {
        newRawRefreshToken = tokenData.refresh_token;
      }
      if (tokenData.expires_in) {
        expiresInSeconds = tokenData.expires_in;
      }
    } catch (err) {
      console.error(`Error refreshing OAuth token for ${integration.provider}:`, err);
      return { error: "Unexpected network error during token refresh." };
    }
  }

  // 5. Encrypt new tokens and save back to database
  const encryptedNewAccessToken = encrypt(newRawAccessToken);
  const encryptedNewRefreshToken = encrypt(newRawRefreshToken);
  const newExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const existingMetadata = (integration.metadata as Record<string, unknown>) || {};

  const { error: updateError } = await supabase
    .from("integrations")
    .update({
      access_token: encryptedNewAccessToken,
      refresh_token: encryptedNewRefreshToken,
      expires_at: newExpiresAt,
      metadata: {
        ...existingMetadata,
        last_refreshed_at: new Date().toISOString(),
        status: "active",
      },
    })
    .eq("id", integrationId);

  if (updateError) {
    console.error(`Failed to save refreshed token for integration ${integrationId}:`, updateError.message);
  }

  return {
    accessToken: newRawAccessToken,
    provider: integration.provider,
    externalAccountId: integration.external_account_id || undefined,
  };
}
