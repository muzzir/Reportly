import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_PROVIDERS, decodeOAuthState } from "@/lib/oauth/config";
import { oauthCallbackSchema } from "@/lib/validations/oauth";
import { encrypt } from "@/lib/security/encryption";
import { IntegrationProvider } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = providerParam as IntegrationProvider;

  const providerConfig = OAUTH_PROVIDERS[provider];
  if (!providerConfig) {
    return NextResponse.json({ error: "Invalid integration provider" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // 1. Extract & validate callback parameters using Zod
  const searchParamsObj = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = oauthCallbackSchema.safeParse(searchParamsObj);

  if (!parseResult.success) {
    console.error("OAuth callback Zod validation failed:", parseResult.error.issues);
    return NextResponse.redirect(`${baseUrl}/dashboard/clients?error=invalid_callback_params`);
  }

  const { code, state, error: oauthError, error_description } = parseResult.data;

  // Decode state payload to retrieve target clientId even if user cancelled
  const statePayload = decodeOAuthState(state);
  const clientId = statePayload?.clientId;
  const redirectTarget = clientId
    ? `${baseUrl}/dashboard/clients/${clientId}/integrations`
    : `${baseUrl}/dashboard/integrations`;

  // 2. Handle user cancellation or provider error
  if (oauthError) {
    console.warn(`OAuth flow cancelled or error returned by ${provider}:`, oauthError, error_description);
    const response = NextResponse.redirect(`${redirectTarget}?error=oauth_cancelled`);
    response.cookies.delete("oauth_csrf_token");
    return response;
  }

  // 3. CSRF Verification & State Integrity
  const cookieCsrfToken = request.cookies.get("oauth_csrf_token")?.value;

  if (!statePayload || !cookieCsrfToken || statePayload.csrfToken !== cookieCsrfToken) {
    console.error("CSRF attack or invalid OAuth state detected:", {
      statePayloadValid: !!statePayload,
      cookieCsrfTokenMatch: statePayload?.csrfToken === cookieCsrfToken,
    });
    const response = NextResponse.redirect(`${redirectTarget}?error=invalid_state`);
    response.cookies.delete("oauth_csrf_token");
    return response;
  }

  if (!clientId) {
    console.error("Missing clientId in OAuth state payload.");
    const response = NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=invalid_client`);
    response.cookies.delete("oauth_csrf_token");
    return response;
  }

  if (statePayload.provider !== provider) {
    console.error("Provider mismatch in OAuth state.");
    return NextResponse.redirect(`${redirectTarget}?error=provider_mismatch`);
  }

  // 4. Verify Authenticated User & Agency Membership
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  if (!member?.agency_id) {
    return NextResponse.redirect(`${redirectTarget}?error=no_agency_access`);
  }

  const agencyId = member.agency_id;

  // 5. Token Exchange / Developer Mock Mode
  let rawAccessToken = "";
  let rawRefreshToken = "";
  let externalAccountId = "";
  let accountName = "";
  let accountEmail = "";
  let expiresInSeconds = 3600 * 24 * 30; // 30 days default

  if (process.env.MOCK_OAUTH === "true") {
    // Simulated successful OAuth token exchange
    rawAccessToken = `mock_access_token_${provider}_${Date.now()}`;
    rawRefreshToken = `mock_refresh_token_${provider}_${Date.now()}`;

    const mockDetails: Record<IntegrationProvider, { name: string; email: string; extId: string }> = {
      google_ads: {
        name: "Google Ads Account (Client Main)",
        email: "ads-manager@agency.com",
        extId: "123-456-7890",
      },
      meta_ads: {
        name: "Meta Ads Account (Client Business)",
        email: "facebook-ads@agency.com",
        extId: "act_9876543210",
      },
      ga4: {
        name: "GA4 Property - Main Store",
        email: "analytics@agency.com",
        extId: "properties/314159265",
      },
    };

    const details = mockDetails[provider];
    accountName = details.name;
    accountEmail = details.email;
    externalAccountId = details.extId;
  } else {
    // Live OAuth Token Exchange
    if (!code) {
      return NextResponse.redirect(`${redirectTarget}?error=missing_auth_code`);
    }

    try {
      const clientIdEnv = process.env[providerConfig.clientIdEnv] || "";
      const clientSecretEnv = process.env[providerConfig.clientSecretEnv] || "";
      const callbackUrl = `${baseUrl}/api/integrations/${provider}/callback`;

      const tokenResponse = await fetch(providerConfig.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientIdEnv,
          client_secret: clientSecretEnv,
          code,
          grant_type: "authorization_code",
          redirect_uri: callbackUrl,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error(`Token exchange failed for ${provider}:`, errText);
        return NextResponse.redirect(`${redirectTarget}?error=token_exchange_failed`);
      }

      const tokenData = await tokenResponse.json();
      rawAccessToken = tokenData.access_token || "";
      rawRefreshToken = tokenData.refresh_token || "";
      if (tokenData.expires_in) {
        expiresInSeconds = tokenData.expires_in;
      }

      externalAccountId = `act_${provider}_${Date.now()}`;
      accountName = `${providerConfig.name} Account`;
      accountEmail = user.email || "connected@agency.com";
    } catch (err) {
      console.error(`Unexpected error during OAuth callback for ${provider}:`, err);
      return NextResponse.redirect(`${redirectTarget}?error=oauth_processing_error`);
    }
  }

  // 6. Encrypt Tokens at Rest using AES-256-GCM
  const encryptedAccessToken = encrypt(rawAccessToken);
  const encryptedRefreshToken = encrypt(rawRefreshToken);

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const metadata = {
    account_name: accountName,
    email: accountEmail,
    connected_by: user.id,
    connected_at: new Date().toISOString(),
    encryption_status: "AES-256-GCM",
    status: "active",
  };

  // 7. Store / Update in Supabase Integrations table
  const { data: existingIntegration } = await supabase
    .from("integrations")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("client_id", clientId)
    .eq("provider", provider)
    .maybeSingle();

  let saveError = null;

  if (existingIntegration) {
    const { error } = await supabase
      .from("integrations")
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt,
        external_account_id: externalAccountId,
        metadata,
      })
      .eq("id", existingIntegration.id);
    saveError = error;
  } else {
    const { error } = await supabase.from("integrations").insert({
      agency_id: agencyId,
      client_id: clientId,
      provider,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      external_account_id: externalAccountId,
      metadata,
    });
    saveError = error;
  }

  if (saveError) {
    console.error("Failed to save integration credentials to database:", saveError.message);
    return NextResponse.redirect(`${redirectTarget}?error=database_save_failed`);
  }

  // Clear CSRF cookie and redirect back to client integrations UI with success
  const response = NextResponse.redirect(`${redirectTarget}?success=connected&provider=${provider}`);
  response.cookies.delete("oauth_csrf_token");
  return response;
}
