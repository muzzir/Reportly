import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrHealUserAgencyId } from "@/lib/supabase/agency-helper";
import { decodeOAuthState, getOAuthRedirectUri } from "@/lib/oauth/config";
import { oauthCallbackSchema } from "@/lib/validations/oauth";
import { encrypt } from "@/lib/security/encryption";
import { IntegrationProvider } from "@/types";
import { logger } from "@/lib/logger";
import { getAppBaseUrl } from "@/lib/utils/url";

export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl();

  // 1. Extract & validate search parameters
  const searchParamsObj = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = oauthCallbackSchema.safeParse(searchParamsObj);

  if (!parseResult.success) {
    console.error("Google OAuth callback Zod validation failed:", parseResult.error.issues);
    return NextResponse.redirect(`${baseUrl}/dashboard/clients?error=invalid_callback_params`);
  }

  const { code, state, error: oauthError, error_description } = parseResult.data;

  // Decode state payload to retrieve target clientId
  const statePayload = decodeOAuthState(state);
  const clientId = statePayload?.clientId;
  const redirectTarget = clientId
    ? `${baseUrl}/dashboard/clients/${clientId}/integrations`
    : `${baseUrl}/dashboard/integrations`;

  // 2. Handle cancellation or error from Google
  if (oauthError) {
    console.warn("Google OAuth flow cancelled or error returned:", oauthError, error_description);
    const response = NextResponse.redirect(`${redirectTarget}?error=oauth_cancelled`);
    response.cookies.delete("oauth_csrf_token");
    return response;
  }

  // 3. CSRF Verification & State Integrity
  const cookieCsrfToken = request.cookies.get("oauth_csrf_token")?.value;

  if (!statePayload || !cookieCsrfToken || statePayload.csrfToken !== cookieCsrfToken) {
    console.error("CSRF attack or invalid OAuth state detected.");
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

  // 4. Verify Authenticated User & Agency Membership
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const agencyId = await getOrHealUserAgencyId(user.id);
  if (!agencyId) {
    return NextResponse.redirect(`${redirectTarget}?error=no_agency_access`);
  }

  // Verify client belongs to user's agency
  const { data: client } = await supabase
    .from("clients")
    .select("id, agency_id")
    .eq("id", clientId)
    .single();

  if (!client || client.agency_id !== agencyId) {
    return NextResponse.redirect(`${redirectTarget}?error=no_agency_access`);
  }

  // 5. Token Exchange with Google OAuth2 Endpoint
  let rawAccessToken = "";
  let rawRefreshToken = "";
  let externalAccountId = "";
  let accountName = "Google Account";
  let accountEmail = user.email || "connected@google.com";
  let expiresInSeconds = 3600 * 24 * 30; // 30 days default

  if (process.env.MOCK_OAUTH === "true") {
    rawAccessToken = `mock_google_access_token_${Date.now()}`;
    rawRefreshToken = `mock_google_refresh_token_${Date.now()}`;
    accountName = "Google Ads Account (Client Main)";
    accountEmail = "ads-manager@agency.com";
    externalAccountId = "123-456-7890";
  } else {
    if (!code) {
      return NextResponse.redirect(`${redirectTarget}?error=missing_auth_code`);
    }

    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const callbackUrl = getOAuthRedirectUri("google_ads");

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: callbackUrl,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error("Token exchange failed for Google:", errText);
        await logger.error("google_oauth_callback", `Token exchange failed for Google: ${errText}`);
        return NextResponse.redirect(`${redirectTarget}?error=token_exchange_failed`);
      }

      const tokenData = await tokenResponse.json();
      rawAccessToken = tokenData.access_token || "";
      rawRefreshToken = tokenData.refresh_token || "";
      if (tokenData.expires_in) {
        expiresInSeconds = tokenData.expires_in;
      }

      externalAccountId = `google_${Date.now()}`;
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Google OAuth error";
      console.error("Unexpected error during Google OAuth callback:", err);
      await logger.error("google_oauth_callback", `Google OAuth callback error: ${errMessage}`);
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
  const providerKey: IntegrationProvider =
    statePayload.provider === "ga4" ? "ga4" : "google_ads";

  const { data: existingIntegration } = await supabase
    .from("integrations")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("client_id", clientId)
    .eq("provider", providerKey)
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
      provider: providerKey,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      external_account_id: externalAccountId,
      metadata,
    });
    saveError = error;
  }

  if (saveError) {
    console.error("Failed to save Google integration credentials to database:", saveError.message);
    return NextResponse.redirect(`${redirectTarget}?error=database_save_failed`);
  }

  // 8. Redirect back to client integrations UI with success=true
  const response = NextResponse.redirect(`${redirectTarget}?success=true&provider=${providerKey}`);
  response.cookies.delete("oauth_csrf_token");
  return response;
}
